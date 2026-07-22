import type { RetrievalRequest } from './RetrievalProvider';

export class QueryProcessor {
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
    'could',
    'did',
    'do',
    'does',
    'doing',
    'down',
    'during',
    'each',
    'few',
    'for',
    'from',
    'further',
    'had',
    'has',
    'have',
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
    'it',
    "it's",
    'its',
    'itself',
    "let's",
    'me',
    'more',
    'most',
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
    'she',
    "she'd",
    "she'll",
    "she's",
    'should',
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
    'we',
    "we'd",
    "we'll",
    "we're",
    "we've",
    'were',
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
    'would',
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

  static process(rawQuery: string): RetrievalRequest {
    const filters: any = {};
    let queryText = rawQuery.trim();

    // 1. Metadata filter extraction (e.g., domain:example.com or lang:en)
    const domainMatch = queryText.match(/domain:([a-zA-Z0-9.-]+)/);
    if (domainMatch) {
      filters.domain = domainMatch[1];
      queryText = queryText.replace(domainMatch[0], '');
    }

    const langMatch = queryText.match(/lang:([a-zA-Z-]+)/);
    if (langMatch) {
      filters.language = langMatch[1];
      queryText = queryText.replace(langMatch[0], '');
    }

    const docIdMatch = queryText.match(/docId:([a-zA-Z0-9.-]+)/);
    if (docIdMatch) {
      filters.documentId = docIdMatch[1];
      queryText = queryText.replace(docIdMatch[0], '');
    }

    // 2. Phrase detection ("exact phrase")
    const phrases: string[] = [];
    const phraseRegex = /"([^"]+)"/g;
    let match;
    while ((match = phraseRegex.exec(queryText)) !== null) {
      phrases.push(match[1]);
    }
    // We leave phrases in the queryText for dense embedding, but they could be used specially by BM25 later

    // 3. Normalization and stopword removal (for sparse query representation)
    const tokens = queryText.toLowerCase().match(/\b\w+\b/g) || [];
    const cleanTokens = tokens.filter((t) => !this.STOPWORDS.has(t));
    const normalizedQuery = cleanTokens.join(' ');

    // 4. Intent classification (Simple)
    const lowerQuery = queryText.toLowerCase();
    if (
      lowerQuery.startsWith('what') ||
      lowerQuery.startsWith('how') ||
      lowerQuery.startsWith('why') ||
      lowerQuery.startsWith('who')
    ) {
      filters.intent = 'QUESTION';
    } else if (lowerQuery.includes('summarize') || lowerQuery.includes('summary of')) {
      filters.intent = 'SUMMARIZATION';
    }

    return {
      query: normalizedQuery || queryText, // Fallback to raw if all stopwords
      filter: Object.keys(filters).length > 0 ? filters : undefined,
      // note: queryEmbedding will be added by the engine later
    };
  }
}
