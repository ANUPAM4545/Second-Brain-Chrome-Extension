import { ChunkRepository } from '../../repositories/ChunkRepository';
import { EmbeddingRepository } from '../../repositories/EmbeddingRepository';
import { DocumentRepository } from '../../repositories/DocumentRepository';
import { DocumentStatus } from '../../shared/types';
import type { ChunkEntity, EmbeddingEntity } from '../../shared/types';

import { EmbeddingConfig } from '../../config/EmbeddingConfig';
import { EmbeddingStats } from '../../metrics/EmbeddingStats';

import { TransformersProvider } from './TransformersProvider';
import { VectorValidation } from './Validation';

export class EmbeddingQueue {
  private provider: TransformersProvider;

  constructor() {
    this.provider = new TransformersProvider('Xenova/all-MiniLM-L6-v2', 384, (_progress) => {

    });
  }



  /**
   * Triggers the queue to process all PENDING chunks for a given document.
   */
  async processDocument(documentId: string): Promise<void> {
    const chunks = await ChunkRepository.findByDocument(documentId);
    let pendingChunks = chunks.filter((c) => c.status === 'PENDING');

    if (pendingChunks.length === 0) {
      await this.markDocumentIndexed(documentId);
      return;
    }

    // Process in batches sequentially based on config
    for (let i = 0; i < pendingChunks.length; i += EmbeddingConfig.batchSize) {
      const batch = pendingChunks.slice(i, i + EmbeddingConfig.batchSize);
      await this.processBatchWithRetries(batch, documentId);
    }

    await this.markDocumentIndexed(documentId);
  }

  private async processBatchWithRetries(chunks: ChunkEntity[], documentId: string) {
    // 1. Caching check: Filter out chunks that already have valid embeddings cached
    const chunksToEmbed: ChunkEntity[] = [];
    const cachedEmbeddings: EmbeddingEntity[] = [];

    for (const chunk of chunks) {
      const cached = await EmbeddingRepository.checkCache(
        chunk.contentHash,
        EmbeddingConfig.provider,
        EmbeddingConfig.modelName
      );
      if (cached) {

        // Create a copy of the cached embedding for this specific chunk
        EmbeddingStats.recordCachedEmbedding();
        cachedEmbeddings.push({
          ...cached,
          embeddingId: crypto.randomUUID(),
          chunkId: chunk.id,
          documentId,
          createdAt: Date.now(),
        });
      } else {
        chunksToEmbed.push(chunk);
      }
    }

    // Insert cached directly
    if (cachedEmbeddings.length > 0) {
      await EmbeddingRepository.bulkInsert(cachedEmbeddings);
      for (const chunk of chunks) {
        if (cachedEmbeddings.find((e) => e.chunkId === chunk.id)) {
          chunk.status = 'EMBEDDED';
        }
      }
      await ChunkRepository.saveAll(chunks.filter((c) => c.status === 'EMBEDDED'));
    }

    if (chunksToEmbed.length === 0) return;

    // 2. Process Remaining with Retries
    let attempt = 0;
    while (attempt <= EmbeddingConfig.maxRetries) {
      try {
        const result = await this.dispatchToWorker(chunksToEmbed);
        const processingTime = result.processingTime / chunksToEmbed.length;

        const newEmbeddings: EmbeddingEntity[] = result.vectors.map(
          (vec: number[], idx: number) => {
            EmbeddingStats.recordNewEmbedding(processingTime);
            return {
              schemaVersion: EmbeddingConfig.schemaVersion,
              embeddingId: crypto.randomUUID(),
              chunkId: chunksToEmbed[idx].id,
              documentId,
              provider: result.provider,
              model: result.model,
              dimensions: result.dimensions,
              vector: vec,
              vectorNorm: result.vectorNorms[idx],
              embeddingVersion: '1.0',
              providerVersion: '1.0',
              modelVersion: '1.0',
              createdAt: Date.now(),
              lastValidatedAt: Date.now(),
              processingTime: processingTime,
              status: 'ACTIVE',
            };
          }
        );

        await EmbeddingRepository.bulkInsert(newEmbeddings);
        EmbeddingStats.recordBatch(result.processingTime);

        chunksToEmbed.forEach((c) => (c.status = 'EMBEDDED'));
        await ChunkRepository.saveAll(chunksToEmbed);
        return;
      } catch (error) {
        EmbeddingStats.recordFailure();
        attempt++;
        if (attempt > 1) EmbeddingStats.recordRetry();
        console.warn(
          `[EmbeddingQueue] Batch failed, attempt ${attempt}/${EmbeddingConfig.maxRetries}`,
          error
        );
        if (attempt > EmbeddingConfig.maxRetries) {
          console.error(`[EmbeddingQueue] Batch permanently failed.`);
          throw error;
        }
        await new Promise((res) =>
          setTimeout(res, EmbeddingConfig.retryDelay * Math.pow(2, attempt - 1))
        ); // Exponential backoff
      }
    }
  }

  private async dispatchToWorker(chunks: ChunkEntity[]): Promise<any> {
    try {
      const texts = chunks.map((c) => c.text);
      const startTime = performance.now();
      const vectors = await this.provider.embedBatch(texts);
      const processingTime = performance.now() - startTime;

      const expectedDim = this.provider.getDimensions();
      const model = this.provider.getModelName();
      const providerName = this.provider.getProviderName();

      VectorValidation.validateBatch(vectors, expectedDim);

      const vectorNorms = vectors.map((vec) =>
        Math.sqrt(vec.reduce((sum: number, val: number) => sum + val * val, 0))
      );

      return {
        vectors,
        vectorNorms,
        model,
        provider: providerName,
        dimensions: expectedDim,
        processingTime,
      };
    } catch (error: any) {
      console.error('[EmbeddingQueue] Batch failed:', error);
      throw new Error(error.message);
    }
  }

  private async markDocumentIndexed(documentId: string) {
    const doc = await DocumentRepository.getById(documentId);
    if (doc) {
      doc.status = DocumentStatus.INDEXED; // Complete the milestone flow
      await DocumentRepository.save(doc);

    }
  }
}
