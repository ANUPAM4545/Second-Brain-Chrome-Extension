import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConfidenceBadge } from './components/ConfidenceBadge';
import { CitationsAccordion } from './components/CitationsAccordion';
import { DevModePanel } from './components/DevModePanel';
import { KnowledgeDashboard } from './components/KnowledgeDashboard';
import { RecentActivity } from './components/RecentActivity';
import { SettingsConfig } from '../config/SettingsConfig';
import type { AppSettings } from '../config/SettingsConfig';
import { LLMProviderFactory } from '../ai/llm/LLMProviderFactory';
import { RAGPipeline } from '../ai/rag/RAGPipeline';
import type { RAGResponse } from '../ai/rag/RAGPipeline';
import { HybridSearchEngine } from '../ai/retrieval/HybridSearchEngine';
import { Header } from '../components/layout/Header';
import { Spinner } from '../components/ui/Spinner';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const SUGGESTIONS = [
  "What is React Server Components?",
  "Summarize this article.",
  "Compare Vite and Webpack."
];

export const Popup = () => {
  const [query, setQuery] = useState('');
  const [lastQuery, setLastQuery] = useState('');
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

  const handleAsk = useCallback(async (e?: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault();
    const targetQuery = directQuery || query;
    if (!targetQuery.trim()) return;

    setLastQuery(targetQuery);
    if (!directQuery) setQuery('');
    
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
      
      const stream = pipeline.streamAnswer(targetQuery);
      
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
  }, [query]);

  const openOptions = useCallback(() => {
    if (chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('options.html', '_blank');
    }
  }, []);

  const cancelGeneration = useCallback(() => {
    // Future: Abort controller logic
    window.location.reload();
  }, []);

  if (!settings) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col w-full">
      <KnowledgeDashboard />
      <div className="mt-6 flex flex-col space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Suggestions</span>
        {SUGGESTIONS.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(undefined, suggestion)}
            className="text-left px-4 py-2.5 bg-surface border border-border hover:border-primary/50 hover:bg-surface-hover rounded-xl text-sm text-gray-700 transition-all group"
          >
            <span className="group-hover:text-primary transition-colors">"{suggestion}"</span>
          </button>
        ))}
      </div>
      <RecentActivity />
    </div>
  );

  const renderChatArea = () => (
    <div className="flex flex-col space-y-6 animate-fade-in">
      <div className="flex justify-end">
        <div className="bg-primary text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-lg shadow-primary/20 text-[15px] leading-relaxed">
          {lastQuery}
        </div>
      </div>

      {(streamingText || isStreaming || error) && (
        <div className="flex justify-start">
          <div className="bg-surface border border-border px-5 py-5 rounded-2xl rounded-tl-sm w-[95%] shadow-lg">
            {error ? (
              <div className="text-danger text-sm flex items-start bg-danger/10 p-3 rounded-lg border border-danger/20">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="flex-1 font-medium">{error}</span>
              </div>
            ) : (
              <>
                {finalResult && (
                  <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                    <ConfidenceBadge
                      score={finalResult.confidence.score}
                      level={finalResult.confidence.level as 'High' | 'Medium' | 'Low'}
                    />
                  </div>
                )}
                
                <div className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {streamingText}
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 align-middle bg-primary animate-pulse rounded-sm"></span>
                  )}
                </div>
                
                {finalResult && (
                  <div className="mt-5 pt-4 border-t border-border">
                    <div className="grid grid-cols-4 gap-2 text-center mb-4 bg-background rounded-lg p-2 border border-border">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">Retrieval</span>
                        <span className="text-xs text-gray-700 font-mono">{timings.retrievalMs}ms</span>
                      </div>
                      <div className="flex flex-col border-l border-border">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">Generation</span>
                        <span className="text-xs text-gray-700 font-mono">{timings.generationMs}ms</span>
                      </div>
                      <div className="flex flex-col border-l border-border">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">Chunks</span>
                        <span className="text-xs text-gray-700 font-mono">{finalResult.citations.size}</span>
                      </div>
                      <div className="flex flex-col border-l border-border">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">Provider</span>
                        <span className="text-xs text-gray-700 capitalize">{settings.llmProvider}</span>
                      </div>
                    </div>
                    
                    <CitationsAccordion citations={finalResult.citations} />
                  </div>
                )}
                
                {settings.developerMode && finalResult && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <DevModePanel result={finalResult} timings={timings} />
                  </div>
                )}
              </>
            )}
            <div ref={endOfStreamRef} />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-background text-gray-900 font-sans shadow-2xl relative overflow-hidden">
      <Header 
        title="Second Brain"
        providerName={settings.llmProvider === 'gemini' ? 'Gemini 1.5' : 'Mock Provider'}
        onOptionsClick={openOptions}
      />

      <div className="flex-1 overflow-y-auto p-5 flex flex-col space-y-6 relative z-10">
        {!lastQuery && !error && !isStreaming ? renderEmptyState() : renderChatArea()}
      </div>

      <div className="p-4 bg-surface border-t border-border z-20">
        <form onSubmit={handleAsk} className="relative flex items-center">
          <Input
            placeholder="Ask anything about your indexed knowledge..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isStreaming}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {isStreaming ? (
              <Button
                variant="danger"
                size="icon"
                type="button"
                onClick={cancelGeneration}
                title="Cancel Generation"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
                </svg>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="icon"
                type="submit"
                disabled={!query.trim()}
              >
                <svg className="w-5 h-5 -ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
