import type { DocumentEntity, ChunkEntity } from '../shared/types';
import { CryptoUtils } from '../utils/crypto';

export class ChunkingEngine {
  /**
   * Generates chunks from a parsed DocumentEntity.
   * Uses recursive chunking strategies and maintains hierarchy.
   */
  static async chunkDocument(doc: DocumentEntity): Promise<ChunkEntity[]> {
    if (!doc.markdown) return [];

    const chunks: ChunkEntity[] = [];
    const blocks = this.splitIntoSemanticBlocks(doc.markdown);

    let readingOrder = 0;
    let currentHierarchy: string[] = [];
    let currentHeading = '';
    let globalOffset = 0;

    for (const block of blocks) {
      // Update hierarchy if this is a heading block
      const headingMatch = block.match(/^(#{1,6})\s+(.*)$/m);
      if (headingMatch) {
        const level = headingMatch[1].length;
        currentHeading = headingMatch[2].trim();

        // Adjust hierarchy stack based on heading level
        currentHierarchy = currentHierarchy.slice(0, level - 1);
        currentHierarchy.push(currentHeading);
      }

      // We only chunk large paragraphs, leaving code blocks, tables, and lists intact.
      // For Milestone 3, we just take the semantic blocks as our primary chunks.
      // A more robust recursive chunker would split massive blocks further.
      const subBlocks = this.recursiveSplit(block);

      for (const subBlock of subBlocks) {
        const subBlockWordCount = subBlock.trim().split(/\s+/).length;
        if (subBlockWordCount === 0) continue;

        const tokenCountEstimate = Math.ceil(subBlockWordCount * 1.3);
        const chunkHash = await CryptoUtils.generateSHA256Hash(subBlock);

        chunks.push({
          schemaVersion: 1,
          id: crypto.randomUUID(),
          documentId: doc.id,
          parentDocumentId: doc.parentDocumentId || doc.id,
          chunkIndex: readingOrder,
          heading: currentHeading,
          hierarchy: [...currentHierarchy],
          startOffset: globalOffset,
          endOffset: globalOffset + subBlock.length,
          wordCount: subBlockWordCount,
          tokenCount: tokenCountEstimate,
          readingOrder,
          text: subBlock,
          contentHash: chunkHash,
          language: doc.language,
          timestamp: Date.now(),
          status: 'PENDING',
        });

        readingOrder++;
        globalOffset += subBlock.length + 2; // +2 for '\n\n' or similar boundary
      }
    }

    return chunks;
  }

  /**
   * Splits markdown by double newlines but preserves semantic blocks
   * like code blocks (```...```), tables, and lists.
   */
  private static splitIntoSemanticBlocks(markdown: string): string[] {
    // This is a naive but functional semantic splitter.
    // It finds code blocks and treats them as single units, then splits the rest by \n\n.
    const blocks: string[] = [];
    const codeBlockRegex = /```[\s\S]*?```/g;

    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      // Process text before the code block
      if (match.index > lastIndex) {
        const textBefore = markdown.substring(lastIndex, match.index);
        blocks.push(...textBefore.split(/\n\s*\n/).filter((b) => b.trim().length > 0));
      }

      // Push the code block itself
      blocks.push(match[0]);
      lastIndex = codeBlockRegex.lastIndex;
    }

    // Process remaining text
    if (lastIndex < markdown.length) {
      const remaining = markdown.substring(lastIndex);
      blocks.push(...remaining.split(/\n\s*\n/).filter((b) => b.trim().length > 0));
    }

    return blocks;
  }

  /**
   * Recursively splits a large block into smaller pieces if it exceeds reasonable bounds.
   * (E.g., split by single newline, then by sentences).
   * For M3, we keep it simple: just return the block unless it's enormously large.
   */
  private static recursiveSplit(block: string, maxWords = 500): string[] {
    const wordCount = block.trim().split(/\s+/).length;
    if (wordCount <= maxWords || block.startsWith('```')) {
      return [block]; // Return as-is if it's small enough or it's a code block
    }

    // Attempt to split by single newline
    const lines = block.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length > 1) {
      return lines;
    }

    // Attempt to split by sentence boundaries
    const sentences = block.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 1) {
      // Group sentences to form reasonable sub-blocks
      const subBlocks: string[] = [];
      let currentSubBlock = '';

      for (const sentence of sentences) {
        if (
          (currentSubBlock + sentence).split(/\s+/).length > maxWords &&
          currentSubBlock.length > 0
        ) {
          subBlocks.push(currentSubBlock.trim());
          currentSubBlock = sentence;
        } else {
          currentSubBlock += sentence;
        }
      }

      if (currentSubBlock.trim().length > 0) {
        subBlocks.push(currentSubBlock.trim());
      }

      return subBlocks;
    }

    // Last resort, return as is
    return [block];
  }
}
