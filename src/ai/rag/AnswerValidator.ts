import type { ContextBundle } from './ContextBuilder';
import type { GenerationResponse } from '../llm/LLMProvider';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  mappedCitations: number[];
}

export class AnswerValidator {
  static validate(
    response: GenerationResponse,
    contextBundle: ContextBundle,
    strictMode: boolean = true
  ): ValidationResult {
    // 1. Length violations
    if (response.finishReason === 'length') {
      return { isValid: false, reason: 'Answer exceeded maximum length', mappedCitations: [] };
    }

    if (response.finishReason === 'error') {
      return { isValid: false, reason: 'Provider returned an error', mappedCitations: [] };
    }

    // 2. Citation checks
    const citationRegex = /\[(\d+)\]/g;
    const matches = Array.from(response.text.matchAll(citationRegex));
    const extractedCitations = matches.map((m) => parseInt(m[1], 10));
    const uniqueCitations = Array.from(new Set(extractedCitations));

    if (strictMode && uniqueCitations.length === 0) {
      // Sometimes the model just says "I don't know". We should allow that.
      const noAnswerPhrases = ['do not know', "don't know", 'not contain the answer'];
      const isRefusal = noAnswerPhrases.some((p) => response.text.toLowerCase().includes(p));

      if (!isRefusal) {
        return { isValid: false, reason: 'No citations found in the answer', mappedCitations: [] };
      }
    }

    // 3. Mapping validation
    for (const citation of uniqueCitations) {
      if (!contextBundle.citations.has(citation)) {
        return {
          isValid: false,
          reason: `Citation [${citation}] does not map to any retrieved chunk`,
          mappedCitations: [],
        };
      }
    }

    return { isValid: true, mappedCitations: uniqueCitations };
  }
}
