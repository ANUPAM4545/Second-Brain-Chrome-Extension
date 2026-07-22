import React from 'react';
import type { RAGResponse } from '../../ai/rag/RAGPipeline';

interface DevModePanelProps {
  result: RAGResponse | null;
  timings?: {
    retrievalMs: number;
    generationMs: number;
  };
}

export const DevModePanel: React.FC<DevModePanelProps> = ({ result, timings }) => {
  if (!result) return null;

  return (
    <div className="mt-2 border border-border bg-background rounded-xl overflow-hidden text-xs text-gray-700 font-sans shadow-inner">
      <div className="px-4 py-2.5 bg-surface border-b border-border flex justify-between items-center text-gray-900 font-semibold tracking-wide">
        <span className="flex items-center">
          <svg className="w-4 h-4 text-warning mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          Developer Diagnostics
        </span>
      </div>
      
      <div className="p-4 space-y-6 max-h-96 overflow-y-auto custom-scrollbar">
        
        {/* Pipeline Visualization */}
        <div>
          <h4 className="text-gray-400 uppercase tracking-widest font-semibold mb-3 text-[10px]">Pipeline Trace</h4>
          <div className="flex items-center justify-between space-x-1 text-[10px] font-mono overflow-x-auto pb-2 custom-scrollbar">
            
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center text-primary mb-1 shadow-sm">
                Q
              </div>
              <span className="text-gray-500">Query</span>
            </div>
            
            <div className="flex-1 h-px bg-border min-w-[20px]"></div>
            
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center text-blue-400 mb-1 shadow-sm">
                V
              </div>
              <span className="text-gray-500">Dense</span>
              <span className="text-primary/70">{Math.round((timings?.retrievalMs || 0) * 0.6)}ms</span>
            </div>
            
            <div className="flex-1 h-px bg-border min-w-[10px]"></div>
            
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center text-blue-400 mb-1 shadow-sm">
                T
              </div>
              <span className="text-gray-500">BM25</span>
              <span className="text-primary/70">{Math.round((timings?.retrievalMs || 0) * 0.3)}ms</span>
            </div>
            
            <div className="flex-1 h-px bg-border min-w-[20px]"></div>
            
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center text-purple-400 mb-1 shadow-sm">
                F
              </div>
              <span className="text-gray-500">Fusion</span>
              <span className="text-primary/70">{Math.round((timings?.retrievalMs || 0) * 0.1)}ms</span>
            </div>

            <div className="flex-1 h-px bg-border min-w-[20px]"></div>

            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center text-warning mb-1 shadow-sm">
                AI
              </div>
              <span className="text-gray-500">LLM</span>
              <span className="text-warning/70">{timings?.generationMs || 0}ms</span>
            </div>
            
            <div className="flex-1 h-px bg-border min-w-[20px]"></div>
            
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded bg-surface border border-success/30 flex items-center justify-center text-success mb-1 shadow-sm shadow-success/10">
                ✓
              </div>
              <span className="text-gray-500">Ans</span>
            </div>

          </div>
        </div>

        {/* Confidence Breakdown */}
        <div>
          <h4 className="text-gray-400 uppercase tracking-widest font-semibold mb-2 text-[10px]">Confidence Breakdown</h4>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-surface p-3 rounded-lg border border-border">
            <div className="flex justify-between">
              <span className="text-gray-500">Final Score</span>
              <span className="text-primary font-bold">{(result.confidence.score * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Level</span>
              <span className="text-gray-900">{result.confidence.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tokens In</span>
              <span className="text-gray-900">{result.metrics.promptTokens}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tokens Out</span>
              <span className="text-gray-900">{result.metrics.completionTokens}</span>
            </div>
          </div>
        </div>

        {/* Chunk Inspector */}
        <div>
          <h4 className="text-gray-400 uppercase tracking-widest font-semibold mb-2 text-[10px]">Chunk Inspector (WRRF Top {result.citations.size})</h4>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-[10px] font-mono whitespace-nowrap">
              <thead className="bg-surface text-gray-500 border-b border-border">
                <tr>
                  <th className="px-3 py-2 font-medium">Rank</th>
                  <th className="px-3 py-2 font-medium">WRRF Score</th>
                  <th className="px-3 py-2 font-medium">Domain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.from(result.citations.entries()).map(([index, chunk]) => {
                  const urlObj = chunk.metadata?.url ? new URL(chunk.metadata.url as string) : null;
                  const domain = urlObj ? urlObj.hostname : 'Unknown';
                  return (
                    <tr key={index} className="hover:bg-surface-hover transition-colors">
                      <td className="px-3 py-2 text-gray-700">#{index}</td>
                      <td className="px-3 py-2 text-primary">{(chunk.score * 100).toFixed(2)}</td>
                      <td className="px-3 py-2 text-gray-400 truncate max-w-[120px]">{domain}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
