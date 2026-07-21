import { DocumentRepository } from '../../repositories/DocumentRepository';
import { ChunkRepository } from '../../repositories/ChunkRepository';
import { EmbeddingRepository } from '../../repositories/EmbeddingRepository';
import { DocumentStatus } from '../../shared/types';
import { EmbeddingConfig } from '../../config/EmbeddingConfig';

export class ReadinessValidator {
  /**
   * Validates if a document is fully ready for retrieval.
   * - Status must be INDEXED.
   * - All chunks must have embeddings.
   * - Embeddings must have vectorNorm and matching dimensions.
   * - Provider/Model/Schema versions must match current config.
   */
  static async validateDocument(
    documentId: string
  ): Promise<{ isReady: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    const doc = await DocumentRepository.getById(documentId);
    if (!doc) {
      return { isReady: false, reasons: ['Document not found'] };
    }

    if (doc.status !== DocumentStatus.INDEXED) {
      reasons.push(`Document status is ${doc.status}, not INDEXED`);
    }

    const chunks = await ChunkRepository.findByDocument(documentId);
    if (chunks.length === 0) {
      reasons.push('Document has no chunks');
    }

    const embeddings = await EmbeddingRepository.findByDocument(documentId);
    if (chunks.length !== embeddings.length) {
      reasons.push(
        `Missing embeddings: ${chunks.length} chunks but only ${embeddings.length} embeddings`
      );
    }

    for (const emb of embeddings) {
      if (emb.dimensions !== EmbeddingConfig.dimensions) {
        reasons.push(`Dimension mismatch on embedding ${emb.embeddingId}`);
      }
      if (emb.provider !== EmbeddingConfig.provider || emb.model !== EmbeddingConfig.modelName) {
        reasons.push(`Model/Provider mismatch on embedding ${emb.embeddingId}`);
      }
      if (!emb.vectorNorm || emb.vectorNorm === 0) {
        reasons.push(`Missing or zero vectorNorm on embedding ${emb.embeddingId}`);
      }
      if (emb.schemaVersion !== EmbeddingConfig.schemaVersion) {
        reasons.push(`Schema version mismatch on embedding ${emb.embeddingId}`);
      }
    }

    return {
      isReady: reasons.length === 0,
      reasons,
    };
  }
}
