# Second Brain Chrome Extension

Milestone 1 Completed: Project Foundation & Scaffolding.

## Features implemented

- Vite React CRX setup with Manifest V3
- Storage & Repositories scaffolding (Dexie DB)
- Dedicated Worker skeletons (Parser, Embedding, Retrieval)
- Background Service Worker skeleton
- Content script skeleton
- Dependency Injection foundation
- Code quality tooling: ESLint, Prettier, Husky, Commitlint

## Development

```bash
npm install
npm run dev
```

## Privacy Model

Second Brain is built with a **local-first, privacy-by-default architecture**:

- **No Data Leaves Your Device**: All page capture, DOM parsing, chunking, and embedding generation occur entirely within the browser extension.
- **Local AI Inference**: We use `Transformers.js` to run the `Xenova/all-MiniLM-L6-v2` embedding model locally. The model weights (~22MB) are downloaded directly from Hugging Face **once** and cached locally in your browser.
- **Local Storage**: All vectors and metadata are stored in IndexedDB (Dexie). No external databases or APIs are called.

Your second brain is completely private.
