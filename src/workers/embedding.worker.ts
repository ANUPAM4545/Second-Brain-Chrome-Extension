self.onmessage = async (e) => {
  const { type, payload } = e.data;
  if (type === 'EMBED_CHUNKS') {
    // Stub for embedding worker logic
    self.postMessage({ type: 'EMBEDDED', payload: { id: payload.id, status: 'success' } });
  }
};
