import type { HybridSearchEngine } from '../retrieval/HybridSearchEngine';
import type { LLMProvider, GenerationRequest } from '../llm/LLMProvider';
import { ContextBuilder } from './ContextBuilder';
import type { ContextBundle } from './ContextBuilder';
import { PromptBuilder } from './PromptBuilder';
import type { PromptVersion } from './PromptBuilder';
import { AnswerValidator } from './AnswerValidator';
import type { ValidationResult } from './AnswerValidator';
import { ConfidenceScoring } from './ConfidenceScoring';
import type { ConfidenceResult } from './ConfidenceScoring';
import { GenerationMetrics } from '../../metrics/GenerationMetrics';

export interface RAGResponse {
  answer: string;
  citations: ContextBundle['citations'];
  confidence: ConfidenceResult;
  validation: ValidationResult;
  metrics: ReturnType<GenerationMetrics['getMetrics']>;
  promptVersion: PromptVersion;
}

export class RAGPipeline {
  private searchEngine: HybridSearchEngine;
  private llmProvider: LLMProvider;
  private metrics: GenerationMetrics;

  constructor(searchEngine: HybridSearchEngine, llmProvider: LLMProvider) {
    this.searchEngine = searchEngine;
    this.llmProvider = llmProvider;
    this.metrics = GenerationMetrics.getInstance();
  }

  /**
   * Generates a single response blocking
   */
  async generateAnswer(query: string, limit: number = 5): Promise<RAGResponse> {
    const startTime = performance.now();

    // 1. Retrieval
    const retrievalResults = await this.searchEngine.search(query, limit);

    // 2. Context Building
    const contextBundle = ContextBuilder.build(retrievalResults, 2000);

    // 3. Prompt Building
    const promptData = PromptBuilder.build(query, contextBundle);
    const generationReq: GenerationRequest = {
      prompt: promptData.prompt,
      systemPrompt: promptData.systemPrompt,
    };

    // 4. Generate
    await this.llmProvider.initialize();

    // Simulate TTFT
    this.metrics.recordTTFT(performance.now() - startTime);

    const response = await this.llmProvider.generate(generationReq);

    const totalTime = performance.now() - startTime;
    this.metrics.recordCompletion(
      totalTime,
      response.usage.promptTokens,
      response.usage.completionTokens
    );

    // 5. Validation
    const validation = AnswerValidator.validate(response, contextBundle);

    // 6. Confidence Scoring
    const confidence = ConfidenceScoring.calculate(
      contextBundle,
      validation.mappedCitations,
      response.text.length
    );

    return {
      answer: response.text,
      citations: contextBundle.citations,
      confidence,
      validation,
      metrics: this.metrics.getMetrics(),
      promptVersion: promptData.version,
    };
  }

  /**
   * Yields chunks for streaming UIs
   */
  async *streamAnswer(
    query: string,
    limit: number = 5
  ): AsyncIterable<{ type: 'chunk' | 'metadata'; data: any }> {
    const startTime = performance.now();

    const retrievalResults = await this.searchEngine.search(query, limit);
    const contextBundle = ContextBuilder.build(retrievalResults, 2000);
    const promptData = PromptBuilder.build(query, contextBundle);

    await this.llmProvider.initialize();

    let fullAnswer = '';
    let firstToken = true;

    const stream = this.llmProvider.stream({
      prompt: promptData.prompt,
      systemPrompt: promptData.systemPrompt,
    });

    for await (const chunk of stream) {
      if (firstToken) {
        this.metrics.recordTTFT(performance.now() - startTime);
        firstToken = false;
      }

      fullAnswer += chunk.text;

      yield { type: 'chunk', data: chunk };

      if (chunk.isDone) {
        const totalTime = performance.now() - startTime;
        this.metrics.recordCompletion(
          totalTime,
          chunk.usage?.promptTokens || 0,
          chunk.usage?.completionTokens || 0
        );

        const validation = AnswerValidator.validate(
          { text: fullAnswer, finishReason: 'stop', usage: chunk.usage! },
          contextBundle
        );
        const confidence = ConfidenceScoring.calculate(
          contextBundle,
          validation.mappedCitations,
          fullAnswer.length
        );

        yield {
          type: 'metadata',
          data: {
            citations: contextBundle.citations,
            confidence,
            validation,
            metrics: this.metrics.getMetrics(),
            promptVersion: promptData.version,
          },
        };
      }
    }
  }
}
