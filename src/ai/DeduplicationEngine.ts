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

    if (existingDocs.length === 0) {
      // Completely new document
      incomingDoc.status = DocumentStatus.DEDUPLICATED;
      await DocumentRepository.save(incomingDoc);
      return incomingDoc;
    }

    // Sort existing by version number (descending) to get the latest
    existingDocs.sort((a, b) => b.versionNumber - a.versionNumber);
    const latestExisting = existingDocs[0];

    // 1. Exact Duplicate Check (Canonical Hash)
    if (incomingDoc.contentHash === latestExisting.contentHash) {
      console.log(
        `[DeduplicationEngine] Exact duplicate found for ${incomingDoc.url}. Incrementing visit count.`
      );

      latestExisting.visitCount += 1;
      latestExisting.lastVisitTime = incomingDoc.captureTime; // Update visit time
      latestExisting.status = DocumentStatus.DEDUPLICATED; // Just to ensure it can pass pipeline

      await DocumentRepository.save(latestExisting);

      // We return the existing document to proceed in the pipeline if needed,
      // or the pipeline can halt chunking if we flag it.
      // Since it's an exact duplicate, we don't strictly need to re-chunk, but the pipeline requires it to go to WaitingForEmbedding.
      // We will mark it DEDUPLICATED. The chunker can check if chunks already exist.
      return latestExisting;
    }

    // 2. Near Duplicate / Updated Content Check
    const similarity = this.similarityStrategy.compare(incomingDoc, latestExisting);

    // Whether it's a minor near-duplicate or a major rewrite, if the URL matches but hash differs,
    // we consider it a new version of the same canonical source.
    console.log(
      `[DeduplicationEngine] Content updated for ${incomingDoc.url}. Similarity: ${similarity.score}`
    );

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
