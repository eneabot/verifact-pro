/**
 * Fact-Check Database Integration
 * Connects to WikiFactCheck, Snopes, AFP Factuel, etc.
 */

interface FactCheck {
  claim: string;
  verdict: 'true' | 'false' | 'mixed' | 'unverified';
  source: string;
  date: string;
  url: string;
  confidence: number;
}

/**
 * Search fact-check databases for existing checks
 */
export async function searchFactChecks(claim: string): Promise<FactCheck[]> {
  const results: FactCheck[] = [];

  try {
    // 1. WikiFactCheck API
    const wikiResults = await searchWikiFactCheck(claim);
    results.push(...wikiResults);

    // 2. Snopes API (when available)
    const snopesResults = await searchSnopes(claim);
    results.push(...snopesResults);

    // 3. AFP Factuel (scraping)
    const afpResults = await searchAFPFactuel(claim);
    results.push(...afpResults);

    // Sort by relevance & date
    return results.sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    console.error('Fact-check search error:', error);
    return [];
  }
}

/**
 * WikiFactCheck API
 */
async function searchWikiFactCheck(claim: string): Promise<FactCheck[]> {
  try {
    const response = await fetch(
      `https://api.wikifactcheck.org/search?q=${encodeURIComponent(claim)}`
    );

    if (!response.ok) return [];

    const data = await response.json();

    return data.results.map((item: any) => ({
      claim: item.claim || claim,
      verdict: mapWikiVerdict(item.verdict),
      source: 'WikiFactCheck',
      date: item.date || new Date().toISOString(),
      url: item.url,
      confidence: item.confidence || 0.7,
    }));
  } catch (error) {
    console.error('WikiFactCheck error:', error);
    return [];
  }
}

/**
 * Snopes integration
 */
async function searchSnopes(claim: string): Promise<FactCheck[]> {
  // Placeholder - Snopes requires scraping or partnership
  return [];
}

/**
 * AFP Factuel integration
 */
async function searchAFPFactuel(claim: string): Promise<FactCheck[]> {
  try {
    // Use Jina to extract from AFP Factuel search results
    const searchUrl = `https://www.afp.com/search?q=${encodeURIComponent(claim)}&fact=1`;
    
    // In production: parse results and extract verdicts
    // For now: placeholder
    return [];
  } catch (error) {
    console.error('AFP Factuel error:', error);
    return [];
  }
}

/**
 * Map various verdict formats to standard
 */
function mapWikiVerdict(
  verdict: string
): 'true' | 'false' | 'mixed' | 'unverified' {
  const lower = verdict.toLowerCase();

  if (lower.includes('true') || lower.includes('correct')) return 'true';
  if (lower.includes('false') || lower.includes('incorrect')) return 'false';
  if (lower.includes('mixed') || lower.includes('partial')) return 'mixed';
  
  return 'unverified';
}

/**
 * Match article claims against fact-check database
 */
export async function matchClaimsAgainstDatabase(
  articleClaims: string[]
): Promise<Map<string, FactCheck[]>> {
  const matches = new Map<string, FactCheck[]>();

  for (const claim of articleClaims) {
    const factChecks = await searchFactChecks(claim);
    if (factChecks.length > 0) {
      matches.set(claim, factChecks);
    }
  }

  return matches;
}
