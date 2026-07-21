import { describe, it, expect } from 'vitest';
import { AnswerValidator } from '../../ai/rag/AnswerValidator';
import type { ContextBundle } from '../../ai/rag/ContextBuilder';

describe('AnswerValidator', () => {
  const dummyContext: ContextBundle = {
    contextText: '',
    citations: new Map([
      [1, { documentId: 'd1', chunkId: 'c1', text: 'test', score: 0.9, metadata: {} }],
    ]),
    estimatedTokens: 10,
    documents: new Set(['d1']),
  };

  it('should pass if citations match', () => {
    const result = AnswerValidator.validate(
      {
        text: 'This is the answer [1].',
        finishReason: 'stop',
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      },
      dummyContext
    );
    expect(result.isValid).toBe(true);
    expect(result.mappedCitations).toEqual([1]);
  });

  it('should fail if citations are missing in strict mode (and not a refusal)', () => {
    const result = AnswerValidator.validate(
      {
        text: 'This is the answer.',
        finishReason: 'stop',
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      },
      dummyContext,
      true
    );
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('No citations found');
  });

  it('should pass if it is a refusal even without citations', () => {
    const result = AnswerValidator.validate(
      {
        text: 'I do not know the answer.',
        finishReason: 'stop',
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      },
      dummyContext,
      true
    );
    expect(result.isValid).toBe(true);
  });

  it('should fail if citation is invalid', () => {
    const result = AnswerValidator.validate(
      {
        text: 'This is the answer [2].',
        finishReason: 'stop',
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      },
      dummyContext
    );
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('does not map');
  });
});
