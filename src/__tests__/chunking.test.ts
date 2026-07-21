import { describe, it, expect } from 'vitest';
import { ChunkingEngine } from '../ai/ChunkingEngine';
import type { DocumentEntity } from '../shared/types';

describe('ChunkingEngine', () => {
  it('should preserve headings and semantic blocks', async () => {
    const doc = {
      id: 'doc-1',
      markdown: `# Title
      
Paragraph one.

## Subtitle

Paragraph two with a code block:

\`\`\`javascript
const x = 1;
\`\`\`
`,
      language: 'en',
    } as DocumentEntity;

    const chunks = await ChunkingEngine.chunkDocument(doc);

    expect(chunks.length).toBeGreaterThan(0);
    // Checking hierarchy logic
    const titleChunk = chunks.find((c) => c.text.includes('Paragraph one.'));
    expect(titleChunk?.heading).toBe('Title');
    expect(titleChunk?.hierarchy).toEqual(['Title']);

    const subtitleChunk = chunks.find((c) => c.text.includes('Paragraph two'));
    expect(subtitleChunk?.heading).toBe('Subtitle');
    expect(subtitleChunk?.hierarchy).toEqual(['Title', 'Subtitle']);

    // Check code block preservation
    const codeChunk = chunks.find((c) => c.text.includes('const x = 1;'));
    expect(codeChunk?.text.startsWith('```javascript')).toBe(true);
  });
});
