export class RetrievalMetrics {
  private static records: any[] = [];

  static record(
    query: string,
    denseTime: number,
    sparseTime: number,
    fusionTime: number,
    totalResults: number
  ) {
    this.records.push({
      timestamp: Date.now(),
      query,
      denseTime,
      sparseTime,
      fusionTime,
      totalTime: denseTime + sparseTime + fusionTime,
      totalResults,
    });

    // Keep last 100
    if (this.records.length > 100) {
      this.records.shift();
    }
  }

  static getMetrics() {
    return this.records;
  }
}
