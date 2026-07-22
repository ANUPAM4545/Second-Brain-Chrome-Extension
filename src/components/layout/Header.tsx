import React from 'react';
import { Badge } from '../ui/Badge';

export interface HeaderProps {
  title?: string;
  providerName?: string;
  onOptionsClick?: () => void;
}

export const Header = React.memo(({ 
  title = 'Second Brain', 
  providerName = 'Mock Provider',
  onOptionsClick 
}: HeaderProps) => {
  return (
    <div className="bg-surface border-b border-border p-4 flex justify-between items-center z-20 shadow-sm relative">
      <div className="flex flex-col">
        <h1 className="font-bold text-gray-900 text-lg flex items-center space-x-2 tracking-tight">
          <svg
            className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(79,124,255,0.5)]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
          </svg>
          <span>{title}</span>
        </h1>
        <div className="flex items-center space-x-2 mt-1">
          <Badge variant="success" pulse>
            Ready
          </Badge>
          <span className="text-[10px] text-gray-400">•</span>
          <span className="text-[10px] font-medium text-gray-500">
            {providerName}
          </span>
        </div>
      </div>
      <button
        onClick={onOptionsClick}
        className="p-2 hover:bg-surface-hover rounded-xl transition-all text-gray-500 hover:text-gray-900 border border-transparent hover:border-border"
        title="Settings"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
});

Header.displayName = 'Header';
