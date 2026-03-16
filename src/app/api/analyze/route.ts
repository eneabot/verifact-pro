/**
 * verifact PRO — Main Analysis Endpoint v3
 * ML-first pipeline with optional LLM enhancement
 *
 * Pipeline:
 *   1. Media source DB lookup      (35% weight)
 *   2. Content extraction via Jina
 *   3. ML credibility scoring      (40% weight)
 *   4. Google Fact Check API       (15% weight)
 *   5. Sentiment analysis          (10% weight)
 *   6. LLM enhancement (optional)
 *   7. Unified response
 */

import { NextRequest, NextResponse } from 'next/server';
import { findMediaSource } from '@/lib/mediaDB';
import { extractArticleContent } from '@/lib/jina';
import { model } from '@/lib/ml/xgboost-model';
import { checkArticleClaims, GoogleFactCheckClaim } from '@/lib/factcheck-api';
import { analyzeSentiment } from '@/lib/sentiment';
import { buildClaimsAnalysis } from './detailed';

// ── TYPES ─────────────────────────────────────────────────────────────────────

export interface FactCheckMatch {
  text: string;
  claimant: string;
  claimDate: string;
  textualRating: string;
  publisherName: string;
  publisherSite: string;
  reviewUrl: string;
}

export interface AnalysisResponse {
  score: number;
  label: string;
  verdict: string;
  satire: boolean;
  bias: string;
  sourceScore: number;
  mlScore: number;
  mlConfidence: number;
  sentimentScore: number;
  factCheckMatches: FactCheckMatch[];
  recommendations: { action: string; explanation: string };
  mlJustifications: string[];
  source: { name: string; type: string; description: string; isExtremist?: boolean } | null;
  scoreBreakdown: { source: number; ml: number; sentiment: number; factCheck: number; final: number };
  claimsAnalysis?: {
    claims: Array<{
      text: string;
      confidence: number;
      factCheckMatches: Array<{
        claim: string;
        rating: string;
        source: string;
        url: string;
        publisherName: string;
      }>;
      status: 'verified_true' | 'verified_false' | 'unverified' | 'mixed';
      explanation: string;
    }>;
    summary: string;
  };
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { url, detailed } = await req.json() as { url?: string; detailed?: boolean };

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const isDetailed = detailed === true;

    // ── 1. Media source lookup ───────────────────────────────────────────────
    const mediaSource = findMediaSource(url);

    if (mediaSource?.isParody) {
      const parodyResponse: AnalysisResponse = {
        score: 0,
        label: '🤣 PARODIE / SATIRE',
        verdict: 'Ceci est un faux article (parodie)',
        satire: true,
        bias: mediaSource.bias,
        sourceScore: 0,
        mlScore: 0,
        mlConfidence: 1.0,
        sentimentScore: 50,
        factCheckMatches: [],
        recommendations: {
          action: 'Ne pas partager comme fait réel',
          explanation: `${mediaSource.name} est un site de satire/parodie. Les articles ne sont pas réels.`,
        },
        mlJustifications: ['Source confirmée comme parodie/satire'],
        source: { name: mediaSource.name, type: mediaSource.type, description: mediaSource.description },
        scoreBreakdown: { source: 0, ml: 0, sentiment: 50, factCheck: 0, final: 0 },
      };
      return NextResponse.json(parodyResponse);
    }

    const sourceScore = mediaSource?.baseScore ?? 50;

    // ── 2. Content extraction ────────────────────────────────────────────────
    let articleContent = '';
    try {
      articleContent = await extractArticleContent(url);
    } catch {
      console.warn('Content extraction failed — using source-only scoring');
    }

    // ── 3. ML scoring ────────────────────────────────────────────────────────
    const words = articleContent.split(/\s+/).filter(w => w.length > 0);
    const sentences = articleContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase() && /[A-ZÀÂÇÉÈÊËÎÏÔÛÙÜŸÆŒ]/.test(w));

    const mlFeatures = {
      sourceBaseScore: sourceScore,
      sentenceCount: Math.max(sentences.length, 1),
      hasExternalLinks: /https?:\/\//.test(articleContent) ? 1 : 0,
      hasQuotes: /["«»""]/.test(articleContent) ? 1 : 0,
      hasNumbers: /\d+/.test(articleContent) ? 1 : 0,
      hasNamedEntities: countCapitalWords(words) / Math.max(words.length, 1),
      sentimentPolarity: 0.5, // will be updated from sentiment analysis
      wordCount: words.length,
      avgWordLength: words.length > 0
        ? words.reduce((sum, w) => sum + w.length, 0) / words.length
        : 5,
      readingDifficulty: 0.5,
    };

    const mlPrediction = model.predict(mlFeatures);
    const contentDelta = model.scoreContent(articleContent);

    const rawMlScore = mlPrediction.score + contentDelta.delta;
    const mlScore = Math.max(0, Math.min(100, rawMlScore));
    const mlJustifications = [...mlPrediction.explanation, ...contentDelta.explanation];

    // ── 4. Google Fact Check ─────────────────────────────────────────────────
    let factCheckBonus = 0;
    let factCheckMatches: FactCheckMatch[] = [];

    try {
      const fcResult = await checkArticleClaims(articleContent);
      factCheckBonus = fcResult.credibilityBonus;
      factCheckMatches = normalizeFactCheckMatches(fcResult.matches);
      if (fcResult.summary && fcResult.summary !== 'Aucun résultat dans les bases de fact-checking') {
        mlJustifications.push(`🔍 Fact-checks: ${fcResult.summary}`);
      }
    } catch {
      console.warn('Fact-check API failed — skipping');
    }

    // ── 5. Sentiment analysis ────────────────────────────────────────────────
    const sentiment = analyzeSentiment(articleContent);
    const sentimentScore = sentiment.score;

    // Map sentiment score to credibility impact
    // Neutral (45-55) → +5, very alarmist (<25) → -10, very positive (>80) → +3
    let sentimentImpact = 0;
    if (sentimentScore >= 45 && sentimentScore <= 65) {
      sentimentImpact = 5;
    } else if (sentimentScore < 25) {
      sentimentImpact = -10;
    } else if (sentimentScore < 35) {
      sentimentImpact = -5;
    } else if (sentimentScore > 75) {
      sentimentImpact = 3;
    }

    if (sentiment.signals.length > 0) {
      mlJustifications.push(...sentiment.signals.slice(0, 2));
    }

    // ── 6. Optional LLM enhancement ─────────────────────────────────────────
    let llmBoost = 0;
    if (articleContent && (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY)) {
      try {
        const llmResult = await callLLMAnalysis(articleContent, mediaSource?.name ?? 'inconnu');
        if (llmResult) {
          llmBoost = llmResult.scoreDelta;
          mlJustifications.push(`🤖 IA: ${llmResult.summary}`);
        }
      } catch {
        console.warn('LLM enhancement failed — skipping');
      }
    }

    // ── 7. Weighted final score ──────────────────────────────────────────────
    // Weights: source 35%, ML content 40%, fact-check 15%, sentiment 10%
    const sentimentContrib = sentimentScore * 0.10;
    const factCheckContrib = factCheckBonus;          // already 0-15

    const finalScore = Math.round(
      Math.max(0, Math.min(100,
        sourceScore * 0.35 +
        mlScore * 0.40 +
        sentimentContrib +
        factCheckContrib * (15 / 100) * 100 * 0.15 / 15 + // normalize to 0-15 range contribution
        llmBoost
      ))
    );

    // ── 8. Verdict ───────────────────────────────────────────────────────────
    const { label, verdict } = getVerdict(finalScore);

    // ── 9. Optional: Claim-level analysis ────────────────────────────────────
    let claimsAnalysis: AnalysisResponse['claimsAnalysis'] | undefined;
    if (isDetailed && articleContent) {
      try {
        claimsAnalysis = await buildClaimsAnalysis(articleContent);
      } catch (error) {
        console.warn('Claims analysis failed — skipping:', error);
      }
    }

    const response: AnalysisResponse = {
      score: finalScore,
      label,
      verdict,
      satire: false,
      bias: mediaSource?.bias ?? 'inconnu',
      sourceScore,
      mlScore,
      mlConfidence: mlPrediction.confidence,
      sentimentScore,
      factCheckMatches,
      recommendations: {
        action: getActionByScore(finalScore),
        explanation: getExplanationByScore(finalScore, mediaSource),
      },
      mlJustifications: dedupeJustifications(mlJustifications),
      source: mediaSource
        ? {
            name: mediaSource.name,
            type: mediaSource.type,
            description: mediaSource.description,
            isExtremist: mediaSource.isExtremist ?? false,
          }
        : null,
      scoreBreakdown: {
        source: sourceScore,
        ml: mlScore,
        sentiment: sentimentScore,
        factCheck: factCheckBonus,
        final: finalScore,
      },
      ...(claimsAnalysis && { claimsAnalysis }),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function countCapitalWords(words: string[]): number {
  return words.filter(w => w.length > 0 && /^[A-ZÀÂÇÉÈÊËÎÏÔÛÙÜŸÆŒ]/.test(w)).length;
}

function getVerdict(score: number): { label: string; verdict: string } {
  if (score >= 75) return { label: '✅ SOURCE FIABLE', verdict: 'Source de confiance — vérification rigoureuse recommandée' };
  if (score >= 55) return { label: '⚠️ PRUDENCE', verdict: 'À lire avec attention — fact-check recommandé' };
  if (score >= 35) return { label: '⚠️ TRÈS DOUTEUSE', verdict: 'Vérifier absolument — historique problématique' };
  return { label: '🚨 DÉSINFORMATION', verdict: 'Probable désinformation — ne pas partager' };
}

function getActionByScore(score: number): string {
  if (score >= 75) return '✅ Peut être partagé avec confiance';
  if (score >= 55) return '⚠️ À fact-checker avant de partager';
  if (score >= 35) return '🚨 À vérifier absolument';
  return '🚫 Ne pas partager ou signaler comme faux';
}

function getExplanationByScore(score: number, source: { name: string; type: string } | null): string {
  const sourcePart = source ? `Source: ${source.name} (${source.type}). ` : '';
  if (score >= 75) return `${sourcePart}Cette source a un historique de vérification rigoureuse.`;
  if (score >= 55) return `${sourcePart}La source a des antécédents mitigés. Vérifiez via d'autres sources.`;
  if (score >= 35) return `${sourcePart}La source présente des signaux d'alerte. Fact-check recommandé.`;
  return `${sourcePart}Cette source a un historique de désinformation. Extrêmement douteuse.`;
}

function normalizeFactCheckMatches(claims: GoogleFactCheckClaim[]): FactCheckMatch[] {
  const matches: FactCheckMatch[] = [];
  for (const claim of claims) {
    for (const review of claim.claimReview) {
      matches.push({
        text: claim.text,
        claimant: claim.claimant,
        claimDate: claim.claimDate,
        textualRating: review.textualRating,
        publisherName: review.publisher.name,
        publisherSite: review.publisher.site,
        reviewUrl: review.url,
      });
    }
  }
  return matches.slice(0, 5);
}

function dedupeJustifications(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result.slice(0, 8); // max 8 justifications
}

// ── OPTIONAL LLM ENHANCEMENT ──────────────────────────────────────────────────

async function callLLMAnalysis(
  content: string,
  sourceName: string
): Promise<{ scoreDelta: number; summary: string } | null> {
  const prompt = `Analyse cet article de "${sourceName}" en 1-2 phrases courtes.
Réponds en JSON: {"scoreDelta": <number -10 to +10>, "summary": "<string max 100 chars>"}
Le scoreDelta doit refléter si le contenu est crédible (+) ou problématique (-).
Article (extrait): ${content.substring(0, 1500)}`;

  // Try Anthropic first (cheaper)
  if (process.env.ANTHROPIC_API_KEY) {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-20240307',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (resp.ok) {
      const data = await resp.json() as { content: { text: string }[] };
      const text = data.content?.[0]?.text || '';
      const match = text.match(/\{[^}]+\}/);
      if (match) return JSON.parse(match[0]);
    }
  }

  // Try OpenAI
  if (process.env.OPENAI_API_KEY) {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (resp.ok) {
      const data = await resp.json() as { choices: { message: { content: string } }[] };
      const text = data.choices?.[0]?.message?.content || '';
      const match = text.match(/\{[^}]+\}/);
      if (match) return JSON.parse(match[0]);
    }
  }

  return null;
}
