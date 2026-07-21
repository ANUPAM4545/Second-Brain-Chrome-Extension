import type { RetrievalResult } from './RetrievalProvider';
import { DenseRetrievalProvider } from './DenseRetrievalProvider';
import { SparseRetrievalProvider } from './SparseRetrievalProvider';
import { QueryProcessor } from './QueryProcessor';
import { RetrievalMetrics } from '../../metrics/RetrievalMetrics';
import { TransformersProvider } from '../embeddings/TransformersProvider';

export class HybridSearchEngine {
  private dense: DenseRetrievalProvider;
  private sparse: SparseRetrievalProvider;

  // WRRF Configuration
  private readonly Wd = 0.6; // Dense weight
  private readonly Ws = 0.4; // Sparse weight
  private readonly k = 60; // WRRF constant

  constructor() {
    this.dense = new DenseRetrievalProvider();
    this.sparse = new SparseRetrievalProvider();
  }

  async initialize() {
    console.log('[HybridSearchEngine] Initializing providers...');
    await Promise.all([this.dense.initialize(), this.sparse.initialize()]);
  }

  async search(rawQuery: string, topK: number = 10): Promise<RetrievalResult[]> {
    const startTime = performance.now();

    // 1. Preprocess Query
    const request = QueryProcessor.process(rawQuery);
    request.topK = Math.max(topK * 2, 50); // Fetch more for fusion

    // 2. Generate Query Embedding
    const provider = new TransformersProvider();
    await provider.initialize();
    const queryEmbedding = await provider.embed(request.query);
    request.queryEmbedding = queryEmbedding;

    // 3. Execute Searches in parallel
    const denseStart = performance.now();
    const denseResults = await this.dense.search(request);
    const denseTime = performance.now() - denseStart;

    const sparseStart = performance.now();
    const sparseResults = await this.sparse.search(request);
    const sparseTime = performance.now() - sparseStart;

    // 4. Weighted Reciprocal Rank Fusion
    const fusionStart = performance.now();

    const fusionScores = new Map<string, number>();
    const chunkMap = new Map<string, RetrievalResult>();

    // Map Dense Ranks
    denseResults.forEach((result, idx) => {
      const rank = idx + 1;
      const score = this.Wd * (1 / (this.k + rank));
      fusionScores.set(result.chunkId, (fusionScores.get(result.chunkId) || 0) + score);
      chunkMap.set(result.chunkId, result);
    });

    // Map Sparse Ranks
    sparseResults.forEach((result, idx) => {
      const rank = idx + 1;
      const score = this.Ws * (1 / (this.k + rank));
      fusionScores.set(result.chunkId, (fusionScores.get(result.chunkId) || 0) + score);
      chunkMap.set(result.chunkId, result);
    });

    // 5. Sort and Select Top K
    const sortedIds = Array.from(fusionScores.keys()).sort(
      (a, b) => fusionScores.get(b)! - fusionScores.get(a)!
    );

    const finalResults: RetrievalResult[] = sortedIds.slice(0, topK).map((id) => {
      const result = chunkMap.get(id)!;
      return {
        ...result,
        score: fusionScores.get(id)!, // Replace original score with WRRF score
      };
    });

    const fusionTime = performance.now() - fusionStart;

    // Record Metrics
    RetrievalMetrics.record(rawQuery, denseTime, sparseTime, fusionTime, finalResults.length);

    console.log(
      `[HybridSearchEngine] Search completed in ${(performance.now() - startTime).toFixed(2)}ms`
    );
    return finalResults;
  }
}
