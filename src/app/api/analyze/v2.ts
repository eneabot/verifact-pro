/**
 * v2 Analyze Endpoint
 * ML-powered + Fact-Check integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { findMediaSource } from '@/lib/mediaDB';
import { extractArticleContent } from '@/lib/jina';
import { model, ModelFeatures } from '@/lib/ml/xgboost-model';
import { matchClaimsWithFactChecks } from '@/lib/factcheck-database';

interface AnalysisRequest {
  url: string;
}

interface AnalysisResponse {
  score: number;
  label: string;
  verdict: string;
  satire: boolean;
  bias: string;
  sourceScore: number;
  mlScore: number;
  mlConfidence: number;
  factCheckMatches: number;
  recommendations: {
    action: string;
    explanation: string;
  };
  mlJustifications: string[];
  source: {
    name: string;
    type: string;
    description: string;
  } | null;
  scoreBreakdown: {
    source: number;
    ml: number;
    factCheck: number;
    final: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as AnalysisRequest;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // 1. Check media source
    const mediaSource = findMediaSource(url);
    
    if (mediaSource?.isParody) {
      return NextResponse.json({
        score: 0,
        label: '🤣 PARODIE / SATIRE',
        verdict: 'Ceci est un faux article (parodie)',
        satire: true,
        bias: mediaSource.bias,
        sourceScore: 0,
        mlScore: 0,
        mlConfidence: 1.0,
        factCheckMatches: 0,
        recommendations: {
          action: 'Ne pas partager',
          explanation: `${mediaSource.name} est une source satirique.`,
        },
        mlJustifications: ['Source is confirmed satire/parody'],
        source: {
          name: mediaSource.name,
          type: mediaSource.type,
          description: mediaSource.description,
        },
        scoreBreakdown: {
          source: 0,
          ml: 0,
          factCheck: 0,
          final: 0,
        },
      });
    }

    let sourceScore = mediaSource?.baseScore ?? 50;
    let articleContent = '';
    
    // 2. Extract article content
    try {
      articleContent = await extractArticleContent(url);
    } catch (error) {
      console.error('Extraction error:', error);
      articleContent = '';
    }

    // 3. ML-based content analysis
    const mlFeatures = extractFeatures(articleContent, sourceScore);
    const mlPrediction = model.predict(mlFeatures);

    // 4. Fact-check database matching
    const factCheckMatch = await matchClaimsWithFactChecks(articleContent);
    const factCheckBonus = factCheckMatch.confidence * 15; // Max +15 points

    // 5. Calculate final score
    const mlScore = mlPrediction.score;
    const finalScore = Math.round(
      sourceScore * 0.35 + // Source: 35%
      mlScore * 0.50 +      // ML Content: 50%
      factCheckBonus * 0.15 // Fact-checks: 15%
    );

    // 6. Determine verdict
    let label: string;
    let verdict: string;

    if (finalScore >= 75) {
      label = '✅ SOURCE FIABLE';
      verdict = 'Source de confiance — vérification rigoureuse recommandée';
    } else if (finalScore >= 55) {
      label = '⚠️ PRUDENCE';
      verdict = 'À lire avec attention — fact-check recommandé';
    } else if (finalScore >= 35) {
      label = '⚠️ TRÈS DOUTEUSE';
      verdict = 'Vérifier absolument — historique problématique';
    } else {
      label = '🚨 DÉSINFORMATION';
      verdict = 'Probable désinformation — ne pas partager';
    }

    return NextResponse.json({
      score: finalScore,
      label,
      verdict,
      satire: false,
      bias: mediaSource?.bias || 'inconnu',
      sourceScore,
      mlScore,
      mlConfidence: mlPrediction.confidence,
      factCheckMatches: factCheckMatch.matchedClaims.size,
      recommendations: {
        action: getActionByScore(finalScore),
        explanation: getExplanationByScore(finalScore),
      },
      mlJustifications: mlPrediction.explanation,
      source: mediaSource ? {
        name: mediaSource.name,
        type: mediaSource.type,
        description: mediaSource.description,
      } : null,
      scoreBreakdown: {
        source: sourceScore,
        ml: mlScore,
        factCheck: Math.round(factCheckBonus),
        final: finalScore,
      },
    } as AnalysisResponse);

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

function extractFeatures(content: string, sourceScore: number): ModelFeatures {
  const words = content.split(/\s+/);
  const sentences = content.split(/[.!?]+/);
  
  return {
    sourceBaseScore: sourceScore,
    sentenceCount: sentences.length,
    hasExternalLinks: /https?:\/\//.test(content) ? 1 : 0,
    hasQuotes: /["«»"]/.test(content) ? 1 : 0,
    hasNumbers: /\d+/.test(content) ? 1 : 0,
    hasNamedEntities: countCapitalWords(words) / words.length,
    sentimentPolarity: 0.5, // Placeholder
    wordCount: words.length,
    avgWordLength: words.reduce((sum, w) => sum + w.length, 0) / words.length,
    readingDifficulty: 0.5, // Placeholder
  };
}

function countCapitalWords(words: string[]): number {
  return words.filter(w => w && /^[A-Z]/.test(w)).length;
}

function getActionByScore(score: number): string {
  if (score >= 75) return '✅ Peut être partagé avec confiance';
  if (score >= 55) return '⚠️ À fact-checker avant de partager';
  if (score >= 35) return '🚨 À vérifier absolument';
  return '🚫 Ne pas partager ou signaler comme faux';
}

function getExplanationByScore(score: number): string {
  if (score >= 75) return 'Cette source a un bon historique de vérification.';
  if (score >= 55) return 'La source a des antécédents mitigés. Vérifiez via d\'autres sources.';
  if (score >= 35) return 'La source présente des signaux d\'alerte. Fact-check recommandé.';
  return 'Cette source a un historique de désinformation. Extrêmement douteuse.';
}
