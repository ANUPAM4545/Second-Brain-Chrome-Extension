import type { DocumentEntity } from '../shared/types';

export interface SimilarityResult {
  score: number;
  isNearDuplicate: boolean;
}

export interface SimilarityStrategy {
  compare(a: DocumentEntity, b: DocumentEntity): SimilarityResult;
}

export class JaccardSimilarityStrategy implements SimilarityStrategy {
  private threshold: number;
  private shingleSize: number;

  constructor(threshold = 0.9, shingleSize = 3) {
    this.threshold = threshold;
    this.shingleSize = shingleSize;
  }

  private getShingles(text: string): Set<string> {
    const shingles = new Set<string>();
    // Basic normalization: lowercasing, removing punctuation, splitting by whitespace
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]|_/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ');

    if (words.length < this.shingleSize) {
      shingles.add(words.join(' '));
      return shingles;
    }

    for (let i = 0; i <= words.length - this.shingleSize; i++) {
      shingles.add(words.slice(i, i + this.shingleSize).join(' '));
    }

    return shingles;
  }

  compare(a: DocumentEntity, b: DocumentEntity): SimilarityResult {
    if (!a.markdown || !b.markdown) {
      return { score: 0, isNearDuplicate: false };
    }

    const setA = this.getShingles(a.markdown);
    const setB = this.getShingles(b.markdown);

    if (setA.size === 0 && setB.size === 0) return { score: 1.0, isNearDuplicate: true };
    if (setA.size === 0 || setB.size === 0) return { score: 0.0, isNearDuplicate: false };

    let intersectionCount = 0;
    for (const shingle of setA) {
      if (setB.has(shingle)) {
        intersectionCount++;
      }
    }

    const unionCount = setA.size + setB.size - intersectionCount;
    const score = intersectionCount / unionCount;

    return {
      score,
      isNearDuplicate: score >= this.threshold,
    };
  }
}
