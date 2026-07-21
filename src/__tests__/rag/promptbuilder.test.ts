import { describe, it, expect } from 'vitest';
import { PromptBuilder } from '../../ai/rag/PromptBuilder';
import type { ContextBundle } from '../../ai/rag/ContextBuilder';

describe('PromptBuilder', () => {
  it('should build a prompt containing context and versioning', () => {
    const dummyContext: ContextBundle = {
      contextText: '[Citation 1]\nDocument: Test\nContent: This is a test chunk.',
      citations: new Map(),
      estimatedTokens: 10,
      documents: new Set(['d1']),
    };

    const promptData = PromptBuilder.build('What is this?', dummyContext);

    expect(promptData.systemPrompt).toContain('You are an AI assistant');
    expect(promptData.prompt).toContain('This is a test chunk.');
    expect(promptData.prompt).toContain('What is this?');
    expect(promptData.version.templateVersion).toBe('1.0.0');
  });
});
