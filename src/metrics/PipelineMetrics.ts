export interface PipelineMetricsRecord {
  documentId: string;
  captureTime: number; // Duration in ms
  parsingTime: number;
  normalizationTime: number;
  deduplicationTime: number;
  chunkingTime: number;
  embeddingTime: number;
  totalProcessingTime: number;
}

export class PipelineMetrics {
  private static records = new Map<string, Partial<PipelineMetricsRecord>>();

  static start(documentId: string) {
    if (!this.records.has(documentId)) {
      this.records.set(documentId, { documentId });
    }
  }

  static recordTime(documentId: string, stage: keyof PipelineMetricsRecord, durationMs: number) {
    const record = this.records.get(documentId);
    if (record) {
      (record as any)[stage] = ((record as any)[stage] || 0) + durationMs;

      // Update total
      record.totalProcessingTime =
        (record.captureTime || 0) +
        (record.parsingTime || 0) +
        (record.normalizationTime || 0) +
        (record.deduplicationTime || 0) +
        (record.chunkingTime || 0) +
        (record.embeddingTime || 0);
    }
  }

  static getMetrics(documentId: string): Partial<PipelineMetricsRecord> | undefined {
    return this.records.get(documentId);
  }
}
