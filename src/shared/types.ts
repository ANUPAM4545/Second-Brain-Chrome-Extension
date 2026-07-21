export const DocumentStatus = {
  CAPTURED: 'CAPTURED',
  QUEUED: 'QUEUED',
  CLEANING: 'CLEANING',
  DEDUPLICATING: 'DEDUPLICATING',
  CHUNKING: 'CHUNKING',
  EMBEDDING: 'EMBEDDING',
  INDEXED: 'INDEXED',
  READY: 'READY',
  FAILED_PARSING: 'FAILED_PARSING',
  FAILED_EMBEDDING: 'FAILED_EMBEDDING',
  ARCHIVED: 'ARCHIVED',
  DELETED: 'DELETED'
} as const;

export type DocumentStatus = typeof DocumentStatus[keyof typeof DocumentStatus];

export interface DocumentEntity {
  id: string; // UUID
  url: string;
  normalizedUrl: string;
  title: string;
  domain: string;
  language: string;
  readingTime: number;
  wordCount: number;
  characterCount: number;
  captureTime: number; // Epoch
  lastVisitTime: number; // Epoch
  visitCount: number;
  contentHash: string;
  parserVersion: string;
  embeddingVersion: string;
  chunkCount: number;
  status: DocumentStatus;
  rawHtml?: string; // Optional raw capture
  markdown?: string; // Parsed markdown
}

export interface ChunkEntity {
  id: string; // UUID
  documentId: string; // Foreign Key
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
  tokenCount: number;
  text: string;
}

export interface EmbeddingEntity {
  id: string; // Foreign Key matches ChunkEntity ID
  vector: number[] | Float32Array; // Stored as array for Dexie
  modelName: string;
  modelVersion: string;
  dimension: number;
  generationTime: number; // Epoch
  status: 'ACTIVE' | 'STALE';
}
