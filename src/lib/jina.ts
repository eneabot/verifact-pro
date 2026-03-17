/**
 * Jina AI API Wrapper — Extract article content and clean HTML
 * https://jina.ai/
 */

interface JinaResponse {
  data: {
    content: string;
    title?: string;
    description?: string;
  };
}

/**
 * Strip URLs, markdown links, images, HTML tags, and navigation noise
 * from extracted article content. Preserves actual sentence text.
 */
export function cleanArticleContent(content: string): string {
  let cleaned = content;

  // 1. Remove markdown images: ![alt](url) → remove entirely
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]*\)/g, '');

  // 2. Replace markdown links: [text](url) → keep only text
  cleaned = cleaned.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

  // 3. Remove bare URLs: https://... or http://... (standalone)
  cleaned = cleaned.replace(/https?:\/\/[^\s\)>"'\]]+/g, '');

  // 4. Remove HTML tags: <tag> or </tag> or <tag attr="..."/>
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // 5. Remove lines that are mostly URL content (navigation noise)
  // A line is "mostly links" if >50% of its non-whitespace chars are from URLs
  // After prior steps, lines that still look like nav items: short repeated link patterns
  cleaned = cleaned
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();

      // Remove lines that are empty after URL stripping
      if (trimmed.length === 0) return false;

      // Rule 7: Remove lines shorter than 20 chars that look like menu items
      // (no sentence-ending punctuation, no verb indicators)
      if (trimmed.length < 20) {
        // Keep if it contains a number (could be a statistic)
        if (/\d/.test(trimmed)) return true;
        // Keep if it ends with sentence punctuation
        if (/[.!?:;]$/.test(trimmed)) return true;
        // Otherwise discard (likely a nav item or leftover bracket)
        return false;
      }

      // Rule 5: Remove lines that still contain mostly URL-like fragments
      // (long sequences of alphanumeric/dash/dot/slash with no spaces)
      const urlFragments = trimmed.match(/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]{20,}/g) || [];
      const urlCharCount = urlFragments.reduce((sum, f) => sum + f.length, 0);
      if (urlCharCount > trimmed.length * 0.5) return false;

      return true;
    })
    .join('\n');

  // 6. Collapse repeated whitespace/newlines to max 2 consecutive
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');

  return cleaned.trim();
}

/**
 * Log how much content was stripped (for debugging)
 */
export function getContentStats(raw: string, cleaned: string): void {
  const rawLen = raw.length;
  const cleanedLen = cleaned.length;
  const stripped = rawLen - cleanedLen;
  const pct = rawLen > 0 ? ((stripped / rawLen) * 100).toFixed(1) : '0.0';

  const rawWords = raw.split(/\s+/).filter(Boolean).length;
  const cleanedWords = cleaned.split(/\s+/).filter(Boolean).length;

  console.log(
    `[Jina Content Stats] Raw: ${rawLen} chars / ${rawWords} words → ` +
    `Cleaned: ${cleanedLen} chars / ${cleanedWords} words ` +
    `(stripped ${stripped} chars, ${pct}%)`
  );
}

export async function extractArticleContent(url: string): Promise<string> {
  try {
    // Use Jina API to convert any URL to clean markdown
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    
    const response = await fetch(jinaUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Jina API error: ${response.status}`);
    }

    const data: JinaResponse = await response.json();
    
    const raw = data.data?.content || '';

    // Clean the content before returning
    const cleaned = cleanArticleContent(raw);
    getContentStats(raw, cleaned);

    return cleaned;
  } catch (error) {
    console.error('Jina extraction error:', error);
    throw new Error('Unable to extract article content. The source may be blocked or unavailable.');
  }
}

/**
 * Extract metadata from article content
 */
export function extractMetadata(content: string): {
  wordCount: number;
  hasExternalLinks: boolean;
  hasQuotes: boolean;
  hasNumbers: boolean;
  hasSources: boolean;
} {
  const wordCount = content.split(/\s+/).length;
  const hasExternalLinks = /https?:\/\//.test(content);
  const hasQuotes = /["«»""]/.test(content);
  const hasNumbers = /\d+/.test(content);
  const hasSources = /source|selon|d'après|cité/i.test(content);

  return {
    wordCount,
    hasExternalLinks,
    hasQuotes,
    hasNumbers,
    hasSources
  };
}
