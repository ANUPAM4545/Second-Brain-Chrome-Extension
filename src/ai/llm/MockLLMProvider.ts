import type {
  LLMProvider,
  GenerationRequest,
  GenerationResponse,
  GenerationChunk,
  ProviderHealth,
} from './LLMProvider';

export class MockLLMProvider implements LLMProvider {
  private isInitialized = false;

  async initialize(): Promise<void> {
    // Simulate loading time
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.isInitialized = true;
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    if (!this.isInitialized) throw new Error('MockLLMProvider not initialized');

    // Simulate validation error behavior for tests
    if (request.prompt.includes('__MOCK_ERROR__')) {
      return {
        text: 'This is a mocked error response without citations.',
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 10, totalTokens: 110 },
      };
    }

    return {
      text: 'Based on the context, here is a detailed answer that utilizes the citations [1]. The provider is working properly [2].',
      finishReason: 'stop',
      usage: { promptTokens: 150, completionTokens: 50, totalTokens: 200 },
    };
  }

  async *stream(_request: GenerationRequest): AsyncIterable<GenerationChunk> {
    if (!this.isInitialized) throw new Error('MockLLMProvider not initialized');

    const words = [
      'Based ',
      'on ',
      'the ',
      'context, ',
      'here ',
      'is ',
      'a ',
      'detailed ',
      'answer ',
      'that ',
      'utilizes ',
      'the ',
      'citations ',
      '[1]. ',
      'The ',
      'provider ',
      'is ',
      'working ',
      'properly ',
      '[2].',
    ];

    for (let i = 0; i < words.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10)); // simulate network latency per token
      yield {
        text: words[i],
        isDone: i === words.length - 1,
        ...(i === words.length - 1
          ? { usage: { promptTokens: 150, completionTokens: 50, totalTokens: 200 } }
          : {}),
      };
    }
  }

  async health(): Promise<ProviderHealth> {
    return {
      status: 'OK',
      modelName: 'mock-llm-v1',
    };
  }
}
