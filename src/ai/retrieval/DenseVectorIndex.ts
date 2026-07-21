import { db } from '../../storage/db';
import type { EmbeddingEntity } from '../../shared/types';

export interface IndexedVector {
  chunkId: string;
  documentId: string;
  vector: number[] | Float32Array;
  vectorNorm: number;
}

export class DenseVectorIndex {
  private static vectors: IndexedVector[] = [];
  private static isLoaded = false;
  private static loadingPromise: Promise<void> | null = null;

  static async loadIndex(): Promise<void> {
    if (this.isLoaded) return;

    if (!this.loadingPromise) {
      this.loadingPromise = (async () => {
        try {
          console.log('[DenseVectorIndex] Loading vectors into memory...');
          const allEmbeddings = await db.embeddings.filter((e) => e.status === 'ACTIVE').toArray();

          this.vectors = allEmbeddings.map((e) => ({
            chunkId: e.chunkId,
            documentId: e.documentId,
            vector: e.vector,
            vectorNorm: e.vectorNorm,
          }));

          this.isLoaded = true;
          console.log(`[DenseVectorIndex] Loaded ${this.vectors.length} vectors.`);
        } catch (error) {
          console.error('[DenseVectorIndex] Failed to load index:', error);
          this.loadingPromise = null;
          throw error;
        }
      })();
    }

    return this.loadingPromise;
  }

  static async addEmbedding(embedding: EmbeddingEntity) {
    if (!this.isLoaded) await this.loadIndex();
    this.vectors.push({
      chunkId: embedding.chunkId,
      documentId: embedding.documentId,
      vector: embedding.vector,
      vectorNorm: embedding.vectorNorm,
    });
  }

  static getVectors(): IndexedVector[] {
    if (!this.isLoaded) {
      throw new Error('Index not loaded. Call loadIndex() first.');
    }
    return this.vectors;
  }

  static getIndexSize(): number {
    return this.vectors.length;
  }
}
