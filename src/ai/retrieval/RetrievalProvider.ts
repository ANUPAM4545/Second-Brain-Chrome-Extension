export interface RetrievalRequest {
  query: string;
  queryEmbedding?: number[];
  topK?: number;
  filter?: {
    domain?: string;
    language?: string;
    dateRange?: { start?: number; end?: number };
  };
}

export interface RetrievalResult {
  chunkId: string;
  documentId: string;
  score: number;
  text: string;
  metadata: any;
}

export interface ProviderHealth {
  status: 'OK' | 'DEGRADED' | 'FAILED';
  message?: string;
  indexSize?: number;
}

export interface RetrievalProvider {
  initialize(): Promise<void>;
  search(request: RetrievalRequest): Promise<RetrievalResult[]>;
  health(): Promise<ProviderHealth>;
}
