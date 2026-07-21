import { db } from '../storage/db';
import type { EmbeddingEntity } from '../shared/types';

export class EmbeddingRepository {
  static async saveAll(embeddings: EmbeddingEntity[]): Promise<string> {
    return db.embeddings.bulkPut(embeddings);
  }

  static async getById(id: string): Promise<EmbeddingEntity | undefined> {
    return db.embeddings.get(id);
  }
}
