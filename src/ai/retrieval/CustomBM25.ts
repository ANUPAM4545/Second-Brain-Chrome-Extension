import { db } from '../../storage/db';

export interface BM25Config {
  k1: number;
  b: number;
}

export class CustomBM25 {
  private config: BM25Config;
  private invertedIndex: Map<string, Map<string, number>> = new Map(); // term -> chunkId -> TF
  private documentLengths: Map<string, number> = new Map(); // chunkId -> length
  private averageDocumentLength = 0;
  private totalDocuments = 0;
  private isLoaded = false;

  private static readonly STOPWORDS = new Set([
    'a',
    'about',
    'above',
    'after',
    'again',
    'against',
    'all',
    'am',
    'an',
    'and',
    'any',
    'are',
    "aren't",
    'as',
    'at',
    'be',
    'because',
    'been',
    'before',
    'being',
    'below',
    'between',
    'both',
    'but',
    'by',
    "can't",
    'cannot',
    'could',
    "couldn't",
    'did',
    "didn't",
    'do',
    'does',
    "doesn't",
    'doing',
    "don't",
    'down',
    'during',
    'each',
    'few',
    'for',
    'from',
    'further',
    'had',
    "hadn't",
    'has',
    "hasn't",
    'have',
    "haven't",
    'having',
    'he',
    "he'd",
    "he'll",
    "he's",
    'her',
    'here',
    "here's",
    'hers',
    'herself',
    'him',
    'himself',
    'his',
    'how',
    "how's",
    'i',
    "i'd",
    "i'll",
    "i'm",
    "i've",
    'if',
    'in',
    'into',
    'is',
    "isn't",
    'it',
    "it's",
    'its',
    'itself',
    "let's",
    'me',
    'more',
    'most',
    "mustn't",
    'my',
    'myself',
    'no',
    'nor',
    'not',
    'of',
    'off',
    'on',
    'once',
    'only',
    'or',
    'other',
    'ought',
    'our',
    'ours',
    'ourselves',
    'out',
    'over',
    'own',
    'same',
    "shan't",
    'she',
    "she'd",
    "she'll",
    "she's",
    'should',
    "shouldn't",
    'so',
    'some',
    'such',
    'than',
    'that',
    "that's",
    'the',
    'their',
    'theirs',
    'them',
    'themselves',
    'then',
    'there',
    "there's",
    'these',
    'they',
    "they'd",
    "they'll",
    "they're",
    "they've",
    'this',
    'those',
    'through',
    'to',
    'too',
    'under',
    'until',
    'up',
    'very',
    'was',
    "wasn't",
    'we',
    "we'd",
    "we'll",
    "we're",
    "we've",
    'were',
    "weren't",
    'what',
    "what's",
    'when',
    "when's",
    'where',
    "where's",
    'which',
    'while',
    'who',
    "who's",
    'whom',
    'why',
    "why's",
    'with',
    "won't",
    'would',
    "wouldn't",
    'you',
    "you'd",
    "you'll",
    "you're",
    "you've",
    'your',
    'yours',
    'yourself',
    'yourselves',
  ]);

  constructor(config: BM25Config = { k1: 1.2, b: 0.75 }) {
    this.config = config;
  }

  tokenize(text: string): string[] {
    const tokens: string[] = text.toLowerCase().match(/\b\w+\b/g) || [];
    return tokens.filter((t) => !CustomBM25.STOPWORDS.has(t) && t.length > 1);
  }

  async buildIndex(): Promise<void> {
    if (this.isLoaded) return;



    const chunks = await db.chunks.toArray(); // In production, iterate via cursor for huge DBs
    this.totalDocuments = chunks.length;
    let totalLength = 0;

    for (const chunk of chunks) {
      const tokens = this.tokenize(chunk.text);
      this.documentLengths.set(chunk.id, tokens.length);
      totalLength += tokens.length;

      const termCounts = new Map<string, number>();
      for (const token of tokens) {
        termCounts.set(token, (termCounts.get(token) || 0) + 1);
      }

      for (const [term, count] of termCounts.entries()) {
        if (!this.invertedIndex.has(term)) {
          this.invertedIndex.set(term, new Map());
        }
        this.invertedIndex.get(term)!.set(chunk.id, count);
      }
    }

    this.averageDocumentLength = this.totalDocuments > 0 ? totalLength / this.totalDocuments : 0;
    this.isLoaded = true;

  }

  /**
   * Calculates the IDF for a given term.
   */
  private idf(term: string): number {
    const df = this.invertedIndex.get(term)?.size || 0;
    if (df === 0) return 0;
    // Standard BM25 IDF formula
    return Math.log(1 + (this.totalDocuments - df + 0.5) / (df + 0.5));
  }

  search(query: string): Map<string, number> {
    if (!this.isLoaded) {
      throw new Error('BM25 Index not loaded.');
    }

    const queryTokens = this.tokenize(query);
    const scores = new Map<string, number>();

    for (const token of queryTokens) {
      const idfScore = this.idf(token);
      if (idfScore === 0) continue;

      const postingList = this.invertedIndex.get(token);
      if (!postingList) continue;

      for (const [chunkId, tf] of postingList.entries()) {
        const docLength = this.documentLengths.get(chunkId) || 0;

        // BM25 scoring formula
        const num = tf * (this.config.k1 + 1);
        const den =
          tf +
          this.config.k1 *
            (1 - this.config.b + this.config.b * (docLength / this.averageDocumentLength));

        const tokenScore = idfScore * (num / den);
        scores.set(chunkId, (scores.get(chunkId) || 0) + tokenScore);
      }
    }

    return scores;
  }

  getIndexSize(): number {
    return this.invertedIndex.size;
  }
}
