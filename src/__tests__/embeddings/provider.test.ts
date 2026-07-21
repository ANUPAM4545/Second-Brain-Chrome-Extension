import { describe, it, expect, vi } from 'vitest';
import { TransformersProvider } from '../../ai/embeddings/TransformersProvider';

// Mock Transformers.js pipeline
vi.mock('@xenova/transformers', () => {
  return {
    pipeline: vi.fn().mockResolvedValue(async (text: string | string[], _options: any) => {
      // Return a dummy Tensor representation
      const isBatch = Array.isArray(text);
      const batchSize = isBatch ? (text as string[]).length : 1;
      const dim = 384;
      return {
        data: new Float32Array(batchSize * dim).fill(0.5), // Dummy embedding
      };
    }),
    env: {
      allowLocalModels: false,
      useBrowserCache: true,
    },
  };
});

describe('TransformersProvider', () => {
  it('should initialize successfully', async () => {
    const provider = new TransformersProvider();
    await provider.initialize();
    expect(provider.getModelName()).toBe('Xenova/all-MiniLM-L6-v2');
    expect(provider.getDimensions()).toBe(384);
  });

  it('should embed a single string', async () => {
    const provider = new TransformersProvider();
    const vec = await provider.embed('Hello world');
    expect(vec.length).toBe(384);
    expect(vec[0]).toBe(0.5);
  });

  it('should embed a batch of strings', async () => {
    const provider = new TransformersProvider();
    const vecs = await provider.embedBatch(['Hello world', 'Second doc']);
    expect(vecs.length).toBe(2);
    expect(vecs[0].length).toBe(384);
    expect(vecs[1].length).toBe(384);
  });
});
