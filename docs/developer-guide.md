# Developer Guide

Welcome to the Second Brain developer guide! Here is how to get started hacking on the codebase.

## Prerequisites

- Node.js (v18+)
- npm or pnpm
- Google Chrome

## Installation & Setup

1. **Clone & Install**:
   ```bash
   git clone https://github.com/your-org/second-brain-extension.git
   cd second-brain-extension
   npm install
   ```

2. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   *Note: This uses Vite's CRXJS plugin which enables Hot Module Replacement (HMR) for the popup and options pages, and automatically reloads the service worker on change.*

3. **Load the Extension into Chrome**:
   - Navigate to `chrome://extensions/`
   - Toggle **Developer mode** in the top right.
   - Click **Load unpacked** and select the `dist` folder.

## Project Structure

- `src/background/`: Service worker logic, Chrome event listeners.
- `src/content/`: Content scripts injected into web pages (DOM parsing).
- `src/popup/`: React application for the extension popup (Chat UI).
- `src/options/`: React application for the settings page.
- `src/components/ui/`: Shared UI primitives (Buttons, Cards).
- `src/ai/`: Core logic for RAG, Embeddings, Chunking, and Retrieval.
- `src/storage/`: Dexie database schemas and migrations.
- `src/utils/`: Generic utility functions (DOM, string manipulation).

## Debugging

### Debugging the Popup
Right-click anywhere inside the popup window and select **Inspect**. This opens a dedicated DevTools instance for the React app.

### Debugging the Service Worker
1. Go to `chrome://extensions/`
2. Find the Second Brain extension card.
3. Click on the **Service Worker** link next to "Inspect views".
4. This is where you will see logs for embeddings, deduplication, and database operations.

### Debugging Content Scripts
Open DevTools (`F12`) on any regular web page to see logs originating from `content.ts`.

## Building for Production

To create a minified, optimized build ready for the Chrome Web Store:
```bash
npm run build
```
The output will be entirely contained within the `dist` directory. Zip this directory for upload.

## Code Quality

We strictly enforce TypeScript safety and linting.
- Run `npm run lint` to check for unused variables and logic errors (uses `oxlint`).
- Run `npx tsc --noEmit` to verify type safety.
