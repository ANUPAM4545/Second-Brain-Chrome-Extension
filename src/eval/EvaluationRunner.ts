import { RAGPipeline } from '../ai/rag/RAGPipeline';
import type { RAGResponse } from '../ai/rag/RAGPipeline';

export interface EvaluationQuery {
  id: string;
  category: string;
  query: string;
  expectedKeywords?: string[];
  expectedCitationCountMin?: number;
  expectedConfidenceRange?: [number, number]; // e.g. [0.5, 1.0]
  notes?: string;
}

export interface EvaluationResult {
  queryId: string;
  category: string;
  success: boolean;
  retrievedCount: number;
  latencyMs: number;
  confidenceScore: number;
  error?: string;
}

export interface EvaluationReport {
  totalQueries: number;
  successRate: number;
  averageLatencyMs: number;
  averageConfidence: number;
  categoryStats: Record<string, { total: number; success: number }>;
  failedQueries: EvaluationResult[];
}

export class EvaluationRunner {
  private pipeline: RAGPipeline;

  constructor(pipeline: RAGPipeline) {
    this.pipeline = pipeline;
  }

  async evaluateDataset(queries: EvaluationQuery[]): Promise<EvaluationReport> {
    const results: EvaluationResult[] = [];

    for (const q of queries) {
      const start = performance.now();
      let retrievedCount = 0;
      let finalResult: RAGResponse | null = null;
      let errorMsg: string | undefined = undefined;
      let success = true;

      try {
        const stream = this.pipeline.streamAnswer(q.query);
        for await (const msg of stream) {
          if (msg.type === 'metadata') {
            finalResult = msg.data as RAGResponse;
            retrievedCount = finalResult.citations?.size || 0;
          } else if (msg.type === 'chunk' && msg.data.isDone) {
            // chunk is done, wait for metadata
          }
        }

        const latencyMs = Math.round(performance.now() - start);

        if (!finalResult) {
          success = false;
          errorMsg = 'No final result returned';
        } else {
          if (q.expectedKeywords && finalResult.answer) {
            const answer = finalResult.answer.toLowerCase();
            const missing = q.expectedKeywords.filter((kw) => !answer.includes(kw.toLowerCase()));
            if (missing.length > 0) {
              success = false;
              errorMsg = `Missing expected keywords: ${missing.join(', ')}`;
            }
          }

          // Verify citations
          if (
            q.expectedCitationCountMin !== undefined &&
            retrievedCount < q.expectedCitationCountMin
          ) {
            success = false;
            errorMsg = `Expected at least ${q.expectedCitationCountMin} citations, got ${retrievedCount}`;
          }

          // Verify confidence
          if (q.expectedConfidenceRange) {
            const score = finalResult.confidence.score;
            if (score < q.expectedConfidenceRange[0] || score > q.expectedConfidenceRange[1]) {
              success = false;
              errorMsg = `Confidence ${score.toFixed(2)} outside expected range [${q.expectedConfidenceRange[0]}, ${q.expectedConfidenceRange[1]}]`;
            }
          }
        }

        results.push({
          queryId: q.id,
          category: q.category,
          success,
          retrievedCount,
          latencyMs,
          confidenceScore: finalResult?.confidence.score || 0,
          error: errorMsg,
        });
      } catch (err: any) {
        results.push({
          queryId: q.id,
          category: q.category,
          success: false,
          retrievedCount: 0,
          latencyMs: Math.round(performance.now() - start),
          confidenceScore: 0,
          error: err.message,
        });
      }
    }

    return this.generateReport(results);
  }

  private generateReport(results: EvaluationResult[]): EvaluationReport {
    const total = results.length;
    const successful = results.filter((r) => r.success);
    const successRate = total > 0 ? successful.length / total : 0;

    const validLatencies = successful.map((r) => r.latencyMs);
    const avgLatency =
      validLatencies.length > 0
        ? validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length
        : 0;

    const validConfidences = successful.map((r) => r.confidenceScore);
    const avgConfidence =
      validConfidences.length > 0
        ? validConfidences.reduce((a, b) => a + b, 0) / validConfidences.length
        : 0;

    const categoryStats: Record<string, { total: number; success: number }> = {};
    for (const r of results) {
      if (!categoryStats[r.category]) categoryStats[r.category] = { total: 0, success: 0 };
      categoryStats[r.category].total++;
      if (r.success) categoryStats[r.category].success++;
    }

    return {
      totalQueries: total,
      successRate,
      averageLatencyMs: avgLatency,
      averageConfidence: avgConfidence,
      categoryStats,
      failedQueries: results.filter((r) => !r.success),
    };
  }
}
