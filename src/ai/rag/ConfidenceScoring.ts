import type { ContextBundle } from './ContextBuilder';

export interface ConfidenceResult {
  level: 'High' | 'Medium' | 'Low';
  score: number;
  components: {
    retrievalScoreComponent: number;
    citationCoverageComponent: number;
    completenessComponent: number;
  };
}

export class ConfidenceScoring {
  // Configurable weights per PRD
  private static readonly WEIGHTS = {
    retrieval: 0.5,
    citation: 0.3,
    completeness: 0.2,
  };

  static calculate(
    contextBundle: ContextBundle,
    mappedCitations: number[],
    answerLength: number
  ): ConfidenceResult {
    // 1. Average retrieval score for the chunks ACTUALLY cited
    let retrievalScoreComponent = 0;
    if (mappedCitations.length > 0) {
      let totalScore = 0;
      for (const cit of mappedCitations) {
        const chunk = contextBundle.citations.get(cit);
        if (chunk) {
          totalScore += chunk.score;
        }
      }
      retrievalScoreComponent = totalScore / mappedCitations.length;
    } else {
      // If no citations, maybe it was a refusal.
      retrievalScoreComponent = 0;
    }

    // Normalize retrieval score if it's not already in [0,1]. WRRF scores are usually small.
    // We'll apply a simple scaling or assume WRRF is roughly [0, 0.5].
    // For this simple heuristic, let's just clamp it or scale it.
    // WRRF max is usually 1, but often ~0.016. We'll normalize based on max observed,
    // or just pass it through if it's already bounded.
    // Let's assume WRRF scores are already [0,1], but very low. We'll boost it for the heuristic.
    const normalizedRetrieval = Math.min(1.0, retrievalScoreComponent * 10);

    // 2. Citation coverage: ratio of cited chunks to total provided chunks (up to 1)
    let citationCoverageComponent = 0;
    if (contextBundle.citations.size > 0) {
      citationCoverageComponent = mappedCitations.length / contextBundle.citations.size;
    }

    // 3. Completeness: naive check based on length. If > 50 chars, assume it's somewhat complete.
    let completenessComponent = Math.min(1.0, answerLength / 200); // Caps at 200 chars

    // 4. Combine
    const finalScore =
      this.WEIGHTS.retrieval * normalizedRetrieval +
      this.WEIGHTS.citation * citationCoverageComponent +
      this.WEIGHTS.completeness * completenessComponent;

    let level: 'High' | 'Medium' | 'Low' = 'Low';
    if (finalScore > 0.8) {
      level = 'High';
    } else if (finalScore >= 0.5) {
      level = 'Medium';
    }

    return {
      level,
      score: finalScore,
      components: {
        retrievalScoreComponent: normalizedRetrieval,
        citationCoverageComponent,
        completenessComponent,
      },
    };
  }
}
