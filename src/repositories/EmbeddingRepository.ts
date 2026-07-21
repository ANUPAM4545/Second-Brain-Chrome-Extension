import { db } from '../storage/db';
import type { EmbeddingEntity } from '../shared/types';

export class EmbeddingRepository {
  static async save(embedding: EmbeddingEntity): Promise<string> {
    return await db.embeddings.put(embedding);
  }

  static async bulkInsert(embeddings: EmbeddingEntity[]): Promise<void> {
    await db.embeddings.bulkPut(embeddings);
  }

  static async findByChunk(chunkId: string): Promise<EmbeddingEntity[]> {
    return await db.embeddings.where('chunkId').equals(chunkId).toArray();
  }

  static async findByDocument(documentId: string): Promise<EmbeddingEntity[]> {
    return await db.embeddings.where('documentId').equals(documentId).toArray();
  }

  static async deleteByDocument(documentId: string): Promise<void> {
    const embeddings = await this.findByDocument(documentId);
    const ids = embeddings.map((e) => e.embeddingId);
    await db.embeddings.bulkDelete(ids);
  }

  /**
   * Checks the cache for an existing embedding by contentHash, provider, and model.
   * If found, we can reuse it instead of running inference again.
   */
  static async checkCache(
    contentHash: string,
    provider: string,
    model: string
  ): Promise<EmbeddingEntity | undefined> {
    // Currently Dexie doesn't natively index contentHash on embeddings if we didn't add it,
    // Wait, contentHash is on the Chunk, not the Embedding.
    // If we want to check cache by contentHash, we must either:
    // 1. Add contentHash to EmbeddingEntity
    // 2. Query chunks by contentHash, get their chunkId, then check embeddings.

    // Let's implement approach 2 for now, as PRD didn't explicitly add contentHash to Embedding schema.
    const chunks = await db.chunks.where('contentHash').equals(contentHash).toArray();
    for (const chunk of chunks) {
      // Since our Dexie schema doesn't have a compound index [provider+model], we do it manually.
      // Wait, our index is 'embeddingId, chunkId, documentId, provider, model'.
      const matchingEmbeds = await db.embeddings.where('chunkId').equals(chunk.id).toArray();
      const valid = matchingEmbeds.find((e) => e.provider === provider && e.model === model);
      if (valid) return valid;
    }
    return undefined;
  }
}
