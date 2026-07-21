import React, { useState, useEffect, useRef } from 'react';
import { ConfidenceBadge } from './components/ConfidenceBadge';
import { CitationsAccordion } from './components/CitationsAccordion';
import { DevModePanel } from './components/DevModePanel';
import { SettingsConfig } from '../config/SettingsConfig';
import type { AppSettings } from '../config/SettingsConfig';
import { LLMProviderFactory } from '../ai/llm/LLMProviderFactory';
import { RAGPipeline } from '../ai/rag/RAGPipeline';
import type { RAGResponse } from '../ai/rag/RAGPipeline';
import { HybridSearchEngine } from '../ai/retrieval/HybridSearchEngine';

export const Popup = () => {
  const [query, setQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [finalResult, setFinalResult] = useState<RAGResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [timings, setTimings] = useState({ retrievalMs: 0, generationMs: 0 });

  const endOfStreamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    SettingsConfig.getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (endOfStreamRef.current && isStreaming) {
      endOfStreamRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingText, isStreaming]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsStreaming(true);
    setStreamingText('');
    setFinalResult(null);
    setError(null);

    const startTime = performance.now();
    let retrievalTime = 0;

    try {
      const searchEngine = new HybridSearchEngine();
      await searchEngine.initialize();
      
      const llmProvider = await LLMProviderFactory.createProvider();
      
      const pipeline = new RAGPipeline(searchEngine, llmProvider);
      
      const stream = pipeline.streamAnswer(query);
      
      for await (const msg of stream) {
        if (!retrievalTime) {
          retrievalTime = performance.now();
          setTimings(prev => ({ ...prev, retrievalMs: Math.round(retrievalTime - startTime) }));
        }
        
        if (msg.type === 'chunk') {
          if (msg.data.text) {
            setStreamingText(prev => prev + msg.data.text);
          }
        }

        if (msg.type === 'metadata') {
          setFinalResult(msg.data as RAGResponse);
          setTimings(prev => ({ ...prev, generationMs: Math.round(performance.now() - retrievalTime) }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during generation.');
    } finally {
      setIsStreaming(false);
    }
  };

  const openOptions = () => {
    if (chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('options.html', '_blank');
    }
  };

  if (!settings) return <div className="p-4 text-sm text-gray-500">Loading extension core...</div>;

  return (
    <div className="w-[450px] min-h-[500px] max-h-[600px] flex flex-col bg-white text-gray-900 font-sans shadow-xl">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md z-10 relative">
        <h1 className="font-bold text-lg flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
          </svg>
          <span>Second Brain AI</span>
        </h1>
        <button
          onClick={openOptions}
          className="p-1.5 hover:bg-blue-700 rounded transition text-blue-100 hover:text-white"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col space-y-4">
        {/* Empty State */}
        {!streamingText && !error && !isStreaming && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-8 text-gray-500">
            <svg
              className="w-12 h-12 text-gray-300 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <p className="text-sm">
              Ask your Second Brain anything about the pages you've indexed.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Streaming/Answer Area */}
        {(streamingText || isStreaming) && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-fadeIn">
            {finalResult && (
              <div className="mb-3 flex items-center justify-between border-b pb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Answer Generated
                </span>
                <ConfidenceBadge
                  score={finalResult.confidence.score}
                  level={finalResult.confidence.level as 'High' | 'Medium' | 'Low'}
                />
              </div>
            )}
            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
              {streamingText}
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-blue-500 animate-pulse"></span>
              )}
            </div>

            {finalResult && <CitationsAccordion citations={finalResult.citations} />}

            <div ref={endOfStreamRef} />
          </div>
        )}

        {/* Dev Mode Panel */}
        {settings.developerMode && finalResult && (
          <DevModePanel result={finalResult} timings={timings} />
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleAsk} className="relative">
          <input
            type="text"
            placeholder="Ask a question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isStreaming}
            className="w-full pl-4 pr-12 py-3 bg-gray-100 border-transparent rounded-full focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !query.trim()}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isStreaming ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
