import type { DocumentEntity } from '../shared/types';
import { DocumentStatus } from '../shared/types';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { ChunkRepository } from '../repositories/ChunkRepository';
import { URLNormalizer } from '../utils/url';
import { CryptoUtils } from '../utils/crypto';
import { DeduplicationEngine } from '../ai/DeduplicationEngine';
import { JaccardSimilarityStrategy } from '../ai/similarity';
import { ChunkingEngine } from '../ai/ChunkingEngine';
import { EmbeddingQueue } from '../ai/embeddings/EmbeddingQueue';

console.log('Background Service Worker initialized');

interface RawCapturePayload {
  url: string;
  title: string;
  rawHtml: string;
  timestamp: number;
}

const captureQueue: RawCapturePayload[] = [];
let isProcessing = false;

// Initialize engines
const similarityStrategy = new JaccardSimilarityStrategy(0.9, 3);
const dedupEngine = new DeduplicationEngine(similarityStrategy);
const embeddingQueue = new EmbeddingQueue();

const parserWorker = new Worker(new URL('../workers/parser.worker.ts', import.meta.url), {
  type: 'module',
});

parserWorker.onmessage = async (e) => {
  const { type, payload, error } = e.data;

  if (type === 'PARSE_SUCCESS') {
    let doc: DocumentEntity = payload;
    try {
      console.log(`[Pipeline] PARSED ${doc.url}`);

      // 1. URL Normalization
      const urls = URLNormalizer.normalize(doc.url);
      doc.normalizedUrl = urls.normalizedUrl;
      doc.canonicalUrl = urls.canonicalUrl;

      // 2. SHA-256 Hashing
      if (doc.markdown) {
        doc.contentHash = await CryptoUtils.generateSHA256Hash(doc.markdown);
        doc.hashAlgorithm = 'SHA-256';
        doc.hashVersion = '1.0';
        doc.hashTimestamp = Date.now();
      }

      // 3. Transition to WaitingForDedup
      doc.status = DocumentStatus.WAITING_FOR_DEDUP;
      await DocumentRepository.save(doc);
      console.log(`[Pipeline] WAITING_FOR_DEDUP ${doc.canonicalUrl}`);

      // 4. Deduplication Engine
      doc = await dedupEngine.process(doc); // Status becomes DEDUPLICATED
      console.log(`[Pipeline] DEDUPLICATED ${doc.canonicalUrl} (v${doc.versionNumber})`);

      // 5. Chunking Engine
      const chunks = await ChunkingEngine.chunkDocument(doc);
      doc.chunkCount = chunks.length;
      doc.status = DocumentStatus.CHUNKED;
      await DocumentRepository.save(doc);

      // 6. Chunk Repository Save
      if (chunks.length > 0) {
        await ChunkRepository.saveAll(chunks);
      }
      console.log(`[Pipeline] CHUNKED ${doc.canonicalUrl} (${chunks.length} chunks)`);

      // 7. Transition to WaitingForEmbedding
      doc.status = DocumentStatus.WAITING_FOR_EMBEDDING;
      await DocumentRepository.save(doc);
      console.log(`[Pipeline] WAITING_FOR_EMBEDDING ${doc.canonicalUrl}`);

      // 8. Trigger Embedding Queue (which will transition to INDEXED when done)
      await embeddingQueue.processDocument(doc.id);
    } catch (err) {
      console.error('[Pipeline] Failed during downstream processing:', err);
    }
  } else if (type === 'PARSE_FAILED') {
    console.error('[Pipeline] Parser Worker failed:', error);
    if (payload?.id) {
      await DocumentRepository.updateStatus(payload.id, DocumentStatus.FAILED_PARSING);
    }
  }

  isProcessing = false;
  processQueue();
};

const processQueue = async () => {
  if (isProcessing || captureQueue.length === 0) return;
  isProcessing = true;

  const rawData = captureQueue.shift();
  if (!rawData) {
    isProcessing = false;
    return;
  }

  console.log('[Pipeline] Starting capture for:', rawData.url);
  try {
    const docId = crypto.randomUUID();

    // Initial Document Creation (schemaVersion: 1)
    const initialDoc: DocumentEntity = {
      schemaVersion: 1,
      id: docId,
      url: rawData.url,
      normalizedUrl: rawData.url, // Temporary until normalized
      title: rawData.title,
      domain: new URL(rawData.url).hostname,
      language: 'en',
      readingTime: 0,
      wordCount: 0,
      characterCount: 0,
      captureTime: rawData.timestamp,
      lastVisitTime: rawData.timestamp,
      visitCount: 1,
      contentHash: '', // Temporary
      versionNumber: 1,
      createdDate: Date.now(),
      modifiedDate: Date.now(),
      parserVersion: '1.0',
      embeddingVersion: '1.0',
      chunkCount: 0,
      status: DocumentStatus.QUEUED,
      rawHtml: rawData.rawHtml,
    };

    await DocumentRepository.save(initialDoc);

    initialDoc.status = DocumentStatus.CLEANING;
    await DocumentRepository.save(initialDoc);

    parserWorker.postMessage({ type: 'PARSE_DOCUMENT', payload: initialDoc });
  } catch (e) {
    console.error('[Pipeline] Failed to process queue item:', e);
    isProcessing = false;
    processQueue();
  }
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CAPTURE_RAW_PAGE') {
    captureQueue.push(message.payload);
    processQueue();
    sendResponse({ status: 'queued' });
  }
  return true;
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    console.log('[Background] Tab updated:', tab.url);
  }
});

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0 && details.url.startsWith('http')) {
    console.log('[Background] WebNavigation completed:', details.url);
  }
});
