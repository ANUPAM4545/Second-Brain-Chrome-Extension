import type { RetrievalResult } from '../retrieval/RetrievalProvider';

export interface ContextBundle {
  contextText: string;
  citations: Map<number, RetrievalResult>;
  estimatedTokens: number;
  documents: Set<string>;
}

export class ContextBuilder {
  // Rough estimate: 1 token ~= 4 characters
  private static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  static build(results: RetrievalResult[], maxTokens: number = 2000): ContextBundle {
    // 1. Deduplicate (if multiple chunks from same text appear, though hybrid search shouldn't return exact duplicates)
    const uniqueChunks = new Map<string, RetrievalResult>();

    // Preserve reading order by sorting by chunkId if they belong to the same document.
    // In our simplified chunkId scheme, we assume they can be sorted. If not, we just use retrieval rank.
    // We'll deduplicate by chunkId first.
    results.forEach((r) => {
      if (!uniqueChunks.has(r.chunkId)) {
        uniqueChunks.set(r.chunkId, r);
      }
    });

    const orderedResults = Array.from(uniqueChunks.values());

    let currentTokens = 0;
    const citations = new Map<number, RetrievalResult>();
    const documents = new Set<string>();
    let contextText = '';

    let citationIndex = 1;

    for (const result of orderedResults) {
      const chunkTokens = this.estimateTokens(result.text);

      // Enforce token limit (Truncate from tail)
      if (currentTokens + chunkTokens > maxTokens) {
        break; // Stop adding chunks if budget exceeded
      }

      citations.set(citationIndex, result);
      documents.add(result.documentId);

      // Append formatted context
      contextText += `[Citation ${citationIndex}]\nDocument: ${result.metadata?.heading || 'Unknown'}\nContent:\n${result.text}\n\n`;

      currentTokens += chunkTokens;
      citationIndex++;
    }

    return {
      contextText: contextText.trim(),
      citations,
      estimatedTokens: currentTokens,
      documents,
    };
  }
}
