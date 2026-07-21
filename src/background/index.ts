// Background Service Worker Skeleton
console.log('Background Service Worker initialized');

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Received message:', message);
  sendResponse({ status: 'received' });
  return true;
});
