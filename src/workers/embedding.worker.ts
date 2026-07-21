import { TransformersProvider } from '../ai/embeddings/TransformersProvider';
import { VectorValidation } from '../ai/embeddings/Validation';
import type { ChunkEntity } from '../shared/types';

// Singleton instance inside the worker
const provider = new TransformersProvider('Xenova/all-MiniLM-L6-v2', 384, (progress) => {
  self.postMessage({ type: 'EMBED_PROGRESS', payload: progress });
});

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'BATCH_EMBED') {
    const chunks: ChunkEntity[] = payload.chunks;

    try {
      const texts = chunks.map((c) => c.text);

      const startTime = performance.now();
      const vectors = await provider.embedBatch(texts);
      const processingTime = performance.now() - startTime;

      const expectedDim = provider.getDimensions();
      const model = provider.getModelName();
      const providerName = provider.getProviderName();

      // Vector Validation
      VectorValidation.validateBatch(vectors, expectedDim);

      self.postMessage({
        type: 'BATCH_SUCCESS',
        payload: {
          jobId: payload.jobId,
          vectors,
          model,
          provider: providerName,
          dimensions: expectedDim,
          processingTime,
        },
      });
    } catch (error: any) {
      console.error('[Embedding Worker] Batch failed:', error);
      self.postMessage({
        type: 'BATCH_FAILED',
        payload: { jobId: payload.jobId, error: error.message },
      });
    }
  }
};
