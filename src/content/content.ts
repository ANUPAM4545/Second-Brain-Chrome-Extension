import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';



const turndownService = new TurndownService();

// Extract, parse, and send to Background SW
const captureParsedPage = () => {
  try {
    const url = window.location.href;
    // Don't index chrome extensions or internal pages
    if (!url.startsWith('http')) return;

    // Clone document because Readability mutates the DOM
    const documentClone = document.cloneNode(true) as Document;
    
    let articleTitle = document.title;
    let htmlContent = '';
    let textContent = '';
    
    try {
      const article = new Readability(documentClone).parse();
      if (article && article.content) {
        articleTitle = article.title || articleTitle;
        htmlContent = article.content;
        textContent = article.textContent || '';
      } else {
        htmlContent = document.body.innerHTML;
        textContent = document.body.textContent || '';
      }
    } catch (e) {
      console.warn('Readability failed in content script, falling back:', e);
      htmlContent = document.body.innerHTML;
      textContent = document.body.textContent || '';
    }

    // Quick validation
    if (!textContent || textContent.trim().length < 100) return;

    const markdown = turndownService.turndown(htmlContent);
    const language = document.documentElement.lang || 'en';

    chrome.runtime.sendMessage(
      {
        type: 'CAPTURE_PARSED_PAGE',
        payload: { 
          url, 
          title: articleTitle, 
          markdown,
          textContent,
          language,
          timestamp: Date.now() 
        },
      },
      (_response) => {
        if (chrome.runtime.lastError) {
          // SW might be asleep or disconnected, safely ignore
          console.warn('Capture send failed:', chrome.runtime.lastError.message);
        }
      }
    );
  } catch (error) {
    console.error('Failed to capture and parse page:', error);
  }
};

// 1. Initial Page Load Capture
// Wait for network/DOM to settle slightly
setTimeout(captureParsedPage, 2000);

// 2. SPA Navigation Detection (History API)
let lastUrl = window.location.href;

const checkUrlChange = () => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    setTimeout(captureParsedPage, 2000); // Wait for SPA render
  }
};

// Monkey-patch history methods for SPA detection
const pushState = history.pushState;
history.pushState = function (...args) {
  pushState.apply(history, args);
  checkUrlChange();
};

const replaceState = history.replaceState;
history.replaceState = function (...args) {
  replaceState.apply(history, args);
  checkUrlChange();
};

window.addEventListener('popstate', checkUrlChange);

// 3. Fallback URL change detection (MutationObserver for tricky SPAs)
const observer = new MutationObserver(() => {
  checkUrlChange();
});
observer.observe(document.body, { childList: true, subtree: true });

// 4. Manual trigger from background script
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FORCE_CAPTURE') {
    captureParsedPage();
  }
});
