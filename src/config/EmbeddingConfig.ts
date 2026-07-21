export interface EmbeddingConfigType {
  modelName: string;
  provider: string;
  dimensions: number;
  batchSize: number;
  maxConcurrentJobs: number;
  maxRetries: number;
  timeout: number;
  retryDelay: number;
  schemaVersion: number;
}

export const EmbeddingConfig: EmbeddingConfigType = {
  modelName: 'Xenova/all-MiniLM-L6-v2',
  provider: 'Transformers.js',
  dimensions: 384,
  batchSize: 8,
  maxConcurrentJobs: 1,
  maxRetries: 3,
  timeout: 30000,
  retryDelay: 1000,
  schemaVersion: 1,
};
