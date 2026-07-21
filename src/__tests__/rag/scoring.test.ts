import { describe, it, expect } from 'vitest';
import { ConfidenceScoring } from '../../ai/rag/ConfidenceScoring';
import type { ContextBundle } from '../../ai/rag/ContextBuilder';

describe('ConfidenceScoring', () => {
  it('should calculate confidence correctly', () => {
    const dummyContext: ContextBundle = {
      contextText: '',
      citations: new Map([
        [1, { documentId: 'd1', chunkId: 'c1', text: 'test', score: 0.09, metadata: {} }],
      ]),
      estimatedTokens: 10,
      documents: new Set(['d1']),
    };

    const result = ConfidenceScoring.calculate(dummyContext, [1], 200);

    // retrieval * 10 = 0.9
    // retrievalWeight = 0.5 * 0.9 = 0.45
    // citation coverage = 1 / 1 = 1.0 -> weight 0.3 * 1.0 = 0.3
    // completeness = 200 / 200 = 1.0 -> weight 0.2 * 1.0 = 0.2
    // Total = 0.45 + 0.3 + 0.2 = 0.95
    expect(result.score).toBeCloseTo(0.95);
    expect(result.level).toBe('High');
  });

  it('should assign Low confidence when missing citations and short answer', () => {
    const dummyContext: ContextBundle = {
      contextText: '',
      citations: new Map([
        [1, { documentId: 'd1', chunkId: 'c1', text: 'test', score: 0.5, metadata: {} }],
      ]),
      estimatedTokens: 10,
      documents: new Set(['d1']),
    };

    const result = ConfidenceScoring.calculate(dummyContext, [], 10);

    // retrieval = 0
    // citation coverage = 0
    // completeness = 10/200 = 0.05 -> weight 0.2 * 0.05 = 0.01
    expect(result.score).toBeCloseTo(0.01);
    expect(result.level).toBe('Low');
  });
});
