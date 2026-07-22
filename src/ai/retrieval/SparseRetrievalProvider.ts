import type {
  RetrievalProvider,
  RetrievalRequest,
  RetrievalResult,
  ProviderHealth,
} from './RetrievalProvider';
import { CustomBM25 } from './CustomBM25';

export class SparseRetrievalProvider implements RetrievalProvider {
  private bm25: CustomBM25;

  constructor() {
    this.bm25 = new CustomBM25({ k1: 1.2, b: 0.75 });
  }

  async initialize(): Promise<void> {
    await this.bm25.buildIndex();
  }

  async search(request: RetrievalRequest): Promise<RetrievalResult[]> {
    const scores = this.bm25.search(request.query);

    // Sort by descending score
    const sortedIds = Array.from(scores.keys()).sort((a, b) => scores.get(b)! - scores.get(a)!);

    const topK = request.topK || 10;
    const topIds = sortedIds.slice(0, topK);

    const results: RetrievalResult[] = [];
    const { db } = await import('../../storage/db');

    for (const chunkId of topIds) {
      const chunk = await db.chunks.get(chunkId);
      if (chunk) {
        if (request.filter?.language && chunk.language !== request.filter.language) {
          continue;
        }
        if (request.filter?.documentId && chunk.documentId !== request.filter.documentId) {
          continue;
        }

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
      await this.bm25.buildIndex();
      return { status: 'OK', indexSize: this.bm25.getIndexSize() };
    } catch (e: any) {
      return { status: 'FAILED', message: e.message };
    }
  }
}
