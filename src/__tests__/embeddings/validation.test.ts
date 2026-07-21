import { describe, it, expect } from 'vitest';
import { VectorValidation } from '../../ai/embeddings/Validation';

describe('VectorValidation', () => {
  it('should pass valid vectors', () => {
    expect(() => {
      VectorValidation.validateBatch([[0.1, 0.2, 0.3]], 3);
    }).not.toThrow();
  });

  it('should throw on dimension mismatch', () => {
    expect(() => {
      VectorValidation.validateBatch([[0.1, 0.2]], 3);
    }).toThrow('Vector dimension mismatch. Expected 3, got 2');
  });

  it('should throw on NaN', () => {
    expect(() => {
      VectorValidation.validateBatch([[0.1, NaN, 0.3]], 3);
    }).toThrow('Vector contains NaN or Infinity values');
  });

  it('should throw on Infinity', () => {
    expect(() => {
      VectorValidation.validateBatch([[0.1, Infinity, 0.3]], 3);
    }).toThrow('Vector contains NaN or Infinity values');
  });
});
