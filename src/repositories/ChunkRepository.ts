import { db } from '../storage/db';
import type { ChunkEntity } from '../shared/types';

export class ChunkRepository {
  static async saveAll(chunks: ChunkEntity[]): Promise<string> {
    // Legacy support, falls back to bulkInsert
    await this.bulkInsert(chunks);
    return 'Saved';
  }

  static async bulkInsert(chunks: ChunkEntity[]): Promise<void> {
    await db.chunks.bulkPut(chunks);
  }

  static async findByDocument(documentId: string): Promise<ChunkEntity[]> {
    return await db.chunks.where('documentId').equals(documentId).toArray();
  }

  static async deleteByDocument(documentId: string): Promise<void> {
    const chunks = await this.findByDocument(documentId);
    const ids = chunks.map((c) => c.id);
    await db.chunks.bulkDelete(ids);
  }
}
