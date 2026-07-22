import React, { useState } from 'react';
import type { RetrievalResult } from '../../ai/retrieval/RetrievalProvider';

interface CitationsAccordionProps {
  citations: Map<number, RetrievalResult>;
}

export const CitationsAccordion: React.FC<CitationsAccordionProps> = ({ citations }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCitation, setExpandedCitation] = useState<number | null>(null);

  if (!citations || citations.size === 0) return null;

  return (
    <div className="mt-4 border border-border rounded-xl overflow-hidden bg-background">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-4 py-3 bg-surface hover:bg-surface-hover transition-colors text-sm font-medium text-gray-800 focus:outline-none"
      >
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Sources ({citations.size})
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-3 bg-background divide-y divide-border max-h-64 overflow-y-auto space-y-2">
          {Array.from(citations.entries()).map(([index, cite]) => {
            const urlObj = cite.metadata?.url ? new URL(cite.metadata.url as string) : null;
            const domain = urlObj ? urlObj.hostname : 'Unknown Domain';
            const faviconUrl = urlObj ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : '';
            const isExpanded = expandedCitation === index;

            return (
              <div key={index} className="bg-surface border border-border rounded-lg overflow-hidden group">
                <div 
                  className="flex justify-between items-center p-3 cursor-pointer hover:bg-surface-hover transition-colors"
                  onClick={() => setExpandedCitation(isExpanded ? null : index)}
                >
                  <div className="flex items-center flex-1 min-w-0 pr-3">
                    {faviconUrl ? (
                      <img src={faviconUrl} alt={domain} className="w-5 h-5 rounded bg-gray-800 mr-3 shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded bg-gray-800 mr-3 shrink-0 flex items-center justify-center">
                        <span className="text-[10px] text-gray-400">?</span>
                      </div>
                    )}
                    
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium text-sm text-gray-800 truncate pr-2">
                        {cite.metadata?.title as string || 'Untitled Document'}
                      </span>
                      <div className="text-[11px] text-gray-400 mt-0.5 flex items-center space-x-2">
                        <span className="truncate">{domain}</span>
                        <span>•</span>
                        <span className="text-primary font-mono bg-primary/10 px-1 rounded">Score: {(cite.score * 100).toFixed(0)}%</span>
                        <span>•</span>
                        <span>Chunk {index}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 shrink-0">
                    {urlObj && (
                      <a 
                        href={cite.metadata!.url as string} 
                        target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-500 hover:text-primary p-1.5 rounded-md hover:bg-background transition-colors"
                        title="Open Source"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="p-3 bg-background border-t border-border text-xs text-gray-500 leading-relaxed animate-fade-in font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {cite.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
