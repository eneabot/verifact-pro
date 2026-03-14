/**
 * Fact-Check Database Integration
 * Aggregates multiple fact-checking sources
 */

export interface FactCheckResult {
  claim: string;
  verdict: 'true' | 'false' | 'mixed' | 'unverified';
  source: string;
  url: string;
  date: string;
  confidence: number;
}

/**
 * Local fact-check database (in production: connect to external APIs)
 */
const factCheckDatabase: FactCheckResult[] = [
  {
    claim: 'Le Gorafi',
    verdict: 'false',
    source: 'WikiFactCheck',
    url: 'https://wikifactcheck.org/en/Le_Gorafi',
    date: '2026-01-01',
    confidence: 1.0,
  },
  {
    claim: 'Paris is the capital of France',
    verdict: 'true',
    source: 'WikiFactCheck',
    url: 'https://example.com',
    date: '2026-01-01',
    confidence: 0.99,
  },
];

/**
 * Search fact-check database for existing verdicts
 */
export async function searchFactCheckDatabase(
  claims: string[]
): Promise<Map<string, FactCheckResult[]>> {
  const results = new Map<string, FactCheckResult[]>();

  for (const claim of claims) {
    const matches = factCheckDatabase.filter((fc) =>
      claim.toLowerCase().includes(fc.claim.toLowerCase()) ||
      fc.claim.toLowerCase().includes(claim.toLowerCase())
    );

    if (matches.length > 0) {
      results.set(claim, matches);
    }
  }

  return results;
}

/**
 * Extract claims from article text (simple extraction)
 */
export function extractClaims(text: string): string[] {
  // Simple heuristic: sentences with numbers or strong verbs
  const sentences = text.split(/[.!?]+/);
  const claims = sentences
    .filter((s) => /\d+|[A-Z][a-z]+ (is|are|was|were|claims?|states?)/.test(s))
    .slice(0, 5); // Top 5 claims

  return claims.map((c) => c.trim()).filter((c) => c.length > 10);
}

/**
 * Match claims against fact-check database
 */
export async function matchClaimsWithFactChecks(articleText: string): Promise<{
  matchedClaims: Map<string, FactCheckResult[]>;
  confidence: number;
}> {
  const claims = extractClaims(articleText);
  const matchedClaims = await searchFactCheckDatabase(claims);

  return {
    matchedClaims,
    confidence: Math.min(0.9, matchedClaims.size / claims.length),
  };
}
