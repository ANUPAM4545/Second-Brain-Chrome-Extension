import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RAGPipeline } from '../../ai/rag/RAGPipeline';
import { MockLLMProvider } from '../../ai/llm/MockLLMProvider';
import { GenerationMetrics } from '../../metrics/GenerationMetrics';

vi.mock('../../ai/retrieval/HybridSearchEngine');

describe('RAGPipeline', () => {
  let pipeline: RAGPipeline;
  let mockSearchEngine: any;
  let mockProvider: MockLLMProvider;

  beforeEach(() => {
    mockSearchEngine = {
      search: vi.fn().mockResolvedValue([
        { documentId: 'd1', chunkId: 'c1', text: 'retrieved text 1', score: 0.1 },
        { documentId: 'd2', chunkId: 'c2', text: 'retrieved text 2', score: 0.2 },
      ]),
    };
    mockProvider = new MockLLMProvider();
    pipeline = new RAGPipeline(mockSearchEngine, mockProvider);

    // Reset metrics singleton for clean tests
    const metrics = GenerationMetrics.getInstance();
    metrics.recordTTFT(0);
    metrics.recordCompletion(0, 0, 0);
  });

  it('should orchestrate generation successfully', async () => {
    const response = await pipeline.generateAnswer('test query');

    expect(response.answer).toContain('Based on the context');
    expect(response.citations.size).toBe(2);
    expect(response.validation.isValid).toBe(true);
    expect(response.metrics.totalTokens).toBeGreaterThan(0);
    expect(response.confidence.level).toBeDefined();
    expect(response.promptVersion.templateVersion).toBe('1.0.0');
  });

  it('should orchestrate streaming successfully', async () => {
    const stream = pipeline.streamAnswer('test query');

    let chunkCount = 0;
    let metadata: any = null;

    for await (const msg of stream) {
      if (msg.type === 'chunk') {
        chunkCount++;
      } else if (msg.type === 'metadata') {
        metadata = msg.data;
      }
    }

    expect(chunkCount).toBeGreaterThan(0);
    expect(metadata).not.toBeNull();
    expect(metadata.validation.isValid).toBe(true);
    expect(metadata.metrics.totalTokens).toBe(200);
  });

  it('should capture invalid validation on mocked error', async () => {
    const response = await pipeline.generateAnswer('__MOCK_ERROR__');

    expect(response.answer).toContain('error');
    // MOCK_ERROR response doesn't contain [1], so it fails validation
    expect(response.validation.isValid).toBe(false);
  });
});
