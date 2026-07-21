import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { DocumentEntity, ChunkEntity, EmbeddingEntity } from '../shared/types';

export class SecondBrainDB extends Dexie {
  documents!: Table<DocumentEntity, string>; // string = type of the primary key
  chunks!: Table<ChunkEntity, string>;
  embeddings!: Table<EmbeddingEntity, string>;

  constructor() {
    super('SecondBrainDB');

    // Define schema
    this.version(1).stores({
      documents: 'id, url, normalizedUrl, domain, captureTime, lastVisitTime, status',
      chunks: 'id, documentId',
      embeddings: 'id, status',
    });
  }
}

export const db = new SecondBrainDB();
