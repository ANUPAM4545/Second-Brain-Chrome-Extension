export class VectorValidation {
  static validateBatch(vectors: number[][], expectedDim: number): void {
    for (let i = 0; i < vectors.length; i++) {
      const vec = vectors[i];
      if (vec.length !== expectedDim) {
        throw new Error(`Vector dimension mismatch. Expected ${expectedDim}, got ${vec.length}`);
      }
      for (const val of vec) {
        if (isNaN(val) || !isFinite(val)) {
          throw new Error('Vector contains NaN or Infinity values');
        }
      }
    }
  }
}
