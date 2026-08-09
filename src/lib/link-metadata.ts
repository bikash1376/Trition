export interface LinkMetadata {
  description: string | null;
  favicon: string | null;
}

function decodeHtmlEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const DESCRIPTION_PATTERNS = [
  /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i,
  /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i,
  /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
  /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i,
];

const ICON_PATTERNS = [
  /<link[^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]+href=["']([^"']*)["']/i,
  /<link[^>]+href=["']([^"']*)["'][^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["']/i,
];

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TritionBot/1.0; +https://github.com/bikash1376/trotion)" },
    });
    if (!res.ok) return { description: null, favicon: null };
    const html = await res.text();

    let description: string | null = null;
    for (const re of DESCRIPTION_PATTERNS) {
      const match = html.match(re);
      if (match?.[1]) {
        description = decodeHtmlEntities(match[1]).trim().slice(0, 200);
        break;
      }
    }

    const base = new URL(url);
    let faviconHref = "/favicon.ico";
    for (const re of ICON_PATTERNS) {
      const match = html.match(re);
      if (match?.[1]) {
        faviconHref = decodeHtmlEntities(match[1]);
        break;
      }
    }
    let favicon: string | null = null;
    try {
      favicon = new URL(faviconHref, base).toString();
    } catch {
      favicon = null;
    }

    return { description, favicon };
  } catch {
    return { description: null, favicon: null };
  }
}
