import { describe, it, expect } from 'vitest';
import { URLNormalizer } from '../utils/url';

describe('URLNormalizer', () => {
  it('should normalize protocols and hostnames to lowercase', () => {
    const result = URLNormalizer.normalize('HTTPS://EXAMPLE.COM/Path');
    expect(result.normalizedUrl).toBe('https://example.com/Path');
  });

  it('should remove default ports', () => {
    const result1 = URLNormalizer.normalize('https://example.com:443/path');
    const result2 = URLNormalizer.normalize('http://example.com:80/path');
    expect(result1.normalizedUrl).toBe('https://example.com/path');
    expect(result2.normalizedUrl).toBe('http://example.com/path');
  });

  it('should strip tracking parameters', () => {
    const result = URLNormalizer.normalize(
      'https://example.com/path?utm_source=google&fbclid=123&keep=this'
    );
    expect(result.normalizedUrl).toBe('https://example.com/path?keep=this');
  });

  it('should remove duplicate and trailing slashes', () => {
    const result = URLNormalizer.normalize('https://example.com//path//to/page/');
    expect(result.normalizedUrl).toBe('https://example.com/path/to/page');
  });

  it('should strip non-SPA hash fragments', () => {
    const result = URLNormalizer.normalize('https://example.com/path#section-1');
    expect(result.normalizedUrl).toBe('https://example.com/path');
  });

  it('should keep SPA hash routing', () => {
    const result = URLNormalizer.normalize('https://example.com/#/about');
    expect(result.normalizedUrl).toBe('https://example.com/#/about');
  });
});
