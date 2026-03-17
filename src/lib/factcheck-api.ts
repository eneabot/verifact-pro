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

export interface ClaimCheckResult {
  status: 'verified_true' | 'verified_false' | 'unverified' | 'mixed';
  matches: {
    claim: string;
    rating: string;
    source: string;
    url: string;
    publisherName: string;
  }[];
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

// ── GROQ AI FALLBACK ──────────────────────────────────────────────────────────

export interface ClaimCheckResultWithSource extends ClaimCheckResult {
  verifiedBy: 'factcheck' | 'ai' | 'none';
  aiReasoning?: string;
}

/**
 * Use Groq LLM to analyse a claim when Google FC has no results.
 * Returns a ClaimCheckResultWithSource marked verifiedBy='ai'.
 */
export async function checkClaimWithGroq(
  claimText: string,
  articleContext: string
): Promise<ClaimCheckResultWithSource> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { status: 'unverified', matches: [], summary: 'Groq API key not set', verifiedBy: 'none' };
  }

  const systemPrompt =
    "You are an expert fact-checker. Analyse whether a claim from a news article is likely TRUE, FALSE, MIXED/MISLEADING, or UNVERIFIABLE based on general knowledge. Respond ONLY with valid JSON, no markdown.";

  const userPrompt =
    `Article context:\n"""${articleContext.substring(0, 800)}"""\n\nClaim to verify:\n"""${claimText.substring(0, 400)}"""\n\nRespond in JSON: {"status":"verified_true"|"verified_false"|"mixed"|"unverified","confidence":0.0-1.0,"reasoning":"brief explanation in French"}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn('Groq API error:', response.status);
      return { status: 'unverified', matches: [], summary: 'Groq API error', verifiedBy: 'none' };
    }

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { status: 'unverified', matches: [], summary: 'Groq empty response', verifiedBy: 'none' };
    }

    const parsed = JSON.parse(content) as {
      status?: string;
      confidence?: number;
      reasoning?: string;
    };

    const validStatuses = ['verified_true', 'verified_false', 'mixed', 'unverified'];
    const status = validStatuses.includes(parsed.status ?? '')
      ? (parsed.status as ClaimCheckResult['status'])
      : 'unverified';

    const confidence = typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5;

    const reasoning = parsed.reasoning ?? 'Analyse IA sans explication disponible.';

    const statusLabel =
      status === 'verified_true' ? 'VRAI' :
      status === 'verified_false' ? 'FAUX' :
      status === 'mixed' ? 'MITIGÉ' : 'NON VÉRIFIÉ';

    return {
      status,
      matches: [],
      summary: `Analyse IA (confiance ${Math.round(confidence * 100)}%) — ${statusLabel}`,
      verifiedBy: 'ai',
      aiReasoning: reasoning,
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Groq claim check error:', error.message);
    }
    return { status: 'unverified', matches: [], summary: 'Erreur lors de l\'analyse IA', verifiedBy: 'none' };
  }
}

// ── CLAIM-LEVEL FACT CHECK ──────────────────────────────────────────────────────

/**
 * Check a single claim against Google Fact Check API
 * Returns verified status and matching fact-checks
 */
export async function checkClaimAgainstFactChecks(
  claimText: string,
  articleContext: string = ''
): Promise<ClaimCheckResultWithSource> {
  if (!claimText || claimText.trim().length === 0) {
    return {
      status: 'unverified',
      matches: [],
      summary: 'Claim text is empty',
      verifiedBy: 'none',
    };
  }

  // Query Google Fact Check API for this specific claim
  const results = await searchGoogleFactCheck(claimText);

  if (results.length === 0) {
    // Fallback: use Groq AI if API key is available
    if (process.env.GROQ_API_KEY) {
      return checkClaimWithGroq(claimText, articleContext);
    }
    return {
      status: 'unverified',
      matches: [],
      summary: 'Aucune vérification trouvée pour cette affirmation',
      verifiedBy: 'none',
    };
  }

  // Collect all ratings from all matches
  const ratings: Array<{ rating: string; source: string; url: string; publisherName: string; claim: string }> = [];

  for (const result of results) {
    for (const review of result.claimReview) {
      ratings.push({
        rating: review.textualRating,
        source: review.publisher.site,
        url: review.url,
        publisherName: review.publisher.name,
        claim: result.text,
      });
    }
  }

  if (ratings.length === 0) {
    return {
      status: 'unverified',
      matches: [],
      summary: 'Aucun verdict trouvé dans les fact-checks',
      verifiedBy: 'none',
    };
  }

  // Determine overall status based on collected ratings
  const status = determineClaimStatus(ratings);

  // Return top 2-3 most relevant matches
  const topMatches = ratings.slice(0, 3).map(r => ({
    claim: r.claim,
    rating: r.rating,
    source: r.source,
    url: r.url,
    publisherName: r.publisherName,
  }));

  const summary = `${ratings.length} verdict(s) trouvé(s) - ${status === 'verified_true' ? 'VRAI' : status === 'verified_false' ? 'FAUX' : status === 'mixed' ? 'MITIGÉ' : 'NON VÉRIFIÉ'}`;

  return {
    status,
    matches: topMatches,
    summary,
    verifiedBy: 'factcheck',
  };
}

/**
 * Determine overall claim status from a list of ratings
 */
function determineClaimStatus(ratings: Array<{ rating: string }>): 'verified_true' | 'verified_false' | 'unverified' | 'mixed' {
  if (ratings.length === 0) return 'unverified';

  const trueRatings = ratings.filter(r => /true|vrai|correct|exact|confirmé/i.test(r.rating));
  const falseRatings = ratings.filter(r => /false|faux|incorrect|inexact|infondé|erroné/i.test(r.rating));
  const mixedRatings = ratings.filter(r => /misleading|trompeur|partiellement/i.test(r.rating));

  // If all are true
  if (trueRatings.length === ratings.length) {
    return 'verified_true';
  }

  // If all are false
  if (falseRatings.length === ratings.length) {
    return 'verified_false';
  }

  // If mixed true/false or there are misleading ratings
  if ((trueRatings.length > 0 && falseRatings.length > 0) || mixedRatings.length > 0) {
    return 'mixed';
  }

  return 'unverified';
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
