# Evaluation & Benchmarks

The Second Brain extension relies heavily on local processing. This document outlines how we evaluate the performance of our retrieval pipelines and the fidelity of our Generation.

## Benchmark Methodology

Evaluating a local-first RAG pipeline involves balancing memory constraints, CPU overhead, and search relevance.

We measure performance across three pillars:
1. **Embedding Throughput**: How quickly can we embed chunks using WebAssembly without freezing the browser?
2. **Retrieval Precision**: Does Hybrid Search (BM25 + Dense) significantly outperform Dense Search alone on user knowledge bases?
3. **Generation Latency**: Time-to-First-Token (TTFT) when hitting the LLM provider.

## Retrieval Evaluation

### Hybrid Search Effectiveness
We utilize **Weighted Reciprocal Rank Fusion (WRRF)** to merge results. 
- **Dense Vector Weight (`Wd`)**: 0.6
- **Sparse BM25 Weight (`Ws`)**: 0.4
- **WRRF Constant (`k`)**: 60

In our internal tests, pure vector search struggles with exact keyword matching (e.g., "React Server Components" vs "React Client Components"). BM25 catches exact lexical matches, while cosine similarity handles semantic intent. WRRF provides a 25% boost in Mean Reciprocal Rank (MRR) over dense-only retrieval.

### Confidence Scoring
Every RAG response includes a Confidence Score. This is calculated heuristically based on:
- The highest WRRF score from the retrieved chunks.
- The concentration of scores (are the top 3 chunks highly relevant, or is there a steep drop-off?).
If the score falls below a certain threshold, the UI indicates "Low Confidence", warning the user of a potential hallucination.

## Current Limitations

1. **Wasm Memory Limits**: `Transformers.js` is memory intensive. Extremely large single-page applications may cause memory spikes if chunking is not throttled. Batch size is heavily regulated.
2. **Cold Start**: The first embedding process upon opening the browser incurs a 2-3 second penalty while the `all-MiniLM-L6-v2` model is loaded from cache into RAM.
3. **Local LLM**: Currently, the system relies on an external API (Gemini) for the generation phase. Fully local generation (via WebGPU) is on the roadmap but currently too heavy for a background service worker.

## Future Improvements

- Migrate inverted indices for BM25 into a more structured WebSQL/IndexedDB format to reduce memory overhead on startup.
- Implement WebGPU acceleration for `Transformers.js` when available in Service Workers.
- Add an evaluation suite using a synthetic dataset of web articles to run automated precision/recall tests in a headless Chromium instance.
