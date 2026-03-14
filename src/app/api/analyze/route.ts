import { NextRequest, NextResponse } from 'next/server';
import { findMediaSource } from '@/lib/mediaDB';
import { extractArticleContent, extractMetadata } from '@/lib/jina';
import { model } from '@/lib/ml/xgboost-model';
import { matchClaimsWithFactChecks } from '@/lib/factcheck-database';

interface LLMAnalysisResponse {
  score: number;
  label: string;
  satire: boolean;
  bias: string;
  justifications: string[];
}

/**
 * Main fact-checking endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // 1. Check media source (40% weight)
    const mediaSource = findMediaSource(url);
    
    if (mediaSource?.isParody) {
      return NextResponse.json({
        score: 0,
        label: '🤣 PARODIE / SATIRE',
        verdict: 'Ceci est un faux article (parodie)',
        satire: true,
        bias: mediaSource.bias,
        sourceScore: 0,
        contentScore: null,
        recommendations: {
          action: 'Ne pas partager comme fait réel',
          explanation: `${mediaSource.name} est un site de satire/parodie. Les articles ne sont pas réels.`
        },
        source: {
          name: mediaSource.name,
          type: mediaSource.type,
          description: mediaSource.description
        }
      });
    }

    let sourceScore = mediaSource?.baseScore ?? 50;
    const sourceWeight = 0.4;

    // 2. Extract article content
    let contentScore = 50; // default
    let llmAnalysis: LLMAnalysisResponse | null = null;

    try {
      const articleContent = await extractArticleContent(url);
      
      // 3. Analyze with LLM (60% weight)
      if (articleContent) {
        llmAnalysis = await analyzeLLM(articleContent, mediaSource?.name || 'Unknown');
        contentScore = llmAnalysis.score;
      }
    } catch (extractError) {
      console.error('Extraction error:', extractError);
      // If extraction fails, rely on source score only
      contentScore = sourceScore;
    }

    // 4. Calculate weighted score
    const contentWeight = 0.6;
    const finalScore = Math.round(sourceScore * sourceWeight + contentScore * contentWeight);

    // 5. Determine verdict
    let verdict: string;
    let label: string;
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

    // 6. Compile response
    const response = {
      score: finalScore,
      label,
      verdict,
      satire: false,
      bias: mediaSource?.bias || 'inconnu',
      sourceScore,
      contentScore,
      recommendations: {
        action: getActionByScore(finalScore),
        explanation: getExplanationByScore(finalScore, mediaSource)
      },
      source: mediaSource ? {
        name: mediaSource.name,
        type: mediaSource.type,
        description: mediaSource.description,
        isExtremist: mediaSource.isExtremist || false
      } : null,
      llmJustifications: llmAnalysis?.justifications || [],
      scoreBreakdown: {
        source: sourceScore,
        content: contentScore,
        final: finalScore
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * LLM-based content analysis
 * Uses OpenAI or Anthropic API
 */
async function analyzeLLM(
  articleContent: string,
  sourceNameFallback: string
): Promise<LLMAnalysisResponse> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.warn('No LLM API key configured, using fallback analysis');
    return getFallbackAnalysis(articleContent);
  }

  const systemPrompt = `Tu es un expert en fact-checking et analyse critique de contenu. Analyse l'article suivant pour déterminer :

1. **Score de fiabilité (0-100)** : Évalue basé sur :
   - Présence de preuves concrètes (citations, chiffres, sources)
   - Ton (neutre vs. sensationnaliste/émotionnel)
   - Logique (absence de sophismes, raccourcis complotistes)
   - Cohérence générale

2. **Satire** : Est-ce une parodie/satire d'article ?

3. **Biais politique** : Détecte le biais (gauche, centre-gauche, centre, centre-droit, droite)

4. **Justifications** : Liste 3-5 raisons concrètes pour le score

Réponds UNIQUEMENT en JSON valide (sans backticks) avec la structure suivante :
{
  "score": <number 0-100>,
  "label": "<string>",
  "satire": <boolean>,
  "bias": "<string>",
  "justifications": ["<reason1>", "<reason2>", "<reason3>"]
}`;

  try {
    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: articleContent.substring(0, 3000) } // Limit to 3000 chars
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse JSON response
      const parsed = JSON.parse(content);
      return parsed;
    }
  } catch (error) {
    console.error('LLM analysis error:', error);
  }

  // Fallback if API fails
  return getFallbackAnalysis(articleContent);
}

/**
 * Heuristic-based fallback analysis (no API call)
 */
function getFallbackAnalysis(articleContent: string): LLMAnalysisResponse {
  const contentLower = articleContent.toLowerCase();
  
  // Score heuristics
  let score = 50;

  // Check for red flags
  const sensationalismKeywords = ['incroyable', 'choquant', 'jamais', 'caché', 'ignorent', 'scandale', 'révélation exclusive'];
  const sensationalismCount = sensationalismKeywords.filter(kw => contentLower.includes(kw)).length;
  score -= sensationalismCount * 5;

  // Check for positive signals
  if (/https?:\/\//.test(articleContent)) score += 10; // Has links
  if (/"[^"]{20,}"/.test(articleContent)) score += 8; // Has quotes
  if (/\d{4}|\d{1,2}\/\d{1,2}\/\d{4}/.test(articleContent)) score += 5; // Has dates/numbers
  if (/selon|d'après|cité|source|rapporte/.test(contentLower)) score += 10; // Has sources

  // Detect bias
  const biasKeywords = {
    gauche: ['progressiste', 'social', 'égalité', 'justice', 'pauvreté'],
    droite: ['tradition', 'sécurité', 'liberté', 'économie', 'entreprise'],
  };

  let bias = 'centre';
  const leftCount = biasKeywords.gauche.filter(kw => contentLower.includes(kw)).length;
  const rightCount = biasKeywords.droite.filter(kw => contentLower.includes(kw)).length;
  
  if (leftCount > rightCount + 3) bias = 'gauche';
  else if (rightCount > leftCount + 3) bias = 'droite';

  // Clamp score
  score = Math.max(20, Math.min(90, score));

  return {
    score,
    label: score >= 70 ? 'Fiable' : 'À vérifier',
    satire: false,
    bias,
    justifications: [
      sensationalismCount > 0 ? `⚠️ ${sensationalismCount} mots sensationnalistes détectés` : '✓ Langage neutre',
      /https?:\/\//.test(articleContent) ? '✓ Présence de sources externes' : '⚠️ Pas de sources externes',
      /selon|d'après|cité/.test(contentLower) ? '✓ Utilise des citations/sources' : '⚠️ Pas de citations directes'
    ]
  };
}

function getActionByScore(score: number): string {
  if (score >= 75) return '✅ Peut être partagé avec confiance';
  if (score >= 55) return '⚠️ À fact-checker avant de partager';
  if (score >= 35) return '🚨 À vérifier absolument';
  return '🚫 Ne pas partager ou signaler comme faux';
}

function getExplanationByScore(score: number, source: any): string {
  let base = '';
  
  if (source) {
    base = `Source: ${source.name} (${source.type}). `;
  }

  if (score >= 75) {
    return base + 'Cette source a un historique de vérification rigoureuse.';
  } else if (score >= 55) {
    return base + 'La source a des antécédents mitigés. Vérifiez via d\'autres sources.';
  } else if (score >= 35) {
    return base + 'La source ou l\'article présente des signaux d\'alerte. Fact-check recommandé.';
  }
  
  return base + 'Cette source a un historique de désinformation. Extrêmement douteuse.';
}
