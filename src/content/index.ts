import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import type { DocumentEntity } from '../shared/types';
import { DocumentStatus } from '../shared/types';

const turndownService = new TurndownService();

const extractContent = () => {
  try {
    // Clone document so readability doesn't mutate actual DOM
    const documentClone = document.cloneNode(true) as Document;
    const article = new Readability(documentClone).parse();
    
    if (!article || !article.content || !article.textContent) return null;

    const markdown = turndownService.turndown(article.content);
    
    // Hash could be generated in worker, stub for now
    const contentHash = btoa(markdown.substring(0, 100));

    const doc: DocumentEntity = {
      id: crypto.randomUUID(),
      url: window.location.href,
      normalizedUrl: window.location.origin + window.location.pathname,
      title: article.title || '',
      domain: window.location.hostname,
      language: document.documentElement.lang || 'en',
      readingTime: Math.ceil(article.textContent.split(/\s+/).length / 200),
      wordCount: article.textContent.split(/\s+/).length,
      characterCount: article.textContent.length,
      captureTime: Date.now(),
      lastVisitTime: Date.now(),
      visitCount: 1,
      contentHash,
      parserVersion: '1.0',
      embeddingVersion: '1.0',
      chunkCount: 0,
      status: DocumentStatus.QUEUED,
      rawHtml: article.content || '',
      markdown: markdown
    };

    return doc;
  } catch (e) {
    console.error('[Content] Extraction failed:', e);
    return null;
  }
};

const sendToBackground = () => {
  const doc = extractContent();
  if (doc) {
    chrome.runtime.sendMessage({ type: 'CAPTURE_PAGE', payload: doc }, (response: any) => {
      console.log('[Content] Page captured:', response);
    });
  }
};

// SPA detection
let lastUrl = location.href; 
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Debounce or delay slightly to let React/Vue render
    setTimeout(sendToBackground, 1500);
  }
}).observe(document, {subtree: true, childList: true});

// Initial capture
setTimeout(sendToBackground, 1500);
