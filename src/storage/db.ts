import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { DocumentEntity, ChunkEntity, EmbeddingEntity } from '../shared/types';

export class SecondBrainDB extends Dexie {
  documents!: Table<DocumentEntity, string>; // string = type of the primary key
  chunks!: Table<ChunkEntity, string>;
  embeddings!: Table<EmbeddingEntity, string>;

  constructor() {
    super('SecondBrainDB');
    this.version(2).stores({
      documents:
        'id, url, normalizedUrl, canonicalUrl, domain, status, contentHash, parentDocumentId',
      chunks: 'id, documentId, parentDocumentId, contentHash, status',
      embeddings: 'id, status',
    });
  }
}

export const db = new SecondBrainDB();
