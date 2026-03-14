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
    
    // Return cleaned content
    return data.data?.content || '';
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
