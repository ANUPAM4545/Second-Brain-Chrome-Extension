# Evaluation Demo Dataset & Guide

This file provides a standard, domain-agnostic evaluation set to verify the Hybrid RAG engine inside the Second Brain Chrome Extension.

## Setup Instructions

1. **Install the Extension**: Load the unpacked extension from `/dist`.
2. **Index Sample Documents**: To test the engine, browse to the following sample pages and allow the extension to index them (ensure Background scripts are running):
   - Example A: [Vite Getting Started](https://vitejs.dev/guide/)
   - Example B: [React Quick Start](https://react.dev/learn)
   - Example C: [Typescript Docs](https://www.typescriptlang.org/docs/)
     _(You may use any 3 technical documentations; adapt the keywords accordingly if testing your own corpus)._
3. **Configure API Key**: Go to Extension Options -> LLM Configuration and input your Gemini API Key.
4. **Run Evaluation**: Open the Extension Developer Panel or run `EvaluationRunner` in the background console.

## 30-Question Evaluation Dataset

The `EvaluationRunner` is designed to be injected with JSON. Here is the reference JSON dataset spanning 10 categories to test the system thoroughly:

```json
[
  {
    "id": "q01",
    "category": "Single Fact Lookup",
    "query": "What is the command to create a new Vite project?",
    "expectedKeywords": ["npm", "create", "vite"]
  },
  {
    "id": "q02",
    "category": "Single Fact Lookup",
    "query": "How do you declare a state variable in React?",
    "expectedKeywords": ["useState"]
  },
  {
    "id": "q03",
    "category": "Single Fact Lookup",
    "query": "What is the primary language used in this extension?",
    "expectedKeywords": ["typescript"]
  },

  {
    "id": "q04",
    "category": "Multi-document Synthesis",
    "query": "Compare React state management with Vite's HMR.",
    "expectedCitationCountMin": 2
  },
  {
    "id": "q05",
    "category": "Multi-document Synthesis",
    "query": "How do you configure a React project using Vite and Typescript?",
    "expectedCitationCountMin": 3
  },
  {
    "id": "q06",
    "category": "Multi-document Synthesis",
    "query": "What are the performance differences between Vite and create-react-app?",
    "expectedKeywords": ["esbuild"]
  },

  {
    "id": "q07",
    "category": "Definition",
    "query": "What is Hybrid Search?",
    "expectedKeywords": ["bm25", "dense"]
  },
  {
    "id": "q08",
    "category": "Definition",
    "query": "Define RAG in the context of LLMs.",
    "expectedKeywords": ["retrieval", "generation"]
  },
  {
    "id": "q09",
    "category": "Definition",
    "query": "What is an inverted index?",
    "expectedKeywords": ["tf", "idf"]
  },

  {
    "id": "q10",
    "category": "Negative Query",
    "query": "Who won the 1994 World Cup?",
    "expectedConfidenceRange": [0.0, 0.4]
  },
  {
    "id": "q11",
    "category": "Negative Query",
    "query": "What is the recipe for chocolate cake?",
    "expectedConfidenceRange": [0.0, 0.4]
  },
  {
    "id": "q12",
    "category": "Negative Query",
    "query": "How do I fix a broken car engine?",
    "expectedConfidenceRange": [0.0, 0.4]
  },

  {
    "id": "q13",
    "category": "Ambiguous Query",
    "query": "How does it work?",
    "expectedConfidenceRange": [0.0, 0.6]
  },
  {
    "id": "q14",
    "category": "Ambiguous Query",
    "query": "What is the best way?",
    "expectedConfidenceRange": [0.0, 0.6]
  },
  {
    "id": "q15",
    "category": "Ambiguous Query",
    "query": "Explain the architecture.",
    "expectedCitationCountMin": 1
  },

  {
    "id": "q16",
    "category": "Source Attribution",
    "query": "According to the React docs, what is a hook?",
    "expectedCitationCountMin": 1
  },
  {
    "id": "q17",
    "category": "Source Attribution",
    "query": "Where is the Vite configuration file located?",
    "expectedCitationCountMin": 1
  },
  {
    "id": "q18",
    "category": "Source Attribution",
    "query": "Based on the Typescript docs, what is a generic?",
    "expectedCitationCountMin": 1
  },

  {
    "id": "q19",
    "category": "Long Context",
    "query": "Provide a comprehensive overview of how to build a modern web application using React, Vite, and Typescript, including routing and state management.",
    "expectedCitationCountMin": 3
  },
  {
    "id": "q20",
    "category": "Long Context",
    "query": "Explain the entire process of how a browser extension captures a page, parses it, and stores it in IndexedDB.",
    "expectedCitationCountMin": 2
  },
  {
    "id": "q21",
    "category": "Long Context",
    "query": "Detail the differences between dense vector embeddings and sparse BM25 retrieval, and explain why reciprocal rank fusion is used.",
    "expectedCitationCountMin": 2
  },

  {
    "id": "q22",
    "category": "Time-based",
    "query": "When was Vite first released?",
    "expectedConfidenceRange": [0.0, 0.8]
  },
  {
    "id": "q23",
    "category": "Time-based",
    "query": "What is the latest version of React?",
    "expectedCitationCountMin": 1
  },
  {
    "id": "q24",
    "category": "Time-based",
    "query": "How has Typescript evolved over the years?",
    "expectedCitationCountMin": 1
  },

  {
    "id": "q25",
    "category": "Comparison",
    "query": "React vs Vue?",
    "expectedKeywords": ["react"]
  },
  {
    "id": "q26",
    "category": "Comparison",
    "query": "Vite vs Webpack?",
    "expectedKeywords": ["esbuild"]
  },
  {
    "id": "q27",
    "category": "Comparison",
    "query": "Typescript vs Javascript?",
    "expectedKeywords": ["types"]
  },

  {
    "id": "q28",
    "category": "Citation Verification",
    "query": "List 3 rules of hooks.",
    "expectedCitationCountMin": 1
  },
  {
    "id": "q29",
    "category": "Citation Verification",
    "query": "Show me a code example of a React component.",
    "expectedCitationCountMin": 1
  },
  {
    "id": "q30",
    "category": "Citation Verification",
    "query": "What are the configuration options for Vite?",
    "expectedCitationCountMin": 1
  }
]
```
