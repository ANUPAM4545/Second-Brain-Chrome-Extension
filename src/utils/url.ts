export class URLNormalizer {
  private static readonly trackingParams = new Set([
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'fbclid',
    'gclid',
    'ref',
    'session_id',
    'sid',
  ]);

  /**
   * Normalizes a given URL according to standard rules and strips tracking parameters.
   * Returns an object containing the original URL, the normalized URL, and a canonical version.
   */
  static normalize(rawUrl: string): {
    originalUrl: string;
    normalizedUrl: string;
    canonicalUrl: string;
  } {
    try {
      const urlObj = new URL(rawUrl);

      // Normalize protocol and hostname (URL constructor does this natively mostly, but ensure lowercase)
      urlObj.protocol = urlObj.protocol.toLowerCase();
      urlObj.hostname = urlObj.hostname.toLowerCase();

      // Remove default ports
      if (
        (urlObj.protocol === 'http:' && urlObj.port === '80') ||
        (urlObj.protocol === 'https:' && urlObj.port === '443')
      ) {
        urlObj.port = '';
      }

      // Clean path: remove duplicate slashes
      urlObj.pathname = urlObj.pathname.replace(/\/{2,}/g, '/');

      // Remove trailing slash if pathname is more than just '/'
      if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith('/')) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }

      // Strip tracking query parameters
      const paramsToKeep = new URLSearchParams();
      urlObj.searchParams.forEach((value, key) => {
        if (!this.trackingParams.has(key.toLowerCase())) {
          paramsToKeep.append(key, value);
        }
      });

      // Reassign sorted parameters to ensure deterministic URL output
      paramsToKeep.sort();
      urlObj.search = paramsToKeep.toString();

      // Hash fragments: strip unless it appears to be a SPA router path
      if (urlObj.hash && !urlObj.hash.startsWith('#/') && !urlObj.hash.startsWith('#!')) {
        urlObj.hash = '';
      }

      const normalizedUrl = urlObj.toString();

      // For canonicalUrl, we simply use the normalized URL in this basic implementation.
      // If a <link rel="canonical"> was parsed by Readability, that should take precedence,
      // but this service generates a fallback canonical string.
      const canonicalUrl = normalizedUrl;

      return {
        originalUrl: rawUrl,
        normalizedUrl,
        canonicalUrl,
      };
    } catch (e) {
      // If invalid URL, fallback to raw
      return {
        originalUrl: rawUrl,
        normalizedUrl: rawUrl,
        canonicalUrl: rawUrl,
      };
    }
  }
}
