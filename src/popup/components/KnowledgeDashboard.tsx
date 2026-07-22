import React from 'react';
import { useKnowledgeStats } from '../hooks/useKnowledgeStats';
import { useCurrentPage } from '../hooks/useCurrentPage';

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const KnowledgeDashboard: React.FC = () => {
  const stats = useKnowledgeStats();
  const { url, title, document, isLoading } = useCurrentPage();

  const handleIndexCurrentPage = () => {
    // Send message to background to index current page
    chrome.runtime.sendMessage({ type: 'INDEX_CURRENT_PAGE' });
  };

  return (
    <div className="flex flex-col space-y-4 w-full animate-fade-in">
      {/* Global Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col hover:border-primary/50 transition-colors">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Documents</span>
          <span className="text-2xl font-bold text-gray-900">{stats.documents.toLocaleString()}</span>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col hover:border-primary/50 transition-colors">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Chunks</span>
          <span className="text-2xl font-bold text-gray-900">{stats.chunks.toLocaleString()}</span>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col hover:border-primary/50 transition-colors">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Embeddings</span>
          <span className="text-2xl font-bold text-gray-900">{stats.embeddings.toLocaleString()}</span>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col hover:border-primary/50 transition-colors">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Storage</span>
          <span className="text-2xl font-bold text-gray-900">{formatBytes(stats.storageUsed, 1)}</span>
        </div>
      </div>

      {/* Current Page Status */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary/50 transition-colors"></div>
        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 pl-2">Current Page</span>
        
        {isLoading ? (
          <div className="flex items-center space-x-2 pl-2 text-gray-500">
            <span className="w-4 h-4 rounded-full border-2 border-gray-500 border-t-transparent animate-spin"></span>
            <span className="text-sm">Checking status...</span>
          </div>
        ) : !url ? (
          <div className="pl-2 text-sm text-gray-500">
            Cannot index this page type (chrome:// or blank).
          </div>
        ) : document ? (
          <div className="pl-2 flex flex-col space-y-2">
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-800 font-medium line-clamp-1 flex-1 pr-2" title={document.title || url}>
                {document.title || url}
              </span>
              <span className="flex items-center text-success text-xs font-semibold bg-success/10 px-2 py-1 rounded-full whitespace-nowrap">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Indexed
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/50 text-xs text-gray-500">
              <div className="flex justify-between"><span>Words:</span> <span className="text-gray-800">{document.wordCount?.toLocaleString() || 0}</span></div>
              <div className="flex justify-between"><span>Chunks:</span> <span className="text-gray-800">{document.chunkCount?.toLocaleString() || 0}</span></div>
              <div className="flex justify-between col-span-2">
                <span>Updated:</span> 
                <span className="text-gray-800">{new Date(document.modifiedDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            </div>
            
            <div className="flex space-x-2 mt-3 pt-2">
              <button className="flex-1 bg-surface-hover hover:bg-border text-gray-800 text-xs py-1.5 rounded-lg transition-colors border border-border font-medium">
                Reindex
              </button>
            </div>
          </div>
        ) : (
          <div className="pl-2 flex flex-col space-y-3">
             <span className="text-sm text-gray-700 font-medium line-clamp-1" title={title || url}>
                {title || url}
             </span>
             <span className="text-xs text-gray-400">This page is not in your knowledge base yet.</span>
             <button 
                onClick={handleIndexCurrentPage}
                className="w-full bg-primary hover:bg-blue-500 text-gray-900 text-sm py-2 rounded-lg transition-all shadow-lg shadow-primary/20 font-medium"
             >
               Index Current Page
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
