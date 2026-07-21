import { db } from '../storage/db';
import type { DocumentEntity } from '../shared/types';
import { DocumentStatus } from '../shared/types';

export class DocumentRepository {
  static async save(doc: DocumentEntity): Promise<string> {
    return db.documents.put(doc);
  }

  static async getById(id: string): Promise<DocumentEntity | undefined> {
    return db.documents.get(id);
  }

  static async getByUrl(url: string): Promise<DocumentEntity | undefined> {
    return db.documents.where('url').equals(url).first();
  }

  static async updateStatus(id: string, status: DocumentStatus): Promise<number> {
    return db.documents.update(id, { status });
  }

  static async getPendingDocuments(): Promise<DocumentEntity[]> {
    return db.documents
      .where('status')
      .anyOf([DocumentStatus.CAPTURED, DocumentStatus.QUEUED])
      .toArray();
  }
}
