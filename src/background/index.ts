import type { DocumentEntity } from '../shared/types';
import { DocumentStatus } from '../shared/types';
import { DocumentRepository } from '../repositories/DocumentRepository';

// Queue to hold capture tasks
const captureQueue: DocumentEntity[] = [];
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || captureQueue.length === 0) return;
  isProcessing = true;
  
  while (captureQueue.length > 0) {
    const doc = captureQueue.shift();
    if (!doc) continue;
    
    console.log('[Background] Processing doc:', doc.url);
    try {
      // 1. Save to IndexedDB as QUEUED
      await DocumentRepository.save(doc);
      
      // 2. Send to Parser Worker (Stubbed)
      // const worker = new Worker(new URL('../workers/parser.worker.ts', import.meta.url));
      // worker.postMessage({ type: 'PARSE_DOCUMENT', payload: doc });
      
      // 3. For now, just update status
      await DocumentRepository.updateStatus(doc.id, DocumentStatus.CAPTURED);
    } catch (e) {
      console.error('[Background] Failed to process doc:', e);
    }
  }
  isProcessing = false;
};

// Listen to messages from content script
chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (message.type === 'CAPTURE_PAGE') {
    const doc: DocumentEntity = message.payload;
    captureQueue.push(doc);
    processQueue();
    sendResponse({ status: 'queued' });
  }
  return true;
});
