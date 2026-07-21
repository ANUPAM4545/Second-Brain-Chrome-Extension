import { db } from '../storage/db';
import type { ChunkEntity } from '../shared/types';

export class ChunkRepository {
  static async saveAll(chunks: ChunkEntity[]): Promise<string> {
    return db.chunks.bulkPut(chunks);
  }

  static async getByDocumentId(documentId: string): Promise<ChunkEntity[]> {
    return db.chunks.where('documentId').equals(documentId).toArray();
  }
}
