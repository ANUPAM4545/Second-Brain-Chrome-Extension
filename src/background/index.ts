import type { DocumentEntity } from '../shared/types';
import { DocumentStatus } from '../shared/types';
import { DocumentRepository } from '../repositories/DocumentRepository';

console.log('Background Service Worker initialized');

// Queue to hold capture tasks
interface RawCapturePayload {
  url: string;
  title: string;
  rawHtml: string;
  timestamp: number;
}

const captureQueue: RawCapturePayload[] = [];
let isProcessing = false;

// Initialize the parser worker
const parserWorker = new Worker(new URL('../workers/parser.worker.ts', import.meta.url), {
  type: 'module',
});

parserWorker.onmessage = async (e) => {
  const { type, payload, error } = e.data;

  if (type === 'PARSE_SUCCESS') {
    const doc: DocumentEntity = payload;
    try {
      await DocumentRepository.updateStatus(doc.id, DocumentStatus.READY);
      console.log('[Background] Document parsed and saved:', doc.url);
    } catch (err) {
      console.error('[Background] Failed to save parsed doc:', err);
    }
  } else if (type === 'PARSE_FAILED') {
    console.error('[Background] Parser Worker failed:', error);
    if (payload?.id) {
      await DocumentRepository.updateStatus(payload.id, DocumentStatus.FAILED_PARSING);
    }
  }

  // Continue processing queue
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

  console.log('[Background] Processing raw capture for:', rawData.url);
  try {
    const docId = crypto.randomUUID();

    // Initial Document Creation
    const initialDoc: DocumentEntity = {
      id: docId,
      url: rawData.url,
      normalizedUrl: new URL(rawData.url).origin + new URL(rawData.url).pathname,
      title: rawData.title,
      domain: new URL(rawData.url).hostname,
      language: 'en', // Will be updated by parser
      readingTime: 0,
      wordCount: 0,
      characterCount: 0,
      captureTime: rawData.timestamp,
      lastVisitTime: rawData.timestamp,
      visitCount: 1,
      contentHash: '',
      parserVersion: '1.0',
      embeddingVersion: '1.0',
      chunkCount: 0,
      status: DocumentStatus.QUEUED,
      rawHtml: rawData.rawHtml,
    };

    // Save initial state
    await DocumentRepository.save(initialDoc);

    // Update state to CLEANING and send to worker
    await DocumentRepository.updateStatus(docId, DocumentStatus.CLEANING);
    parserWorker.postMessage({ type: 'PARSE_DOCUMENT', payload: initialDoc });
  } catch (e) {
    console.error('[Background] Failed to process queue item:', e);
    isProcessing = false;
    processQueue(); // Attempt next
  }
};

// Listen to messages from content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CAPTURE_RAW_PAGE') {
    captureQueue.push(message.payload);
    processQueue();
    sendResponse({ status: 'queued' });
  }
  return true;
});

// Tab update detection
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    console.log('[Background] Tab updated (navigation detected):', tab.url);
    // The content script will automatically handle extraction,
    // this listener serves as a supplementary tracker for architecture compliance.
  }
});

// WebNavigation detection
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0 && details.url.startsWith('http')) {
    // Main frame only
    console.log('[Background] WebNavigation completed:', details.url);
    // The content script handles extraction, but we track the navigation lifecycle here.
  }
});
