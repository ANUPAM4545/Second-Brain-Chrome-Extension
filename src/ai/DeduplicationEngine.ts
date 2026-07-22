import type { DocumentEntity } from '../shared/types';
import { DocumentStatus } from '../shared/types';
import { DocumentRepository } from '../repositories/DocumentRepository';
import type { SimilarityStrategy } from './similarity';

export class DeduplicationEngine {
  private similarityStrategy: SimilarityStrategy;

  constructor(similarityStrategy: SimilarityStrategy) {
    this.similarityStrategy = similarityStrategy;
  }

  /**
   * Deduplicates a parsed document against existing documents in the repository.
   * Handles exact duplicates (visit count increment) and near-duplicates / updates (versioning).
   *
   * @param incomingDoc - The newly parsed document.
   * @returns The resolved DocumentEntity (either the updated original or the new version) set to DEDUPLICATED.
   */
  async process(incomingDoc: DocumentEntity): Promise<DocumentEntity> {
    const existingDocs = await DocumentRepository.findByCanonicalUrl(
      incomingDoc.canonicalUrl || incomingDoc.normalizedUrl
    );

    // Filter out the incoming document itself
    const otherDocs = existingDocs.filter((d) => d.id !== incomingDoc.id);

    if (otherDocs.length === 0) {
      // Completely new document
      incomingDoc.status = DocumentStatus.DEDUPLICATED;
      await DocumentRepository.save(incomingDoc);
      return incomingDoc;
    }

    // Sort existing by version number (descending) to get the latest
    otherDocs.sort((a, b) => b.versionNumber - a.versionNumber);
    const latestExisting = otherDocs[0];

    // 1. Exact Duplicate Check (Canonical Hash)
    if (incomingDoc.contentHash === latestExisting.contentHash) {
      latestExisting.visitCount += 1;
      latestExisting.lastVisitTime = incomingDoc.captureTime; // Update visit time
      latestExisting.status = DocumentStatus.DEDUPLICATED; // Just to ensure it can pass pipeline

      await DocumentRepository.save(latestExisting);
      
      // Delete the new orphaned document from the database to prevent it from being stuck in WAITING_FOR_DEDUP
      const { db } = await import('../storage/db');
      await db.documents.delete(incomingDoc.id);

      return latestExisting;
    }

    // 2. Near Duplicate / Updated Content Check
    const similarity = this.similarityStrategy.compare(incomingDoc, latestExisting);

    // Whether it's a minor near-duplicate or a major rewrite, if the URL matches but hash differs,
    // we consider it a new version of the same canonical source.


    incomingDoc.versionNumber = latestExisting.versionNumber + 1;
    incomingDoc.parentDocumentId = latestExisting.parentDocumentId || latestExisting.id;
    incomingDoc.versionReason = similarity.isNearDuplicate
      ? 'Near Duplicate / Minor Update'
      : 'Major Content Update';
    incomingDoc.status = DocumentStatus.DEDUPLICATED;

    await DocumentRepository.save(incomingDoc);
    return incomingDoc;
  }
}
