self.onmessage = async (e) => {
  const { type, payload } = e.data;
  if (type === 'PARSE_DOCUMENT') {
    // Stub for parser worker logic
    self.postMessage({ type: 'PARSED', payload: { ...payload, markdown: 'stub' } });
  }
};
