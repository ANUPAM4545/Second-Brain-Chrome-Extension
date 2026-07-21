import React from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';

const Popup = () => {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Second Brain</h1>
      <p className="text-sm text-gray-600 mb-4">Personal RAG over your browsing history.</p>
      <input
        type="text"
        placeholder="Ask a question..."
        className="w-full p-2 border border-gray-300 rounded mb-2"
      />
      <button className="w-full bg-blue-600 text-white p-2 rounded">Search</button>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
