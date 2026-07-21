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
    <div className="mt-6 border-t border-gray-200 pt-4 pb-2 bg-gray-900 rounded-lg overflow-hidden font-mono text-xs text-green-400">
      <div className="px-3 py-2 bg-black border-b border-gray-800 flex justify-between items-center text-gray-300 font-sans text-sm font-semibold">
        <span>Developer Mode Diagnostics</span>
      </div>
      <div className="p-3 space-y-3 max-h-60 overflow-y-auto">
        <div>
          <h4 className="text-gray-500 uppercase font-semibold mb-1">Pipeline Timings</h4>
          <div className="grid grid-cols-2 gap-1">
            <span>Retrieval:</span>{' '}
            <span className="text-right text-yellow-300">{timings?.retrievalMs || 0}ms</span>
            <span>Generation:</span>{' '}
            <span className="text-right text-yellow-300">{timings?.generationMs || 0}ms</span>
            <span>TTFT:</span> <span className="text-right text-yellow-300">N/A (Streamed)</span>
          </div>
        </div>

        <div>
          <h4 className="text-gray-500 uppercase font-semibold mb-1">Retrieval Metrics</h4>
          <div className="grid grid-cols-2 gap-1">
            <span>Documents Indexed:</span> <span className="text-right text-white">Cache/DB</span>
            <span>Retrieved Chunks:</span> <span className="text-right text-white">{result.citations.size}</span>
            <span>Est. Context Tokens:</span>{' '}
            <span className="text-right text-white">
              {result.metrics.promptTokens || 'Unknown'}
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-gray-500 uppercase font-semibold mb-1">Confidence Breakdown</h4>
          <div className="grid grid-cols-2 gap-1">
            <span>Final Score:</span>{' '}
            <span className="text-right text-blue-300">
              {(result.confidence.score * 100).toFixed(1)}% ({result.confidence.level})
            </span>
          </div>
          <div className="text-gray-400 mt-1 pl-2 text-[10px]">
            {/* We don't have the raw breakdown passed through the Pipeline currently, 
                so we display the final RAGResult object. In a full system, you would extend 
                RAGResult to include raw WRRF scores. */}
            Hybrid WRRF = 0.6*Dense + 0.4*BM25
          </div>
        </div>
      </div>
    </div>
  );
};
