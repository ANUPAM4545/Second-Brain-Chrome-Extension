import { ChunkRepository } from '../../repositories/ChunkRepository';
import { EmbeddingRepository } from '../../repositories/EmbeddingRepository';
import { DocumentRepository } from '../../repositories/DocumentRepository';
import { DocumentStatus } from '../../shared/types';
import type { ChunkEntity, EmbeddingEntity } from '../../shared/types';

export interface EmbeddingConfig {
  batchSize: number;
  maxConcurrentJobs: number;
  maxQueueLength: number;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

const DEFAULT_CONFIG: EmbeddingConfig = {
  batchSize: 8,
  maxConcurrentJobs: 1,
  maxQueueLength: 1000,
  maxRetries: 3,
  retryDelay: 1000, // Ms
  timeout: 30000,
};

export class EmbeddingQueue {
  private config: EmbeddingConfig;
  private worker: Worker;
  private jobResolvers: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> =
    new Map();

  constructor(config: Partial<EmbeddingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.worker = new Worker(new URL('../../workers/embedding.worker.ts', import.meta.url), {
      type: 'module',
    });

    this.worker.onmessage = (e) => this.handleWorkerMessage(e);
  }

  private handleWorkerMessage(e: MessageEvent) {
    const { type, payload } = e.data;

    if (type === 'EMBED_PROGRESS') {
      console.log('[Embedding Progress]', payload);
      return;
    }

    if (type === 'BATCH_SUCCESS') {
      const resolver = this.jobResolvers.get(payload.jobId);
      if (resolver) {
        resolver.resolve(payload);
        this.jobResolvers.delete(payload.jobId);
      }
    } else if (type === 'BATCH_FAILED') {
      const resolver = this.jobResolvers.get(payload.jobId);
      if (resolver) {
        resolver.reject(new Error(payload.error));
        this.jobResolvers.delete(payload.jobId);
      }
    }
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

    // Process in batches sequentially based on maxConcurrentJobs = 1
    for (let i = 0; i < pendingChunks.length; i += this.config.batchSize) {
      const batch = pendingChunks.slice(i, i + this.config.batchSize);
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
        'Transformers.js',
        'Xenova/all-MiniLM-L6-v2'
      );
      if (cached) {
        console.log(`[EmbeddingQueue] Cache hit for chunk ${chunk.id}`);
        // Create a copy of the cached embedding for this specific chunk
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
    while (attempt <= this.config.maxRetries) {
      try {
        const result = await this.dispatchToWorker(chunksToEmbed);

        const newEmbeddings: EmbeddingEntity[] = result.vectors.map(
          (vec: number[], idx: number) => ({
            schemaVersion: 1,
            embeddingId: crypto.randomUUID(),
            chunkId: chunksToEmbed[idx].id,
            documentId,
            provider: result.provider,
            model: result.model,
            dimensions: result.dimensions,
            vector: vec,
            createdAt: Date.now(),
            processingTime: result.processingTime / chunksToEmbed.length, // Average per chunk
            status: 'ACTIVE',
          })
        );

        await EmbeddingRepository.bulkInsert(newEmbeddings);

        chunksToEmbed.forEach((c) => (c.status = 'EMBEDDED'));
        await ChunkRepository.saveAll(chunksToEmbed);
        return;
      } catch (error) {
        attempt++;
        console.warn(
          `[EmbeddingQueue] Batch failed, attempt ${attempt}/${this.config.maxRetries}`,
          error
        );
        if (attempt > this.config.maxRetries) {
          console.error(`[EmbeddingQueue] Batch permanently failed.`);
          // Status stays PENDING or we could introduce FAILED state
          throw error;
        }
        await new Promise((res) =>
          setTimeout(res, this.config.retryDelay * Math.pow(2, attempt - 1))
        ); // Exponential backoff
      }
    }
  }

  private dispatchToWorker(chunks: ChunkEntity[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const jobId = crypto.randomUUID();
      this.jobResolvers.set(jobId, { resolve, reject });

      // Implement timeout logic
      setTimeout(() => {
        if (this.jobResolvers.has(jobId)) {
          this.jobResolvers.delete(jobId);
          reject(new Error('Worker timeout'));
        }
      }, this.config.timeout);

      this.worker.postMessage({
        type: 'BATCH_EMBED',
        payload: { jobId, chunks },
      });
    });
  }

  private async markDocumentIndexed(documentId: string) {
    const doc = await DocumentRepository.getById(documentId);
    if (doc) {
      doc.status = DocumentStatus.INDEXED; // Complete the milestone flow
      await DocumentRepository.save(doc);
      console.log(`[EmbeddingQueue] Document ${documentId} successfully INDEXED.`);
    }
  }
}
