import type {
  RetrievalProvider,
  RetrievalRequest,
  RetrievalResult,
  ProviderHealth,
} from './RetrievalProvider';
import { DenseVectorIndex } from './DenseVectorIndex';

export class DenseRetrievalProvider implements RetrievalProvider {
  async initialize(): Promise<void> {
    await DenseVectorIndex.loadIndex();
  }

  async search(request: RetrievalRequest): Promise<RetrievalResult[]> {
    if (!request.queryEmbedding) {
      throw new Error('DenseRetrievalProvider requires a queryEmbedding in the request');
    }

    const qVector = request.queryEmbedding;
    // Calculate query norm
    const qNorm = Math.sqrt(qVector.reduce((sum, val) => sum + val * val, 0));

    if (qNorm === 0) return []; // Avoid division by zero

    const vectors = DenseVectorIndex.getVectors();
    const scores = new Map<string, number>();

    // Cosine Similarity using precomputed norms
    for (const v of vectors) {
      let dotProduct = 0;
      for (let i = 0; i < qVector.length; i++) {
        dotProduct += qVector[i] * v.vector[i];
      }
      const similarity = dotProduct / (qNorm * v.vectorNorm);
      scores.set(v.chunkId, similarity);
    }

    // Sort by descending score
    const sortedIds = Array.from(scores.keys()).sort((a, b) => scores.get(b)! - scores.get(a)!);

    const topK = request.topK || 10;

    // Fetch chunk metadata
    const results: RetrievalResult[] = [];
    const { db } = await import('../../storage/db');

    for (const chunkId of sortedIds) {
      if (results.length >= topK) break;

      const chunk = await db.chunks.get(chunkId);

      if (chunk) {
        // Apply Metadata filtering
        if (request.filter?.language && chunk.language !== request.filter.language) continue;
        if (request.filter?.documentId && chunk.documentId !== request.filter.documentId) continue;
        if (chunk.wordCount < 15) continue; // Skip useless tiny chunks like infobox cells

        results.push({
          chunkId: chunk.id,
          documentId: chunk.documentId,
          score: scores.get(chunkId)!,
          text: chunk.text,
          metadata: { heading: chunk.heading, hierarchy: chunk.hierarchy },
        });
      }
    }

    return results;
  }

  async health(): Promise<ProviderHealth> {
    try {
      await DenseVectorIndex.loadIndex();
      return { status: 'OK', indexSize: DenseVectorIndex.getIndexSize() };
    } catch (e: any) {
      return { status: 'FAILED', message: e.message };
    }
  }
}
