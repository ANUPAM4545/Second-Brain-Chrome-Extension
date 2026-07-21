import { DOMParser } from 'linkedom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import type { DocumentEntity } from '../shared/types';
import { DocumentRepository } from '../repositories/DocumentRepository';

const turndownService = new TurndownService();

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'PARSE_DOCUMENT') {
    const doc: DocumentEntity = payload;

    try {
      if (!doc.rawHtml) {
        throw new Error('No raw HTML provided for parsing');
      }

      // Parse HTML string in worker using linkedom
      const document = new DOMParser().parseFromString(doc.rawHtml, 'text/html');

      // Determine language
      const lang = document.documentElement?.getAttribute('lang') || 'en';

      // Run Readability
      const article = new Readability(document as any).parse();

      if (!article || !article.content || !article.textContent) {
        throw new Error('Readability failed to extract article content');
      }

      // Convert to Markdown
      const markdown = turndownService.turndown(article.content);

      // Metadata extraction
      const wordCount = article.textContent.trim().split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);
      const characterCount = article.textContent.length;

      // Simple hash (can be replaced with robust simhash later)
      const contentHash = btoa(encodeURIComponent(markdown.substring(0, 200))).substring(0, 32);

      // Update Document Entity
      const updatedDoc: DocumentEntity = {
        ...doc,
        title: article.title || doc.title,
        language: lang,
        wordCount,
        readingTime,
        characterCount,
        contentHash,
        markdown,
      };

      // Save to Repository
      await DocumentRepository.save(updatedDoc);

      self.postMessage({ type: 'PARSE_SUCCESS', payload: updatedDoc });
    } catch (error: any) {
      console.error('[Parser Worker] Error:', error);
      self.postMessage({ type: 'PARSE_FAILED', payload: doc, error: error.message });
    }
  }
};
