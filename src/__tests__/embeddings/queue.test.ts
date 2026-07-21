import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmbeddingQueue } from '../../ai/embeddings/EmbeddingQueue';
import { ChunkRepository } from '../../repositories/ChunkRepository';
import { EmbeddingRepository } from '../../repositories/EmbeddingRepository';
import { DocumentRepository } from '../../repositories/DocumentRepository';
import { DocumentStatus } from '../../shared/types';

// Mock dependencies
vi.mock('../../repositories/ChunkRepository');
vi.mock('../../repositories/EmbeddingRepository');
vi.mock('../../repositories/DocumentRepository');

// Mock Web Worker
class MockWorker {
  onmessage: any;
  postMessage(data: any) {
    if (data.type === 'BATCH_EMBED') {
      setTimeout(() => {
        this.onmessage({
          data: {
            type: 'BATCH_SUCCESS',
            payload: {
              jobId: data.payload.jobId,
              vectors: data.payload.chunks.map(() => [0.1, 0.2]),
              vectorNorms: data.payload.chunks.map(() => 0.223606),
              model: 'TestModel',
              provider: 'TestProvider',
              dimensions: 2,
              processingTime: 100,
            },
          },
        });
      }, 10);
    }
  }
}
vi.stubGlobal('Worker', MockWorker);

describe('EmbeddingQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process pending chunks and mark document INDEXED', async () => {
    // Setup mocks
    const chunks = [
      { id: 'chunk1', status: 'PENDING', contentHash: 'hash1' },
      { id: 'chunk2', status: 'PENDING', contentHash: 'hash2' },
    ];

    vi.mocked(ChunkRepository.findByDocument).mockResolvedValue(chunks as any);
    vi.mocked(EmbeddingRepository.checkCache).mockResolvedValue(undefined);
    vi.mocked(DocumentRepository.getById).mockResolvedValue({
      id: 'doc1',
      status: DocumentStatus.WAITING_FOR_EMBEDDING,
    } as any);

    const queue = new EmbeddingQueue();
    await queue.processDocument('doc1');

    expect(EmbeddingRepository.bulkInsert).toHaveBeenCalled();
    expect(ChunkRepository.saveAll).toHaveBeenCalled();
    expect(DocumentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: DocumentStatus.INDEXED })
    );
  });

  it('should use cached embeddings when available', async () => {
    const chunks = [{ id: 'chunk1', status: 'PENDING', contentHash: 'hash1' }];

    vi.mocked(ChunkRepository.findByDocument).mockResolvedValue(chunks as any);
    vi.mocked(EmbeddingRepository.checkCache).mockResolvedValue({
      embeddingId: 'cached1',
      vector: [0.1, 0.2],
    } as any);
    vi.mocked(DocumentRepository.getById).mockResolvedValue({
      id: 'doc1',
      status: DocumentStatus.WAITING_FOR_EMBEDDING,
    } as any);

    const queue = new EmbeddingQueue();
    await queue.processDocument('doc1');

    // Should insert from cache directly without worker doing work
    expect(EmbeddingRepository.bulkInsert).toHaveBeenCalled();
    const saveCall = vi.mocked(EmbeddingRepository.bulkInsert).mock.calls[0][0];
    expect(saveCall[0].embeddingId).not.toBe('cached1'); // Assigned a new ID
    expect(saveCall[0].vector).toEqual([0.1, 0.2]);
  });
});
