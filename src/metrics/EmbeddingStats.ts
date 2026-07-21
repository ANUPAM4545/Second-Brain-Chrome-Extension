export class EmbeddingStats {
  private static stats = {
    totalEmbeddings: 0,
    cachedEmbeddings: 0,
    failedEmbeddings: 0,
    totalEmbeddingTime: 0,
    totalBatchTime: 0,
    batchCount: 0,
    retryCount: 0,
    queueLatency: 0,
  };

  static recordNewEmbedding(timeMs: number) {
    this.stats.totalEmbeddings++;
    this.stats.totalEmbeddingTime += timeMs;
  }

  static recordCachedEmbedding() {
    this.stats.totalEmbeddings++;
    this.stats.cachedEmbeddings++;
  }

  static recordFailure() {
    this.stats.failedEmbeddings++;
  }

  static recordBatch(batchTimeMs: number) {
    this.stats.batchCount++;
    this.stats.totalBatchTime += batchTimeMs;
  }

  static recordRetry() {
    this.stats.retryCount++;
  }

  static getStats() {
    const cacheHitRate =
      this.stats.totalEmbeddings > 0 ? this.stats.cachedEmbeddings / this.stats.totalEmbeddings : 0;

    const averageEmbeddingTime =
      this.stats.totalEmbeddings - this.stats.cachedEmbeddings > 0
        ? this.stats.totalEmbeddingTime / (this.stats.totalEmbeddings - this.stats.cachedEmbeddings)
        : 0;

    const averageBatchTime =
      this.stats.batchCount > 0 ? this.stats.totalBatchTime / this.stats.batchCount : 0;

    return {
      ...this.stats,
      cacheHitRate,
      averageEmbeddingTime,
      averageBatchTime,
    };
  }
}
