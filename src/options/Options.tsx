import React, { useState, useEffect, useCallback } from 'react';
import { SettingsConfig } from '../config/SettingsConfig';
import type { AppSettings } from '../config/SettingsConfig';
import { LLMProviderFactory } from '../ai/llm/LLMProviderFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../storage/db';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const Options = () => {
  const [activeTab, setActiveTab] = useState<'llm' | 'knowledge' | 'dev'>('llm');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [providerStatus, setProviderStatus] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [storageUsed, setStorageUsed] = useState<number>(0);

  const documentCount = useLiveQuery(() => db.documents.count()) ?? 0;
  const chunkCount = useLiveQuery(() => db.chunks.count()) ?? 0;
  const embeddingCount = useLiveQuery(() => db.embeddings.count()) ?? 0;

  useEffect(() => {
    SettingsConfig.getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const calculateStorage = async () => {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        setStorageUsed(estimate.usage || 0);
      }
    };
    calculateStorage();
  }, [documentCount, chunkCount]);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings) {
      await SettingsConfig.saveSettings(settings);
      setSaveStatus('Settings saved successfully');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  }, [settings]);

  const handleTestConnection = useCallback(async () => {
    setIsTesting(true);
    setProviderStatus('');
    setAvailableModels([]);
    try {
      const provider = await LLMProviderFactory.createProvider();
      await provider.initialize();
      const health = await provider.health();
      if (health.status === 'OK') {
        setProviderStatus(`Connected to ${health.modelName}`);
      } else {
        setProviderStatus(`Error: ${health.message}`);
      }
      
      if (settings?.geminiApiKey) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${settings.geminiApiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const models = data.models || [];
          const validModels = models
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => m.name.replace('models/', ''));
          setAvailableModels(validModels);
        }
      }
    } catch (e: any) {
      setProviderStatus(`Error: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  }, [settings?.geminiApiKey]);

  const handleClearData = useCallback(async () => {
    if (window.confirm('WARNING: This will permanently delete your entire Knowledge Base. Are you sure?')) {
      await db.documents.clear();
      await db.chunks.clear();
      await db.embeddings.clear();
      alert('Knowledge Base wiped successfully.');
    }
  }, []);

  if (!settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  const renderLlmTab = () => (
    <div className="space-y-8 animate-fade-in flex-1">
      <CardHeader className="mb-0">
        <div>
          <CardTitle>LLM Configuration</CardTitle>
          <CardDescription>Configure the intelligence powering your Second Brain.</CardDescription>
        </div>
      </CardHeader>

      <div className="space-y-6 max-w-xl">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Active Provider</label>
          <select
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-gray-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all shadow-inner"
            value={settings.llmProvider}
            onChange={(e) => setSettings({ ...settings, llmProvider: e.target.value as 'mock' | 'gemini' })}
          >
            <option value="mock">Mock Provider (Fast / Local Testing)</option>
            <option value="gemini">Google Gemini API (Cloud)</option>
          </select>
        </div>

        {settings.llmProvider === 'gemini' && (
          <div className="space-y-6 animate-slide-up">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Gemini API Key</label>
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={settings.geminiApiKey}
                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                helperText="Stored securely in local browser storage. Never synced or logged."
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Gemini Model</label>
              <Input
                type="text"
                placeholder="gemini-3.5-flash"
                value={settings.geminiModel}
                onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                helperText="Specify the model identifier (e.g. gemini-3.5-flash, gemini-3.1-flash-lite)."
                className="font-mono"
              />
            </div>
          </div>
        )}
      </div>

      <div className="pt-8 border-t border-border flex items-center space-x-4">
        <Button type="submit">Save Settings</Button>
        <Button type="button" variant="secondary" onClick={handleTestConnection} isLoading={isTesting}>
          {isTesting ? 'Testing...' : 'Test Connection'}
        </Button>
        
        {saveStatus && <span className="text-success text-sm font-medium animate-fade-in">{saveStatus}</span>}
        {providerStatus && (
          <span className={`text-sm font-medium animate-fade-in ${providerStatus.startsWith('Error') ? 'text-danger' : 'text-success'}`}>
            {providerStatus}
          </span>
        )}
      </div>
      {availableModels.length > 0 && (
        <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20 animate-fade-in">
          <p className="text-sm font-semibold text-primary mb-2">Available Models for your API Key:</p>
          <div className="flex flex-wrap gap-2">
            {availableModels.map(model => (
              <button
                key={model}
                type="button"
                onClick={() => setSettings({ ...settings, geminiModel: model })}
                className="text-xs bg-surface border border-border px-3 py-1.5 rounded-lg hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                {model}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">Click on a model above to auto-fill it.</p>
        </div>
      )}
    </div>
  );

  const renderKnowledgeTab = () => (
    <div className="space-y-8 animate-fade-in flex-1">
      <CardHeader className="mb-0">
        <div>
          <CardTitle>Knowledge Dashboard</CardTitle>
          <CardDescription>Monitor and manage your indexed data.</CardDescription>
        </div>
      </CardHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="metric">
          <div className="text-primary text-[10px] font-bold uppercase tracking-widest mb-2">Documents</div>
          <div className="text-3xl font-bold text-gray-900">{documentCount.toLocaleString()}</div>
        </Card>
        <Card variant="metric">
          <div className="text-primary text-[10px] font-bold uppercase tracking-widest mb-2">Chunks</div>
          <div className="text-3xl font-bold text-gray-900">{chunkCount.toLocaleString()}</div>
        </Card>
        <Card variant="metric">
          <div className="text-primary text-[10px] font-bold uppercase tracking-widest mb-2">Embeddings</div>
          <div className="text-3xl font-bold text-gray-900">{embeddingCount.toLocaleString()}</div>
        </Card>
        <Card variant="metric">
          <div className="text-primary text-[10px] font-bold uppercase tracking-widest mb-2">Storage Used</div>
          <div className="text-3xl font-bold text-gray-900">{formatBytes(storageUsed, 1)}</div>
        </Card>
      </div>

      <div className="space-y-6 max-w-xl pt-6">
        <h3 className="text-sm font-semibold text-gray-800">Retrieval Tuning</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-500">Max Chunks (Top-K)</label>
            <Input
              type="number" min="1" max="50"
              value={settings.maxRetrievedChunks}
              onChange={(e) => setSettings({ ...settings, maxRetrievedChunks: parseInt(e.target.value) || 10 })}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-500">Context Token Budget</label>
            <Input
              type="number" min="500" max="8000" step="500"
              value={settings.contextTokenBudget}
              onChange={(e) => setSettings({ ...settings, contextTokenBudget: parseInt(e.target.value) || 2000 })}
            />
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-border flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button type="submit">Save Settings</Button>
          {saveStatus && <span className="text-success text-sm font-medium animate-fade-in">{saveStatus}</span>}
        </div>
        
        <div className="flex space-x-3">
          <Button type="button" variant="secondary">Rebuild Index</Button>
          <Button type="button" variant="danger" onClick={handleClearData}>Clear Database</Button>
        </div>
      </div>
    </div>
  );

  const renderDevTab = () => (
    <div className="space-y-8 animate-fade-in flex-1">
      <CardHeader className="mb-0">
        <div>
          <CardTitle>Developer Mode</CardTitle>
          <CardDescription>Enable deep diagnostics in the popup interface.</CardDescription>
        </div>
      </CardHeader>

      <div className="max-w-xl">
        <label className="flex items-start space-x-4 cursor-pointer p-5 bg-background border border-border hover:border-primary/50 rounded-2xl transition-all group">
          <div className="flex items-center h-5 mt-0.5">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-gray-600 bg-surface text-primary focus:ring-primary/50 focus:ring-offset-background"
              checked={settings.developerMode}
              onChange={(e) => setSettings({ ...settings, developerMode: e.target.checked })}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">Show Pipeline Trace</span>
            <span className="text-xs text-gray-400 mt-1 leading-relaxed">
              Displays the dense/sparse retrieval pipeline, WRRF scores, confidence breakdowns, and generation metrics directly in the popup after every answer.
            </span>
          </div>
        </label>
      </div>

      <div className="pt-8 border-t border-border flex items-center space-x-4">
        <Button type="submit">Save Settings</Button>
        {saveStatus && <span className="text-success text-sm font-medium animate-fade-in">{saveStatus}</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-gray-900 font-sans selection:bg-primary/30">
      <div className="max-w-5xl mx-auto py-12 px-6">
        
        <div className="flex items-center space-x-4 mb-10">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Second Brain Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your knowledge base and AI configuration.</p>
          </div>
        </div>

        <div className="flex bg-surface border border-border rounded-2xl overflow-hidden min-h-[600px] shadow-xl">
          
          <div className="w-64 bg-background/50 border-r border-border p-4 flex flex-col space-y-2">
            <button
              onClick={() => setActiveTab('llm')}
              className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center ${activeTab === 'llm' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-500 hover:text-gray-800 hover:bg-surface-hover'}`}
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              LLM Provider
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center ${activeTab === 'knowledge' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-500 hover:text-gray-800 hover:bg-surface-hover'}`}
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
              Knowledge Base
            </button>
            <button
              onClick={() => setActiveTab('dev')}
              className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center ${activeTab === 'dev' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-500 hover:text-gray-800 hover:bg-surface-hover'}`}
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              Developer Mode
            </button>
          </div>

          <div className="flex-1 p-10 bg-surface">
            <form onSubmit={handleSave} className="h-full flex flex-col">
              {activeTab === 'llm' && renderLlmTab()}
              {activeTab === 'knowledge' && renderKnowledgeTab()}
              {activeTab === 'dev' && renderDevTab()}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
