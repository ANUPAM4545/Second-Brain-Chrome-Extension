import { useState, useEffect } from 'react';
import { SettingsConfig } from '../config/SettingsConfig';
import type { AppSettings } from '../config/SettingsConfig';
import { LLMProviderFactory } from '../ai/llm/LLMProviderFactory';

export const Options = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'data' | 'dev'>('general');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [stats, setStats] = useState({ docs: 0, chunks: 0, embeddings: 0 });
  const [saveStatus, setSaveStatus] = useState('');
  const [providerStatus, setProviderStatus] = useState('');

  useEffect(() => {
    SettingsConfig.getSettings().then(setSettings);
    loadStats();
  }, []);

  const loadStats = async () => {
    setStats({
      docs: 0, // Mocked for UI milestone
      chunks: 0, 
      embeddings: 0
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings) {
      await SettingsConfig.saveSettings(settings);
      setSaveStatus('Settings saved securely.');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleTestConnection = async () => {
    setProviderStatus('Testing...');
    try {
      const provider = await LLMProviderFactory.createProvider();
      await provider.initialize();
      const health = await provider.health();
      setProviderStatus(`Status: ${health.status} (${health.modelName})`);
    } catch (e: any) {
      setProviderStatus(`Error: ${e.message}`);
    }
  };

  const handleClearData = async () => {
    if (
      window.confirm('Are you sure you want to delete all indexed data? This cannot be undone.')
    ) {
      // In a real app we'd clear IndexedDB here
      alert('Data cleared successfully (simulated).');
      setStats({ docs: 0, chunks: 0, embeddings: 0 });
    }
  };

  if (!settings) return <div className="p-4">Loading settings...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 text-blue-600">Second Brain Settings</h1>

        <div className="bg-white shadow rounded-lg flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-1/4 bg-gray-100 border-r border-gray-200">
            <nav className="flex flex-col">
              <button
                onClick={() => setActiveTab('general')}
                className={`text-left px-6 py-4 font-medium transition-colors ${activeTab === 'general' ? 'bg-white border-l-4 border-blue-500 text-blue-700' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                LLM Configuration
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`text-left px-6 py-4 font-medium transition-colors ${activeTab === 'data' ? 'bg-white border-l-4 border-blue-500 text-blue-700' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Data Management
              </button>
              <button
                onClick={() => setActiveTab('dev')}
                className={`text-left px-6 py-4 font-medium transition-colors ${activeTab === 'dev' ? 'bg-white border-l-4 border-blue-500 text-blue-700' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Developer Mode
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="w-3/4 p-8">
            {saveStatus && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md border border-green-200 text-sm font-medium">
                {saveStatus}
              </div>
            )}

            <form onSubmit={handleSave}>
              {/* GENERAL TAB */}
              {activeTab === 'general' && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-xl font-semibold border-b pb-2">LLM Provider Settings</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Active Provider
                    </label>
                    <select
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      value={settings.llmProvider}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          llmProvider: e.target.value as 'mock' | 'gemini',
                        })
                      }
                    >
                      <option value="mock">Mock Provider (Fast / Local Testing)</option>
                      <option value="gemini">Google Gemini API (Cloud)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      The RAG pipeline will seamlessly swap providers based on this selection.
                    </p>
                  </div>

                  {settings.llmProvider === 'gemini' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gemini API Key
                      </label>
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        value={settings.geminiApiKey}
                        onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Stored securely in local browser storage. Never synced or logged.
                      </p>
                    </div>
                  )}

                  <div className="pt-4 flex items-center space-x-4">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium shadow-sm"
                    >
                      Save Configurations
                    </button>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition font-medium border border-gray-300"
                    >
                      Test Connection
                    </button>
                  </div>
                  {providerStatus && (
                    <div className="text-sm font-mono bg-gray-50 p-2 rounded border mt-2">
                      {providerStatus}
                    </div>
                  )}
                </div>
              )}

              {/* DATA TAB */}
              {activeTab === 'data' && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-xl font-semibold border-b pb-2">Knowledge Base Stats</h2>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="text-blue-500 text-sm font-semibold uppercase tracking-wider">
                        Documents
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mt-1">{stats.docs}</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="text-blue-500 text-sm font-semibold uppercase tracking-wider">
                        Chunks
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mt-1">{stats.chunks}+</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="text-blue-500 text-sm font-semibold uppercase tracking-wider">
                        Embeddings
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mt-1">
                        {stats.embeddings}+
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium text-gray-900">Advanced RAG Settings</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Retrieved Chunks (Top-K)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        className="w-1/2 border-gray-300 rounded-md shadow-sm p-2 border"
                        value={settings.maxRetrievedChunks}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            maxRetrievedChunks: parseInt(e.target.value) || 10,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Context Token Budget
                      </label>
                      <input
                        type="number"
                        min="500"
                        max="8000"
                        step="500"
                        className="w-1/2 border-gray-300 rounded-md shadow-sm p-2 border"
                        value={settings.contextTokenBudget}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            contextTokenBudget: parseInt(e.target.value) || 2000,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t flex space-x-4">
                    <button
                      type="button"
                      onClick={handleClearData}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-md hover:bg-red-100 transition font-medium border border-red-200"
                    >
                      Clear All Indexed Data
                    </button>
                    <button
                      type="button"
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition font-medium border border-gray-300"
                    >
                      Rebuild Search Index
                    </button>
                  </div>

                  <button type="submit" className="hidden" id="hidden-save-btn"></button>
                </div>
              )}

              {/* DEV TAB */}
              {activeTab === 'dev' && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-xl font-semibold border-b pb-2">Developer Tools</h2>

                  <label className="flex items-center space-x-3 cursor-pointer p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={settings.developerMode}
                      onChange={(e) =>
                        setSettings({ ...settings, developerMode: e.target.checked })
                      }
                    />
                    <div>
                      <span className="block font-medium text-gray-900">
                        Enable Developer Mode UI
                      </span>
                      <span className="block text-sm text-gray-500">
                        Shows detailed RAG metrics, latency, WRRF scores, and confidence breakdown
                        directly in the extension popup.
                      </span>
                    </div>
                  </label>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium shadow-sm"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
