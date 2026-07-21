import React from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';

const Options = () => {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Second Brain Settings</h1>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Privacy & Controls</h2>
        <div className="flex items-center justify-between mb-4">
          <span>Pause Capture</span>
          <input type="checkbox" className="toggle" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Blocklist Domains (one per line)
          </label>
          <textarea
            className="w-full border border-gray-300 rounded p-2 h-32"
            placeholder="example.com&#10;bank.com"
          />
        </div>
      </div>

      <div className="bg-red-50 shadow rounded-lg p-6 border border-red-200">
        <h2 className="text-lg font-semibold text-red-700 mb-4">Danger Zone</h2>
        <button className="bg-red-600 text-white px-4 py-2 rounded">Wipe Entire Index</button>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
