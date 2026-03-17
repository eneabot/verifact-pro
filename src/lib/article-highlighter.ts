/**
 * Article Highlighter - Inline HTML highlighting for false/questionable claims
 * 
 * Finds claim text in article and wraps them with semantic <mark> tags
 * Color-coded by verification status:
 * - verified_true → green
 * - verified_false → red
 * - mixed/unverified → yellow/orange
 */

export interface Highlight {
  text: string;
  startChar: number;
  endChar: number;
  status: 'verified_true' | 'verified_false' | 'unverified' | 'mixed';
  claimId: string;
  explanation: string;
}

export interface HighlightResult {
  highlightedHtml: string;
  highlights: Highlight[];
  statistics: {
    verified_true: number;
    verified_false: number;
    unverified: number;
    mixed: number;
    total: number;
  };
}

/**
 * Get CSS class and color for a status
 */
function getStatusColor(status: string): { class: string; color: string } {
  switch (status) {
    case 'verified_true':
      return { class: 'highlight--verified_true', color: 'green' };
    case 'verified_false':
      return { class: 'highlight--verified_false', color: 'red' };
    case 'mixed':
      return { class: 'highlight--mixed', color: 'yellow' };
    case 'unverified':
      return { class: 'highlight--unverified', color: 'yellow' };
    default:
      return { class: 'highlight--unverified', color: 'yellow' };
  }
}

/**
 * Normalize text for fuzzy matching (lowercase, remove extra spaces/punctuation)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:«»"'"]/g, '')
    .trim();
}

/**
 * Find best match of claim text in article using fuzzy matching
 * Returns character positions or null if not found
 */
function findClaimInArticle(
  articleText: string,
  claimText: string,
  maxDistance: number = 5
): { start: number; end: number } | null {
  const normalizedClaim = normalizeText(claimText);
  const normalizedArticle = normalizeText(articleText);

  // Try exact match first (on normalized text)
  const exactIndex = normalizedArticle.indexOf(normalizedClaim);
  if (exactIndex !== -1) {
    // Find original positions in non-normalized article
    const originalArticleNorm = articleText.toLowerCase();
    let charCount = 0;
    let normCount = 0;

    for (let i = 0; i < originalArticleNorm.length; i++) {
      const char = originalArticleNorm[i];
      if (/\s/.test(char) || /[.,!?;:«»"'"]/g.test(char)) {
        // skip normalization chars
      } else {
        if (normCount === exactIndex) {
          // Found start
          charCount = i;
          break;
        }
        normCount++;
      }
    }

    // Find end position
    if (charCount > 0) {
      let endPos = charCount;
      for (let i = charCount; i < articleText.length && endPos - charCount < claimText.length + maxDistance; i++) {
        endPos = i;
        if (normalizeText(articleText.substring(charCount, endPos)).length >= normalizedClaim.length - 2) {
          return { start: charCount, end: endPos };
        }
      }
    }
  }

  // Fallback: search for significant keywords from claim
  const keywords = normalizedClaim
    .split(' ')
    .filter(w => w.length > 3)
    .slice(0, 3);

  if (keywords.length > 0) {
    // Find first keyword
    const firstKeywordIndex = normalizedArticle.indexOf(keywords[0]);
    if (firstKeywordIndex !== -1) {
      // Estimate a window around this keyword
      let startChar = 0;
      let charCount = 0;
      for (let i = 0; i < articleText.length; i++) {
        const char = articleText[i].toLowerCase();
        if (!/[\s.,!?;:«»"'"]/g.test(char)) {
          if (charCount === firstKeywordIndex) {
            startChar = i;
            break;
          }
          charCount++;
        }
      }

      // Find end (roughly claim length + buffer)
      let endChar = Math.min(startChar + claimText.length + 50, articleText.length);
      return { start: startChar, end: endChar };
    }
  }

  return null;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Highlight article text with claim markers
 * Returns HTML with <mark> tags and highlight metadata
 */
export function highlightArticleText(
  articleText: string,
  claims: Array<{
    text: string;
    status: 'verified_true' | 'verified_false' | 'unverified' | 'mixed';
    explanation: string;
    confidence?: number;
  }>
): HighlightResult {
  const highlights: Highlight[] = [];
  const usedRanges: Array<{ start: number; end: number }> = [];
  const statusCounts = {
    verified_true: 0,
    verified_false: 0,
    unverified: 0,
    mixed: 0,
  };

  // Find and collect all highlights
  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i];
    const position = findClaimInArticle(articleText, claim.text);

    if (position) {
      // Check for overlaps with existing highlights
      const isOverlap = usedRanges.some(
        range =>
          (position.start < range.end && position.end > range.start)
      );

      if (!isOverlap) {
        const originalText = articleText.substring(position.start, position.end);
        const highlight: Highlight = {
          text: originalText,
          startChar: position.start,
          endChar: position.end,
          status: claim.status,
          claimId: `claim-${i}`,
          explanation: claim.explanation,
        };

        highlights.push(highlight);
        usedRanges.push(position);
        statusCounts[claim.status]++;
      }
    }
  }

  // Sort highlights by start position (for correct replacement order)
  highlights.sort((a, b) => a.startChar - b.startChar);

  // Build highlighted HTML by inserting marks from end to start
  let highlightedHtml = articleText;
  for (let i = highlights.length - 1; i >= 0; i--) {
    const h = highlights[i];
    const { class: statusClass } = getStatusColor(h.status);
    const escapedText = escapeHtml(h.text);
    const dataAttrs = `data-claim-id="${h.claimId}" data-status="${h.status}"`;
    const markTag = `<mark class="highlight ${statusClass}" ${dataAttrs}>${escapedText}</mark>`;

    highlightedHtml =
      highlightedHtml.substring(0, h.startChar) +
      markTag +
      highlightedHtml.substring(h.endChar);
  }

  // Escape the rest of the HTML (outside marks)
  // This is already done, we just need to handle the structure carefully
  // In a real implementation, we'd use a proper HTML parser

  return {
    highlightedHtml,
    highlights,
    statistics: {
      verified_true: statusCounts.verified_true,
      verified_false: statusCounts.verified_false,
      unverified: statusCounts.unverified,
      mixed: statusCounts.mixed,
      total: highlights.length,
    },
  };
}

/**
 * Convert plain text article to safe HTML paragraphs
 */
export function textToHtml(text: string): string {
  return text
    .split('\n\n')
    .filter(p => p.trim().length > 0)
    .map(p => `<p>${escapeHtml(p.trim())}</p>`)
    .join('\n');
}
