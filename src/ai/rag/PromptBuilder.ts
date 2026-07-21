import type { ContextBundle } from './ContextBuilder';

export interface PromptVersion {
  promptVersion: string;
  templateVersion: string;
  llmVersion: string;
}

export class PromptBuilder {
  private static readonly VERSION: PromptVersion = {
    promptVersion: '1.0.0',
    templateVersion: '1.0.0',
    llmVersion: 'mock-llm-v1',
  };

  private static readonly SYSTEM_INSTRUCTION = `You are an AI assistant for a "Second Brain" knowledge base.
You must answer the user's question using ONLY the provided context.
You MUST include inline citations in the format [Citation Number] whenever you state a fact from the context.
If the context does not contain the answer, you must state that you do not know. Do not hallucinate or guess.`;

  static build(
    query: string,
    contextBundle: ContextBundle
  ): { systemPrompt: string; prompt: string; version: PromptVersion } {
    const prompt = `Context Information:
---------------------
${contextBundle.contextText}
---------------------

User Question: ${query}

Remember:
- Use inline citations like [1] or [2] referring to the Citation numbers above.
- Do not use outside knowledge.`;

    return {
      systemPrompt: this.SYSTEM_INSTRUCTION,
      prompt,
      version: this.VERSION,
    };
  }
}
