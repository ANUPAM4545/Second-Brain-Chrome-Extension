import { describe, it, expect } from 'vitest';
import { ContextBuilder } from '../../ai/rag/ContextBuilder';
import type { RetrievalResult } from '../../ai/retrieval/RetrievalProvider';

describe('ContextBuilder', () => {
  it('should deduplicate chunks by ID and preserve order', () => {
    const results: RetrievalResult[] = [
      { documentId: 'doc1', chunkId: 'c1', text: 'chunk 1 text', score: 0.9, metadata: {} },
      { documentId: 'doc1', chunkId: 'c1', text: 'chunk 1 text', score: 0.9, metadata: {} }, // dup
      { documentId: 'doc2', chunkId: 'c2', text: 'chunk 2 text', score: 0.8, metadata: {} },
    ];

    const bundle = ContextBuilder.build(results, 1000);

    expect(bundle.citations.size).toBe(2);
    expect(bundle.documents.has('doc1')).toBe(true);
    expect(bundle.documents.has('doc2')).toBe(true);
    expect(bundle.contextText).toContain('[Citation 1]');
    expect(bundle.contextText).toContain('[Citation 2]');
    expect(bundle.contextText).not.toContain('[Citation 3]');
  });

  it('should truncate when max tokens is exceeded', () => {
    const results: RetrievalResult[] = [
      {
        documentId: 'doc1',
        chunkId: 'c1',
        text: 'aaaa bbbb cccc dddd eeee',
        score: 0.9,
        metadata: {},
      }, // 24 chars ~= 6 tokens
      {
        documentId: 'doc2',
        chunkId: 'c2',
        text: 'ffff gggg hhhh iiii jjjj',
        score: 0.8,
        metadata: {},
      }, // 24 chars ~= 6 tokens
    ];

    // Max 10 tokens. First chunk (6 tokens) should pass. Second (6 tokens) should be truncated.
    const bundle = ContextBuilder.build(results, 10);

    expect(bundle.citations.size).toBe(1);
    expect(bundle.estimatedTokens).toBe(6);
    expect(bundle.contextText).toContain('aaaa');
    expect(bundle.contextText).not.toContain('ffff');
  });
});
