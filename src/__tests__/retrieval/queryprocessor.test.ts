import { describe, it, expect } from 'vitest';
import { QueryProcessor } from '../../ai/retrieval/QueryProcessor';

describe('QueryProcessor', () => {
  it('should extract domain filter', () => {
    const req = QueryProcessor.process('domain:example.com machine learning');
    expect(req.filter?.domain).toBe('example.com');
    // query should be normalized without the filter and stopwords removed
    expect(req.query).toBe('machine learning');
  });

  it('should extract language filter', () => {
    const req = QueryProcessor.process('lang:en explain neural networks');
    expect(req.filter?.language).toBe('en');
    expect(req.query).toBe('explain neural networks');
  });

  it('should handle raw query fallback if all words are stopwords', () => {
    const req = QueryProcessor.process('what is the');
    expect(req.query).toBe('what is the');
  });
});
