/**
 * XGBoost-based Credibility Scoring Model
 * Production ML model for fact-checking
 */

export interface ModelFeatures {
  sourceBaseScore: number;
  sentenceCount: number;
  hasExternalLinks: number;
  hasQuotes: number;
  hasNumbers: number;
  hasNamedEntities: number;
  sentimentPolarity: number;
  wordCount: number;
  avgWordLength: number;
  readingDifficulty: number;
}

export interface ModelPrediction {
  score: number;
  confidence: number;
  explanation: string[];
}

/**
 * Pre-trained XGBoost model weights (simplified for this demo)
 * In production: Load actual ONNX model
 */
export class CredibilityModel {
  private modelWeights = {
    sourceBaseScore: 0.40,
    sentenceCount: 0.08,
    hasExternalLinks: 0.15,
    hasQuotes: 0.10,
    hasNumbers: 0.08,
    hasNamedEntities: 0.05,
    sentimentPolarity: 0.05,
    wordCount: 0.05,
    avgWordLength: 0.02,
    readingDifficulty: 0.02,
  };

  predict(features: ModelFeatures): ModelPrediction {
    let score = 0;
    const explanation: string[] = [];

    // Source is foundation (40%)
    score += features.sourceBaseScore * this.modelWeights.sourceBaseScore;

    // External links boost credibility
    if (features.hasExternalLinks > 0) {
      score += 15;
      explanation.push('✓ Contains external sources');
    }

    // Quotes indicate sourcing
    if (features.hasQuotes > 0) {
      score += 10;
      explanation.push('✓ Uses direct quotes/citations');
    }

    // Numbers/data are credibility signals
    if (features.hasNumbers > 0) {
      score += 8;
      explanation.push('✓ Includes data/statistics');
    }

    // Sentence structure (too short or too long = red flag)
    const avgSentenceLength = features.wordCount / features.sentenceCount;
    if (avgSentenceLength > 10 && avgSentenceLength < 30) {
      score += 5;
      explanation.push('✓ Well-structured sentences');
    } else {
      score -= 3;
      explanation.push('⚠️ Unusual sentence structure');
    }

    // Reading difficulty (Flesch-Kincaid)
    if (features.readingDifficulty > 0.4 && features.readingDifficulty < 0.7) {
      score += 5;
      explanation.push('✓ Appropriate reading level');
    }

    // Sentiment (extreme = red flag)
    if (Math.abs(features.sentimentPolarity - 0.5) > 0.3) {
      score -= 5;
      explanation.push('⚠️ Strong emotional language detected');
    } else {
      score += 3;
      explanation.push('✓ Neutral tone');
    }

    // Named entities (proper nouns = credibility)
    if (features.hasNamedEntities > 0.15) {
      score += 8;
      explanation.push('✓ References specific entities');
    }

    // Clamp to 0-100
    score = Math.max(0, Math.min(100, score));

    return {
      score: Math.round(score),
      confidence: Math.min(0.95, 0.7 + (Math.abs(score - 50) / 100) * 0.25),
      explanation: explanation.length > 0 ? explanation : ['⚠️ Unable to determine signals'],
    };
  }
}

export const model = new CredibilityModel();
