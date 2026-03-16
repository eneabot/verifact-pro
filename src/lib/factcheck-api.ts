/**
 * Google Fact Check Tools API Integration
 * https://developers.google.com/fact-check/tools/api/reference/rest
 *
 * Free tier: ~1000 queries/day without API key, more with key.
 */

export interface GoogleFactCheckClaim {
  text: string;
  claimant: string;
  claimDate: string;
  claimReview: {
    publisher: { name: string; site: string };
    url: string;
    title: string;
    reviewDate: string;
    textualRating: string;
    languageCode: string;
  }[];
}

export interface FactCheckResult {
  matches: GoogleFactCheckClaim[];
  credibilityBonus: number;  // 0-15 based on matches
  summary: string;
}

// ── CLAIM EXTRACTION ──────────────────────────────────────────────────────────

/**
 * Extract key claims from article text.
 * Picks 3–5 sentences that look most like factual assertions.
 */
export function extractKeyClaims(text: string): string[] {
  if (!text || text.trim().length === 0) return [];

  // Split into sentences
  const rawSentences = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.length < 250);

  // Score each sentence for claim-likelihood
  const scored = rawSentences.map(sentence => {
    let score = 0;
    const lower = sentence.toLowerCase();

    // Numbers / statistics → likely factual
    if (/\d+/.test(sentence)) score += 3;
    // Named entities (consecutive caps)
    const namedEntities = sentence.match(/\b[A-ZÀÂÇÉÈÊËÎÏÔÛÙÜŸÆŒ][a-zàâçéèêëîïôûùüÿæœ]+(?:\s+[A-ZÀÂÇÉÈÊËÎÏÔÛÙÜŸÆŒ][a-zàâçéèêëîïôûùüÿæœ]+)+/g);
    if (namedEntities) score += namedEntities.length;
    // Verbs of attribution → claim-like
    if (/selon|d'après|affirme|déclare|annonce|indique|rapporte|estime|soutient/i.test(lower)) score += 2;
    // Dates
    if (/\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|\d{4})\b/i.test(lower)) score += 2;
    // Avoid pure opinion markers
    if (/je pense|je crois|à mon avis|selon moi/i.test(lower)) score -= 3;

    return { sentence, score };
  });

  // Sort by score and take top 4
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(s => s.sentence);
}

// ── GOOGLE FACT CHECK API ─────────────────────────────────────────────────────

const GOOGLE_FC_BASE = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';

/**
 * Query Google Fact Check Tools API for a single claim.
 * Falls back to empty array on any error.
 */
export async function searchGoogleFactCheck(claim: string): Promise<GoogleFactCheckClaim[]> {
  const apiKey = process.env.GOOGLE_FACT_CHECK_API_KEY;

  // Build URL — key is optional for low-volume use
  const params = new URLSearchParams({
    query: claim.substring(0, 200), // API has a query length limit
    languageCode: 'fr',
  });
  if (apiKey) params.set('key', apiKey);

  const url = `${GOOGLE_FC_BASE}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      // Short timeout — we don't want to block the main pipeline
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        console.warn('Google Fact Check API quota/key issue:', response.status);
      }
      return [];
    }

    const data = await response.json() as { claims?: unknown[] };
    if (!data.claims || !Array.isArray(data.claims)) return [];

    return data.claims.map((item: unknown) => normalizeGoogleClaim(item));
  } catch (error) {
    // Timeout, network error, etc. — graceful degradation
    if (error instanceof Error && error.name !== 'TimeoutError') {
      console.error('Google Fact Check error:', error.message);
    }
    return [];
  }
}

// ── ARTICLE-LEVEL FACT CHECK ──────────────────────────────────────────────────

/**
 * Run the top claims from an article through Google Fact Check API
 * and return consolidated results.
 */
export async function checkArticleClaims(articleText: string): Promise<FactCheckResult> {
  const claims = extractKeyClaims(articleText);

  if (claims.length === 0) {
    return {
      matches: [],
      credibilityBonus: 0,
      summary: 'Aucune affirmation factuelle extraite',
    };
  }

  // Query in parallel (max 4 claims)
  const results = await Promise.allSettled(
    claims.slice(0, 4).map(claim => searchGoogleFactCheck(claim))
  );

  const allMatches: GoogleFactCheckClaim[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allMatches.push(...result.value);
    }
  }

  // Deduplicate by claim text
  const seen = new Set<string>();
  const deduped = allMatches.filter(m => {
    const key = m.text.substring(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Calculate credibility bonus based on verdicts
  const credibilityBonus = computeCredibilityBonus(deduped);

  const summary = deduped.length === 0
    ? 'Aucun résultat dans les bases de fact-checking'
    : `${deduped.length} affirmation(s) vérifiée(s) par des fact-checkers`;

  return {
    matches: deduped.slice(0, 5),  // Return at most 5
    credibilityBonus,
    summary,
  };
}

// ── HELPERS ────────────────────────────────────────────────────────────────────

/**
 * Compute a credibility bonus (0–15) from fact-check matches.
 * - Verified true claims → bonus
 * - Verified false claims → penalty (negative bonus, clamped to 0)
 * - Mixed / unverified → neutral
 */
function computeCredibilityBonus(matches: GoogleFactCheckClaim[]): number {
  if (matches.length === 0) return 0;

  let points = 0;
  for (const match of matches) {
    for (const review of match.claimReview) {
      const rating = review.textualRating.toLowerCase();
      if (/true|vrai|correct|exact|confirmé/i.test(rating)) {
        points += 3;
      } else if (/false|faux|incorrect|inexact|infondé|erroné/i.test(rating)) {
        points -= 5;
      } else if (/misleading|trompeur|partiellement/i.test(rating)) {
        points -= 2;
      }
      // unknown/unverified → 0
    }
  }

  return Math.max(0, Math.min(15, Math.round(points + 5))); // base offset of 5
}

/**
 * Safely normalize a raw Google API claim object into our type.
 */
function normalizeGoogleClaim(item: unknown): GoogleFactCheckClaim {
  const raw = item as Record<string, unknown>;
  const reviews: GoogleFactCheckClaim['claimReview'] = [];

  const rawReviews = raw['claimReview'];
  if (Array.isArray(rawReviews)) {
    for (const r of rawReviews) {
      const rev = r as Record<string, unknown>;
      const pub = (rev['publisher'] as Record<string, unknown>) || {};
      reviews.push({
        publisher: {
          name: String(pub['name'] || ''),
          site: String(pub['site'] || ''),
        },
        url: String(rev['url'] || ''),
        title: String(rev['title'] || ''),
        reviewDate: String(rev['reviewDate'] || ''),
        textualRating: String(rev['textualRating'] || 'Non évalué'),
        languageCode: String(rev['languageCode'] || 'fr'),
      });
    }
  }

  return {
    text: String(raw['text'] || ''),
    claimant: String(raw['claimant'] || 'Inconnu'),
    claimDate: String(raw['claimDate'] || ''),
    claimReview: reviews,
  };
}
