/**
 * XGBoost-based Credibility Scoring Model — v2
 * ML-first scoring with enhanced French + English lexicons
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

// ── SENSATIONALISM LEXICON (French + English) ─────────────────────────────────
// Negative signals → lower credibility
const RED_FLAG_WORDS: Record<string, number> = {
  // French — conspiracy / misinformation
  'incroyable': -2,
  'choquant': -3,
  'exclusif': -2,
  'révélé': -2,
  'caché': -3,
  'complot': -5,
  'choc': -3,
  'urgent': -3,
  'breaking': -3,
  'scandale': -4,
  'ils ne veulent pas que vous sachiez': -5,
  'mainstream': -3,
  'fake news': -3,
  'deep state': -5,
  'vérité cachée': -5,
  'médias mentent': -5,
  'vaccin dangereux': -5,
  'puce': -3,
  'mondialiste': -5,
  'soros': -5,
  'wef': -4,
  'illuminati': -5,
  'grande réinitialisation': -5,
  'biopuce': -5,
  'microchip': -4,
  'bill gates': -3,
  // Additional French red-flags
  'invraisemblable': -3,
  'ahurissant': -3,
  'stupéfiant': -3,
  'manipulation': -4,
  'propagande': -4,
  'mensonge': -4,
  'conspiration': -5,
  'complotiste': -4,
  'censure': -3,
  'invasion': -4,
  'alerte': -2,
  'catastrophe': -3,
  // English red-flags
  'shocking': -3,
  'unbelievable': -3,
  'they dont want you to know': -5,
  'hidden truth': -5,
  'secret agenda': -5,
  'globalist': -4,
  'nwo': -4,
  'plandemic': -5,
  'hoax': -4,
  'coverup': -4,
  'cover-up': -4,
};

// Positive credibility signals (French + English)
const CREDIBILITY_SIGNALS: Record<string, number> = {
  // French
  'selon': +3,
  "d'après": +4,
  'communiqué': +4,
  'rapporte': +3,
  'indique': +3,
  'étude': +4,
  'recherche': +4,
  'source': +3,
  'ministère': +5,
  'officiel': +4,
  'conférence de presse': +5,
  'tribunal': +4,
  'jugement': +4,
  'rapport': +4,
  'précise': +3,
  'confirme': +3,
  'souligne': +3,
  'données': +3,
  'statistiques': +3,
  'scientifique': +4,
  'expert': +3,
  'chercheur': +3,
  'académie': +4,
  'université': +3,
  'professeur': +3,
  'analyse': +3,
  // English
  'according to': +3,
  'study shows': +4,
  'research': +3,
  'official': +4,
  'confirmed': +3,
  'report': +3,
  'data': +3,
};

// ── CLICKBAIT PATTERNS ────────────────────────────────────────────────────────
const CLICKBAIT_PATTERNS: Array<{ pattern: RegExp; penalty: number; label: string }> = [
  { pattern: /vous n['']en reviendrez pas/i, penalty: -15, label: 'Clickbait: "vous n\'en reviendrez pas"' },
  { pattern: /ce que les médias (cachent|ne disent pas)/i, penalty: -15, label: 'Complotisme médiatique' },
  { pattern: /ils ne veulent pas que vous (sachiez|soyez)/i, penalty: -15, label: 'Complotisme classique' },
  { pattern: /partagez avant (censure|suppression)/i, penalty: -15, label: 'Appel à partager avant censure' },
  { pattern: /BREAKING\s*:/i, penalty: -8, label: 'Urgence artificielle' },
  { pattern: /🚨\s*ALERTE/i, penalty: -8, label: 'Alerte sensationnaliste' },
  { pattern: /vaccin.{0,20}(puce|chip|5g|nanotechnologie)/i, penalty: -20, label: 'Désinformation vaccin' },
  { pattern: /ce qu['']on (vous cache|ne vous dit pas)/i, penalty: -12, label: 'Complotisme' },
];

// ── MODEL ─────────────────────────────────────────────────────────────────────

export class CredibilityModel {
  /**
   * Predict credibility score from pre-computed features.
   * Base ML scoring; full text bonuses applied in scoreContent().
   */
  predict(features: ModelFeatures): ModelPrediction {
    let score = 0;
    const explanation: string[] = [];

    // External links boost credibility
    if (features.hasExternalLinks > 0) {
      score += 15;
      explanation.push('✓ Présence de sources/liens externes');
    } else {
      score -= 5;
      explanation.push('⚠️ Aucun lien externe trouvé');
    }

    // Quotes indicate sourcing
    if (features.hasQuotes > 0) {
      score += 10;
      explanation.push('✓ Citations directes présentes');
    }

    // Numbers/data are credibility signals
    if (features.hasNumbers > 0) {
      score += 8;
      explanation.push('✓ Données chiffrées présentes');
    }

    // Sentence structure (too short or too long = red flag)
    if (features.sentenceCount > 0) {
      const avgSentenceLength = features.wordCount / features.sentenceCount;
      if (avgSentenceLength > 8 && avgSentenceLength < 35) {
        score += 5;
        explanation.push('✓ Structure des phrases équilibrée');
      } else if (avgSentenceLength <= 5) {
        score -= 5;
        explanation.push('⚠️ Phrases trop courtes (style télégraphique)');
      } else {
        score -= 2;
        explanation.push('⚠️ Structure des phrases inhabituelle');
      }
    }

    // Sentiment extremity
    if (Math.abs(features.sentimentPolarity - 0.5) > 0.3) {
      score -= 5;
      explanation.push('⚠️ Ton émotionnel fort détecté');
    } else {
      score += 3;
      explanation.push('✓ Ton neutre');
    }

    // Named entities
    if (features.hasNamedEntities > 0.15) {
      score += 8;
      explanation.push('✓ Entités nommées spécifiques présentes');
    }

    // Word count — very short = low quality signal
    if (features.wordCount < 100) {
      score -= 8;
      explanation.push('⚠️ Contenu très court');
    } else if (features.wordCount > 400) {
      score += 5;
      explanation.push('✓ Article développé');
    }

    // Clamp base to 0-80 (lexical analysis adds the rest)
    score = Math.max(0, Math.min(80, score));

    return {
      score: Math.round(score),
      confidence: Math.min(0.95, 0.6 + (Math.abs(score - 40) / 80) * 0.35),
      explanation: explanation.length > 0 ? explanation : ['⚠️ Aucun signal détectable'],
    };
  }

  /**
   * Full text analysis — lexicons + patterns + structural signals.
   * Returns a score delta (positive or negative) to add to base ML score.
   */
  scoreContent(text: string): { delta: number; explanation: string[] } {
    if (!text || text.trim().length === 0) {
      return { delta: 0, explanation: [] };
    }

    const lower = text.toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const explanation: string[] = [];
    let delta = 0;

    // ── Red flag lexicon ─────────────────────────────────────────────────────
    let redFlagCount = 0;
    for (const [word, weight] of Object.entries(RED_FLAG_WORDS)) {
      if (lower.includes(word)) {
        delta += weight;
        redFlagCount++;
      }
    }
    if (redFlagCount > 0) {
      explanation.push(`⚠️ ${redFlagCount} mot(s) sensationnaliste(s) détecté(s)`);
    }

    // ── Credibility signals lexicon ──────────────────────────────────────────
    let credSignalCount = 0;
    for (const [word, weight] of Object.entries(CREDIBILITY_SIGNALS)) {
      if (lower.includes(word)) {
        delta += weight;
        credSignalCount++;
      }
    }
    if (credSignalCount > 0) {
      explanation.push(`✓ ${credSignalCount} signal(aux) de crédibilité journalistique`);
    }

    // ── Excessive CAPS ratio ─────────────────────────────────────────────────
    const capsWords = words.filter(w =>
      w.length > 2 &&
      w === w.toUpperCase() &&
      /[A-ZÀÂÇÉÈÊËÎÏÔÛÙÜŸÆŒ]/.test(w)
    );
    const capsRatio = capsWords.length / Math.max(words.length, 1);
    if (capsRatio > 0.15) {
      delta -= 10;
      explanation.push(`⚠️ Utilisation excessive des majuscules (${Math.round(capsRatio * 100)}%)`);
    }

    // ── Clickbait patterns ───────────────────────────────────────────────────
    for (const { pattern, penalty, label } of CLICKBAIT_PATTERNS) {
      if (pattern.test(text)) {
        delta += penalty;
        explanation.push(`🚨 ${label}`);
      }
    }

    // ── URLs in text → cited sources ─────────────────────────────────────────
    const urlMatches = text.match(/https?:\/\/[^\s)>\"]+/g) || [];
    if (urlMatches.length >= 2) {
      delta += 8;
      explanation.push(`✓ ${urlMatches.length} URL(s) citée(s) dans le texte`);
    } else if (urlMatches.length === 1) {
      delta += 4;
      explanation.push('✓ Source externe citée dans le texte');
    }

    return { delta, explanation };
  }
}

export const model = new CredibilityModel();
