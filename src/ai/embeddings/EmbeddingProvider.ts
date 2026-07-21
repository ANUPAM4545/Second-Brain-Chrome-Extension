export interface EmbeddingProvider {
  /** Initializes the model. Should be safe to call multiple times (idempotent). */
  initialize(): Promise<void>;

  /** Embeds a single string. */
  embed(text: string): Promise<number[]>;

  /** Embeds a batch of strings. Returns an array of vectors. */
  embedBatch(texts: string[]): Promise<number[][]>;

  /** Gets the dimension size for the loaded model. */
  getDimensions(): number;

  /** Gets the model identifier. */
  getModelName(): string;

  /** Gets the provider name (e.g. 'Transformers.js') */
  getProviderName(): string;
}
