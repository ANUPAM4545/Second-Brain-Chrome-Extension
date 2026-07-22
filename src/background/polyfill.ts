// Polyfill for onnxruntime-web in Chrome Extension Service Workers
if (typeof document === 'undefined') {
  (globalThis as any).document = {
    createElement: () => ({}),
    baseURI: '',
    currentScript: null,
  };
}
