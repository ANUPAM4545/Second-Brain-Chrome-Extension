import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../storage/db';
import { useEffect, useState } from 'react';

export interface KnowledgeStats {
  documents: number;
  chunks: number;
  embeddings: number;
  storageUsed: number;
  isReady: boolean;
}

export const useKnowledgeStats = (): KnowledgeStats => {
  const [storageUsed, setStorageUsed] = useState<number>(0);

  const documentCount = useLiveQuery(() => db.documents.count()) ?? 0;
  const chunkCount = useLiveQuery(() => db.chunks.count()) ?? 0;
  const embeddingCount = useLiveQuery(() => db.embeddings.count()) ?? 0;

  useEffect(() => {
    const calculateStorage = async () => {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        setStorageUsed(estimate.usage || 0);
      }
    };
    
    calculateStorage();
    const interval = setInterval(calculateStorage, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  return {
    documents: documentCount,
    chunks: chunkCount,
    embeddings: embeddingCount,
    storageUsed,
    isReady: true,
  };
};
