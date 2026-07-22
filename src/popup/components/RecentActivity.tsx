import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../storage/db';

// Helper to format relative time
const getRelativeTime = (epoch: number) => {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const daysDifference = Math.round((epoch - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (daysDifference === 0) {
    const hoursDifference = Math.round((epoch - Date.now()) / (1000 * 60 * 60));
    if (hoursDifference === 0) {
      const minutesDifference = Math.round((epoch - Date.now()) / (1000 * 60));
      return rtf.format(minutesDifference, 'minute');
    }
    return rtf.format(hoursDifference, 'hour');
  }
  return rtf.format(daysDifference, 'day');
};

export const RecentActivity: React.FC = () => {
  const recentDocs = useLiveQuery(async () => {
    const docs = await db.documents.toArray();
    // Sort by captureTime descending
    docs.sort((a, b) => b.captureTime - a.captureTime);
    return docs.slice(0, 3);
  }, []);

  if (!recentDocs || recentDocs.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col space-y-3 mt-6 animate-fade-in">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Recent Activity</h3>
      <div className="flex flex-col space-y-2">
        {recentDocs.map((doc) => {
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${doc.domain}&sz=32`;
          
          return (
            <div key={doc.id} className="bg-surface border border-border rounded-xl p-3 flex items-center space-x-3 hover:bg-surface-hover transition-colors cursor-pointer group">
              <img 
                src={faviconUrl} 
                alt={doc.domain} 
                className="w-6 h-6 rounded bg-gray-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800 truncate group-hover:text-primary transition-colors">
                  {doc.title || doc.url}
                </span>
                <div className="flex items-center text-xs text-gray-400 space-x-2 mt-0.5">
                  <span className="truncate max-w-[120px]">{doc.domain}</span>
                  <span>•</span>
                  <span>{getRelativeTime(doc.captureTime)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end justify-center text-xs">
                {doc.status === 'INDEXED' ? (
                  <span className="text-success font-medium flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Ready
                  </span>
                ) : (
                  <span className="text-warning font-medium flex items-center">
                    <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {doc.status.toLowerCase()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
