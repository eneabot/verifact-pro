/**
 * French + multilingual sentiment scoring for credibility analysis
 * Returns 0 (very negative/alarmist) to 100 (very positive/calm)
 * 45-55 = neutral (good for journalism)
 */

// ── NEGATIVE / ALARMIST LEXICON (French) ─────────────────────────────────────
const NEGATIVE_WORDS: Record<string, number> = {
  // Alarmism / urgency
  'alerte': -4,
  'urgent': -5,
  'danger': -4,
  'crise': -3,
  'catastrophe': -5,
  'désastre': -5,
  'apocalypse': -6,
  'effondrement': -4,
  'collapse': -4,
  'choc': -4,
  'scandale': -5,
  'horrible': -4,
  'terrible': -4,
  'dévastateur': -5,
  'honteux': -4,
  'indignant': -4,

  // Fear & panic
  'panique': -5,
  'terreur': -5,
  'cauchemar': -5,
  'menace': -4,
  'péril': -4,
  'risque': -2,
  'crainte': -3,
  'effroi': -5,
  'épouvante': -5,
  'horreur': -5,
  'mort': -4,
  'tuer': -4,
  'massacre': -6,
  'génocide': -6,
  'guerre': -3,
  'attaque': -3,

  // Conspiracy / misinformation signals
  'complot': -6,
  'conspirat': -6,
  'caché': -4,
  'secret': -3,
  'manipulation': -5,
  'mensonge': -5,
  'tromperie': -5,
  'propagande': -5,
  'lavage de cerveau': -6,
  'fake': -5,
  'faux': -3,
  'désinformation': -4,
  'censure': -4,

  // Political extremism
  'invasion': -5,
  'infiltration': -5,
  'remplacemen': -5,
  'mondialiste': -5,
  'illuminati': -6,
  'soros': -5,
  'deep state': -5,
  'grande réinitialisation': -6,

  // Extreme negativity
  'inacceptable': -4,
  'inadmissible': -4,
  'scandaleux': -5,
  'révoltant': -4,
  'dégoûtant': -4,
  'abominable': -5,
  'monstrueux': -5,
  'criminel': -4,
  'corruption': -4,
  'trahi': -4,
  'sabotage': -4,
  'détruire': -3,
  'ruiner': -3,
  'voler': -3,

  // Sensationalism
  'exclusif': -2,
  'choquant': -4,
  'incroyable': -2,
  'hallucinant': -3,
  'stupéfiant': -3,
  'révélation': -2,
  'bombe': -3,
};

// ── POSITIVE / CREDIBILITY LEXICON (French) ──────────────────────────────────
const POSITIVE_WORDS: Record<string, number> = {
  // Journalistic sourcing
  'selon': +4,
  "d'après": +4,
  'indique': +3,
  'rapporte': +3,
  'précise': +3,
  'confirme': +3,
  'souligne': +3,
  'explique': +3,
  'déclare': +3,
  'affirme': +2,
  'annonce': +2,
  'communiqué': +4,

  // Institutional references
  'ministère': +4,
  'officiel': +4,
  'tribunal': +4,
  'jugement': +4,
  'rapport': +4,
  'étude': +4,
  'recherche': +4,
  'gouvernement': +3,
  'parlement': +3,
  'assemblée': +3,
  'sénat': +3,
  'préfecture': +3,
  'mairie': +3,
  'académie': +3,
  'université': +3,

  // Scientific / evidence-based
  'données': +3,
  'statistiques': +3,
  'chiffres': +3,
  'résultats': +3,
  'analyse': +3,
  'expertise': +3,
  'scientifique': +4,
  'expert': +3,
  'chercheur': +3,
  'médecin': +3,
  'professeur': +3,

  // Positive framing
  'progrès': +3,
  'amélioration': +3,
  'solution': +3,
  'coopération': +3,
  'dialogue': +3,
  'accord': +2,
  'paix': +3,
  'aide': +2,
  'soutien': +2,
  'solidarité': +3,
  'réussite': +3,
  'succès': +3,
  'avancée': +3,

  // Balanced/nuanced language
  'nuance': +3,
  'contexte': +3,
  'cependant': +2,
  'néanmoins': +2,
  'toutefois': +2,
  'en revanche': +2,
  'd\'une part': +2,
  'd\'autre part': +2,
};

// ── CLICKBAIT / ALARMIST PATTERNS ────────────────────────────────────────────
const CLICKBAIT_PATTERNS: Array<{ pattern: RegExp; penalty: number; label: string }> = [
  { pattern: /vous n['']en reviendrez pas/i, penalty: -15, label: 'Clickbait: "vous n\'en reviendrez pas"' },
  { pattern: /ce que les médias (cachent|ne disent pas)/i, penalty: -15, label: 'Complotisme: "ce que les médias cachent"' },
  { pattern: /ils ne veulent pas que vous (sachiez|soyez informés)/i, penalty: -15, label: 'Complotisme: "ils ne veulent pas..."' },
  { pattern: /la vérité (cachée|que vous|sur|derrière)/i, penalty: -12, label: 'Complotisme: "la vérité cachée"' },
  { pattern: /les médias (mentent|vous mentent|cachent)/i, penalty: -15, label: 'Attaque médias systématique' },
  { pattern: /vous n['']en croirez pas vos yeux/i, penalty: -12, label: 'Clickbait émotionnel' },
  { pattern: /BREAKING\s*:/i, penalty: -8, label: 'Urgence artificielle "BREAKING"' },
  { pattern: /🚨\s*ALERTE/i, penalty: -8, label: 'Alerte sensationnaliste' },
  { pattern: /partagez avant (que|la) (censure|suppression)/i, penalty: -15, label: 'Appel à partager avant censure' },
  { pattern: /ce qu['']on (vous cache|ne vous dit pas)/i, penalty: -12, label: 'Complotisme classique' },
  { pattern: /mainstream media/i, penalty: -8, label: 'Signal anti-mainstream' },
  { pattern: /puce (sous-cutanée|rfid|5g)/i, penalty: -15, label: 'Théorie complot puce' },
  { pattern: /vaccin.{0,20}(puce|micro-?chip|5g|nanobots)/i, penalty: -20, label: 'Désinformation vaccin' },
];

export interface SentimentResult {
  score: number;      // 0-100
  label: string;      // 'alarmiste' | 'neutre' | 'positif'
  signals: string[];  // what triggered the score
}

export function analyzeSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return { score: 50, label: 'neutre', signals: ['Texte vide — score neutre par défaut'] };
  }

  const signals: string[] = [];
  let rawScore = 0;   // unbounded accumulation

  const lower = text.toLowerCase();
  const words = text.split(/\s+/);

  // ── 1. Negative words ──────────────────────────────────────────────────────
  let negHits = 0;
  for (const [word, weight] of Object.entries(NEGATIVE_WORDS)) {
    if (lower.includes(word)) {
      rawScore += weight;
      negHits++;
    }
  }
  if (negHits > 0) {
    signals.push(`⚠️ ${negHits} mot(s) négatif(s)/alarmiste(s) détecté(s)`);
  }

  // ── 2. Positive words ─────────────────────────────────────────────────────
  let posHits = 0;
  for (const [word, weight] of Object.entries(POSITIVE_WORDS)) {
    if (lower.includes(word)) {
      rawScore += weight;
      posHits++;
    }
  }
  if (posHits > 0) {
    signals.push(`✓ ${posHits} signal(aux) de crédibilité détecté(s)`);
  }

  // ── 3. Clickbait / conspiracy patterns ────────────────────────────────────
  for (const { pattern, penalty, label } of CLICKBAIT_PATTERNS) {
    if (pattern.test(text)) {
      rawScore += penalty;
      signals.push(`🚨 ${label}`);
    }
  }

  // ── 4. Excessive caps ─────────────────────────────────────────────────────
  const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase() && /[A-ZÀÂÇÉÈÊËÎÏÔÛÙÜŸÆŒ]/.test(w));
  const capsRatio = capsWords.length / Math.max(words.length, 1);
  if (capsRatio > 0.15) {
    rawScore -= 10;
    signals.push(`⚠️ Majuscules excessives (${Math.round(capsRatio * 100)}% des mots)`);
  }

  // ── 5. Exclamation marks density ──────────────────────────────────────────
  const exclamations = (text.match(/!/g) || []).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  if (sentences > 0 && exclamations / sentences > 0.5) {
    rawScore -= 5;
    signals.push(`⚠️ Haute densité de points d'exclamation`);
  }

  // ── 6. Map rawScore to 0-100 ──────────────────────────────────────────────
  // rawScore is unbounded; typical range is roughly -80 to +40
  // We map: -60 → 0, 0 → 50, +40 → 80+
  const score = Math.max(0, Math.min(100, Math.round(50 + rawScore * 0.8)));

  // ── 7. Label ──────────────────────────────────────────────────────────────
  let label: string;
  if (score < 35) {
    label = 'alarmiste';
  } else if (score <= 65) {
    label = 'neutre';
  } else {
    label = 'positif';
  }

  if (signals.length === 0) {
    signals.push('Aucun signal notable — ton neutre');
  }

  return { score, label, signals };
}
