self.onmessage = async (e) => {
  const { type } = e.data;
  if (type === 'SEARCH') {
    // Stub for retrieval logic
    self.postMessage({ type: 'SEARCH_RESULTS', payload: [] });
  }
};
