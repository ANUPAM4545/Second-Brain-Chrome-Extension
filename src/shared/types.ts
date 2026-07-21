export const DocumentStatus = {
  CAPTURED: 'CAPTURED',
  QUEUED: 'QUEUED',
  CLEANING: 'CLEANING',
  PARSED: 'PARSED',
  WAITING_FOR_DEDUP: 'WAITING_FOR_DEDUP',
  DEDUPLICATED: 'DEDUPLICATED',
  CHUNKED: 'CHUNKED',
  WAITING_FOR_EMBEDDING: 'WAITING_FOR_EMBEDDING',
  EMBEDDED: 'EMBEDDED',
  INDEXED: 'INDEXED',
  READY: 'READY',
  FAILED_PARSING: 'FAILED_PARSING',
  FAILED_EMBEDDING: 'FAILED_EMBEDDING',
  ARCHIVED: 'ARCHIVED',
  DELETED: 'DELETED',
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export interface DocumentEntity {
  schemaVersion: number;
  id: string; // UUID
  url: string;
  normalizedUrl: string;
  canonicalUrl?: string; // Stored if canonical tag is found/deduced
  title: string;
  domain: string;
  language: string;
  readingTime: number;
  wordCount: number;
  characterCount: number;
  captureTime: number; // Epoch
  lastVisitTime: number; // Epoch
  visitCount: number;

  // Hashing fields
  contentHash: string; // Canonical SHA-256 hash
  hashAlgorithm?: string;
  hashVersion?: string;
  hashTimestamp?: number;

  // Versioning fields
  versionNumber: number;
  parentDocumentId?: string;
  createdDate: number; // Epoch
  modifiedDate: number; // Epoch
  versionReason?: string;

  parserVersion: string;
  embeddingVersion: string;
  chunkCount: number;
  status: DocumentStatus;
  rawHtml?: string; // Optional raw capture
  markdown?: string; // Parsed markdown
}

export interface ChunkEntity {
  schemaVersion: number;
  id: string; // UUID
  documentId: string; // Foreign Key to DocumentEntity.id
  parentDocumentId?: string; // If document was versioned, the root ancestor
  chunkIndex: number;

  heading: string;
  hierarchy: string[]; // e.g. ["Introduction", "Subsection A"]

  startOffset: number;
  endOffset: number;

  wordCount: number;
  tokenCount: number; // Estimated in M3
  readingOrder: number;

  text: string;
  contentHash: string; // Hash of chunk text
  language: string;
  timestamp: number;
  status: 'PENDING' | 'EMBEDDED' | 'INDEXED';
}

export interface EmbeddingEntity {
  schemaVersion: number;
  id: string; // Foreign Key matches ChunkEntity ID
  vector: number[] | Float32Array; // Stored as array for Dexie
  modelName: string;
  modelVersion: string;
  dimension: number;
  generationTime: number; // Epoch
  status: 'ACTIVE' | 'STALE';
}

export interface EvaluationRunEntity {
  schemaVersion: number;
  id: string;
  timestamp: number;
  metrics: Record<string, any>;
}
