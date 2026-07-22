import './polyfill';
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



interface ParsedCapturePayload {
  url: string;
  title: string;
  markdown: string;
  textContent: string;
  language: string;
  timestamp: number;
}

const captureQueue: ParsedCapturePayload[] = [];
let isProcessing = false;

// Initialize engines
const similarityStrategy = new JaccardSimilarityStrategy(0.9, 3);
const dedupEngine = new DeduplicationEngine(similarityStrategy);
const embeddingQueue = new EmbeddingQueue();

const processDocumentParsing = async (doc: DocumentEntity, textContent: string) => {
  try {
    const wordCount = textContent.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    const characterCount = textContent.length;
    
    let updatedDoc: DocumentEntity = {
      ...doc,
      wordCount,
      readingTime,
      characterCount,
      status: DocumentStatus.PARSED,
    };
    await DocumentRepository.save(updatedDoc);


    const urls = URLNormalizer.normalize(updatedDoc.url);
    updatedDoc.normalizedUrl = urls.normalizedUrl;
    updatedDoc.canonicalUrl = urls.canonicalUrl;
    
    if (updatedDoc.markdown) {
      updatedDoc.contentHash = await CryptoUtils.generateSHA256Hash(updatedDoc.markdown);
      updatedDoc.hashAlgorithm = 'SHA-256';
      updatedDoc.hashVersion = '1.0';
      updatedDoc.hashTimestamp = Date.now();
    }
    updatedDoc.status = DocumentStatus.WAITING_FOR_DEDUP;
    await DocumentRepository.save(updatedDoc);

    
    updatedDoc = await dedupEngine.process(updatedDoc);

    
    const chunks = await ChunkingEngine.chunkDocument(updatedDoc);
    updatedDoc.chunkCount = chunks.length;
    updatedDoc.status = DocumentStatus.CHUNKED;
    await DocumentRepository.save(updatedDoc);
    
    if (chunks.length > 0) {
      await ChunkRepository.saveAll(chunks);
    }

    
    updatedDoc.status = DocumentStatus.WAITING_FOR_EMBEDDING;
    await DocumentRepository.save(updatedDoc);

    
    await embeddingQueue.processDocument(updatedDoc.id);
  } catch (err: any) {
    console.error('[Pipeline] Failed during downstream processing:', err);
    await DocumentRepository.updateStatus(doc.id, DocumentStatus.FAILED_PARSING);
  }
  
  isProcessing = false;
  processQueue();
};

const processQueue = async () => {
  if (isProcessing || captureQueue.length === 0) return;
  isProcessing = true;

  const parsedData = captureQueue.shift();
  if (!parsedData) {
    isProcessing = false;
    return;
  }


  try {
    const docId = crypto.randomUUID();

    // Initial Document Creation (schemaVersion: 1)
    const initialDoc: DocumentEntity = {
      schemaVersion: 1,
      id: docId,
      url: parsedData.url,
      normalizedUrl: parsedData.url, // Temporary until normalized
      title: parsedData.title,
      domain: new URL(parsedData.url).hostname,
      language: parsedData.language,
      readingTime: 0,
      wordCount: 0,
      characterCount: 0,
      captureTime: parsedData.timestamp,
      lastVisitTime: parsedData.timestamp,
      visitCount: 1,
      contentHash: '', // Temporary
      versionNumber: 1,
      createdDate: Date.now(),
      modifiedDate: Date.now(),
      parserVersion: '1.0',
      embeddingVersion: '1.0',
      chunkCount: 0,
      status: DocumentStatus.QUEUED,
      markdown: parsedData.markdown,
    };

    await DocumentRepository.save(initialDoc);

    initialDoc.status = DocumentStatus.CLEANING;
    await DocumentRepository.save(initialDoc);

    await processDocumentParsing(initialDoc, parsedData.textContent);
  } catch (e) {
    console.error('[Pipeline] Failed to process queue item:', e);
    isProcessing = false;
    processQueue();
  }
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CAPTURE_PARSED_PAGE') {
    captureQueue.push(message.payload);
    processQueue();
    sendResponse({ status: 'queued' });
  } else if (message.type === 'INDEX_CURRENT_PAGE') {
    // If popup requests it, we can't capture directly from background.
    // In a real extension, we would use chrome.tabs.sendMessage to tell the content script to run captureParsedPage() immediately.
    // For now, content script captures on load automatically.
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.id) {
        // Just inject the content script again or ping it
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => {
             // We emit a custom event that content.ts could listen to, 
             // but since content.ts has `captureParsedPage` scoped, 
             // we can just reload the script or wait. 
             window.postMessage({ type: 'FORCE_CAPTURE' }, '*');
          }
        }).catch(err => console.warn('Could not execute script for INDEX_CURRENT_PAGE:', err));
      }
    });
    sendResponse({ status: 'requested' });
  }
  return true;
});




