import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomBM25 } from '../../ai/retrieval/CustomBM25';

vi.mock('../../storage/db', () => ({
  db: {
    chunks: {
      toArray: vi.fn().mockResolvedValue([
        { id: 'chunk1', documentId: 'doc1', text: 'the quick brown fox jumps over the lazy dog' },
        { id: 'chunk2', documentId: 'doc2', text: 'a quick brown dog outpaces a quick fox' },
        { id: 'chunk3', documentId: 'doc3', text: 'the lazy dog sleeps' },
      ]),
    },
  },
}));

describe('CustomBM25', () => {
  let bm25: CustomBM25;

  beforeEach(() => {
    bm25 = new CustomBM25({ k1: 1.2, b: 0.75 });
  });

  it('should build inverted index', async () => {
    await bm25.buildIndex();
    expect(bm25.getIndexSize()).toBeGreaterThan(0);
  });

  it('should remove stopwords', () => {
    const tokens = bm25.tokenize('The quick brown fox');
    // "the" is a stopword and should be removed
    expect(tokens).toEqual(['quick', 'brown', 'fox']);
  });

  it('should score documents correctly for a query', async () => {
    await bm25.buildIndex();
    const scores = bm25.search('quick dog');

    // chunk2 has two "quick" and one "dog", it should score highest for this
    // chunk1 has one "quick" and one "dog"
    // chunk3 has only "dog"
    expect(scores.has('chunk1')).toBe(true);
    expect(scores.has('chunk2')).toBe(true);
    expect(scores.has('chunk3')).toBe(true);

    expect(scores.get('chunk2')).toBeGreaterThan(scores.get('chunk1')!);
    expect(scores.get('chunk1')).toBeGreaterThan(scores.get('chunk3')!);
  });
});
