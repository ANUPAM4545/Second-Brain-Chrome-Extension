console.log('Content Script initialized');

// Extract raw HTML and send to Background SW
const captureRawPage = () => {
  try {
    const rawHtml = document.documentElement.outerHTML;
    const url = window.location.href;
    const title = document.title;

    // Quick validation
    if (!rawHtml || rawHtml.length < 100) return;

    chrome.runtime.sendMessage(
      {
        type: 'CAPTURE_RAW_PAGE',
        payload: { url, title, rawHtml, timestamp: Date.now() },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          // SW might be asleep or disconnected, safely ignore
          console.warn('Capture send failed:', chrome.runtime.lastError.message);
        } else {
          console.log('Page captured and queued:', response);
        }
      }
    );
  } catch (error) {
    console.error('Failed to capture raw page:', error);
  }
};

// 1. Initial Page Load Capture
// Wait for network/DOM to settle slightly
setTimeout(captureRawPage, 2000);

// 2. SPA Navigation Detection (History API)
let lastUrl = window.location.href;

const checkUrlChange = () => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    setTimeout(captureRawPage, 2000); // Wait for SPA render
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
