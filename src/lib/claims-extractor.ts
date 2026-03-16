/**
 * Claim Extraction Module
 * Heuristic-based extraction of factual claims from article text
 * No ML needed — uses simple pattern matching and sentence scoring
 */

export interface Claim {
  text: string;
  startIndex: number;
  endIndex: number;
  confidence: number;  // 0-1, likelihood this is a verifiable claim
}

// French predicate verbs that indicate claims
const FRENCH_PREDICATES = [
  'affirme', 'confirme', 'révèle', 'déclare', 'prouve', 'indique', 'estime',
  'annonce', 'rapporte', 'selon', 'd\'après', 'cité', 'établit', 'démontre',
  'revendique', 'prétend', 'soutient', 'assure', 'prétendre', 'reconnaît',
];

/**
 * Extract top 6-8 factual claims from article text
 * Heuristic: sentences with 15+ words, named entities, numbers, or predicate verbs
 * Avoids: pure description, questions, opinions, first/second person
 */
export function extractClaims(articleText: string): Claim[] {
  if (!articleText || articleText.trim().length === 0) {
    return [];
  }

  // Split into sentences, preserve positions
  const sentenceMatches = Array.from(articleText.matchAll(/[^.!?]*[.!?]/g));
  const sentences: Array<{ text: string; start: number; end: number }> = [];

  for (const match of sentenceMatches) {
    const text = match[0].trim();
    if (text.length > 30 && text.length < 500) {  // reasonable sentence length
      sentences.push({
        text,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Score each sentence for claim-likelihood
  const scoredSentences = sentences.map(s => ({
    ...s,
    confidence: scoreClaimLikelihood(s.text),
  }));

  // Filter and sort
  const filtered = scoredSentences
    .filter(s => s.confidence > 0.3)  // at least 30% confidence
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);  // top 8 claims

  // Return in original document order for better reading experience
  const result: Claim[] = filtered
    .sort((a, b) => a.start - b.start)
    .map((s, i) => ({
      text: s.text,
      startIndex: s.start,
      endIndex: s.end,
      confidence: s.confidence,
    }));

  return result;
}

/**
 * Score a sentence for how likely it is to contain a verifiable claim
 * Returns 0-1 confidence score
 */
function scoreClaimLikelihood(sentence: string): number {
  let score = 0.2;  // baseline

  const lower = sentence.toLowerCase();

  // Ignore patterns that signal non-factual statements
  if (/^(je|tu|on|nous|vous)\s/.test(lower)) {
    return 0;  // first/second person → opinion, not claim
  }

  if (sentence.trim().endsWith('?')) {
    return 0;  // question, not assertion
  }

  if (/^\s*(si|peut-être|possiblement|vraisemblablement|il semble|on dirait)/i.test(sentence)) {
    return 0;  // conditional or uncertain → not a claim
  }

  // Named entities (consecutive capitalized words)
  const namedEntities = sentence.match(/\b[A-ZÀÂÇÉÈÊËÎÏÔÛÙÜŸÆŒ][a-zàâçéèêëîïôûùüÿæœ]+(?:\s+[A-ZÀÂÇÉÈÊËÎÏÔÛÙÜŸÆŒ][a-zàâçéèêëîïôûùüÿæœ]+)+/g);
  if (namedEntities && namedEntities.length > 0) {
    score += 0.25;  // entities are often claims
  }

  // Numbers and dates
  if (/\d+/.test(sentence)) {
    score += 0.2;  // numbers/stats are factual
  }

  // French months or years
  if (/\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|\d{4})\b/i.test(lower)) {
    score += 0.15;
  }

  // Predicate verbs that indicate claims
  for (const verb of FRENCH_PREDICATES) {
    if (lower.includes(verb)) {
      score += 0.25;
      break;  // don't double-count
    }
  }

  // Strong assertion verbs
  if (/\b(est|sont|a|ont|existe|confirme|montre|indique|révèle|apparaît|résulte|provoque)\b/i.test(lower)) {
    score += 0.1;
  }

  // Specific statistics patterns
  if (/\b\d+\s*(pour\scent|%|millions?|milliards?|euros?|dollars?)/i.test(lower)) {
    score += 0.15;
  }

  // Avoid pure descriptive/narrative sentences
  if (/il y a|il existe|selon|d'après|par rapport|alors que/i.test(lower)) {
    score += 0.05;
  }

  // Penalize common opinion starters
  if (/\b(je pense|je crois|à mon avis|selon moi|je suis|on pense|les gens|beaucoup|certains)/i.test(lower)) {
    score -= 0.1;
  }

  return Math.max(0, Math.min(1, score));  // clamp to 0-1
}
