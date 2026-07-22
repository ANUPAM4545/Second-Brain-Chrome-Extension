import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../storage/db';
import type { DocumentEntity } from '../../shared/types';

export interface CurrentPageInfo {
  url: string | null;
  title: string | null;
  document: DocumentEntity | null;
  isLoading: boolean;
}

export const useCurrentPage = (): CurrentPageInfo => {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentTab = async () => {
      try {
        if (chrome && chrome.tabs) {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.url && !tab.url.startsWith('chrome://')) {
            // Basic normalization to match backend
            const urlObj = new URL(tab.url);
            urlObj.hash = '';
            const normalized = urlObj.toString();
            setCurrentUrl(normalized);
            setCurrentTitle(tab.title || null);
          }
        }
      } catch (err) {
        console.error('Failed to get current tab:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCurrentTab();
  }, []);

  const document = useLiveQuery(
    () => {
      if (!currentUrl) return undefined;
      // We look up by normalizedUrl
      return db.documents.where('normalizedUrl').equals(currentUrl).first();
    },
    [currentUrl],
    undefined
  );

  return {
    url: currentUrl,
    title: currentTitle,
    // document is undefined while loading, null if not found
    document: document === undefined ? null : document,
    isLoading: isLoading || document === undefined,
  };
};
