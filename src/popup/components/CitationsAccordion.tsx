import React, { useState } from 'react';
import type { RetrievalResult } from '../../ai/retrieval/RetrievalProvider';

interface CitationsAccordionProps {
  citations: Map<number, RetrievalResult>;
}

export const CitationsAccordion: React.FC<CitationsAccordionProps> = ({ citations }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!citations || citations.size === 0) return null;

  return (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 transition text-sm font-medium text-gray-700 focus:outline-none"
      >
        <span className="flex items-center">
          <svg
            className="w-4 h-4 mr-2 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          Sources ({citations.size})
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 py-3 text-sm text-gray-600 bg-white divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {Array.from(citations.entries()).map(([index, cite]) => {
            const urlObj = cite.metadata?.url ? new URL(cite.metadata.url as string) : null;
            const domain = urlObj ? urlObj.hostname : 'Unknown Domain';
            return (
              <div key={index} className="py-2 first:pt-0 last:pb-0 group">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <span className="inline-block font-mono text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-2">
                      [{index}]
                    </span>
                    <span className="font-medium text-gray-900 line-clamp-1">{cite.metadata?.title as string || 'Untitled Document'}</span>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center space-x-2">
                      <span>{domain}</span>
                      <span className="text-gray-300">•</span>
                      <span>Score: {(cite.score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  {cite.metadata?.url && (
                    <a 
                      href={cite.metadata.url as string} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Open source page"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
