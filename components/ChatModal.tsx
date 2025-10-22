import React, { useState, useRef, useEffect } from 'react';
import type { ScheduleItem } from '../types';
import { askAiAboutSchedule } from '../services/geminiService';
import Icon from './Icon';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleItems: ScheduleItem[];
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, scheduleItems }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'chat' | 'settings'>('chat');
  const [apiKey, setApiKey] = useState('');
  const [mouseDownInModal, setMouseDownInModal] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view === 'settings') {
      const savedApiKey = localStorage.getItem('geminiApiKey') || '';
      setApiKey(savedApiKey);
    }
  }, [view]);

  useEffect(() => {
    if (isOpen) {
      setView('chat');
      setPrompt('');
      setResponse('');
      setError(null);
      // Autofocus the input
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const aiResponse = await askAiAboutSchedule(prompt, scheduleItems);
      setResponse(aiResponse);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('geminiApiKey', apiKey);
    setView('chat');
  };



  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setMouseDownInModal(false);
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !mouseDownInModal) {
      onClose();
    }
    setMouseDownInModal(false);
  };

  const handleModalMouseDown = () => {
    setMouseDownInModal(true);
  };

  if (!isOpen) {
    return null;
  }

  const renderChatView = () => (
    <>
      <p className="text-sm text-slate-500 mb-4">Get quick insights into your tasks and appointments.</p>

      <div className="flex-grow bg-slate-50 rounded-xl p-4 overflow-y-auto mb-4 min-h-[150px] border border-slate-200">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3 text-slate-500">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Thinking...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        {response && !isLoading && (
          <p className="text-slate-700 whitespace-pre-wrap">{response}</p>
        )}
        {!response && !isLoading && !error && (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-slate-400">Your answer will appear here.</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="ai-chat-prompt" className="sr-only">Ask a question...</label>
        <div className="relative">
          <input
            id="ai-chat-prompt"
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., What's my busiest day next week?"
            className="w-full pl-4 pr-12 py-3 text-slate-800 bg-slate-100 border-2 border-transparent rounded-xl focus:bg-white focus:border-purple-500 focus:ring-0 transition"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-2 w-10 h-10 my-auto flex items-center justify-center bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
            disabled={isLoading || !prompt.trim()}
            aria-label="Submit question"
          >
            <Icon name="send" className="text-xl" />
          </button>
        </div>
      </form>
    </>
  );

  const renderSettingsView = () => (
    <>
      <p className="text-sm text-slate-500 mb-4">Manage your Gemini API Key.</p>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm p-3 rounded-lg mb-4">
        <p>Your API key is stored locally in your browser and is never sent to any server besides Google's.</p>
      </div>

      <div>
        <label htmlFor="api-key-input" className="block text-sm font-medium text-slate-600 mb-1">Gemini API Key</label>
        <input
          id="api-key-input"
          type="password"
          className="w-full p-2 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-purple-500"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
        />
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={() => setView('chat')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200 bg-slate-200 text-slate-700 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
        >
          <span>Cancel</span>
        </button>
        <button
          onClick={handleSaveSettings}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200 bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Icon name="save" />
          <span>Save</span>
        </button>
      </div>
    </>
  );


  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex justify-center items-center transition-opacity duration-300 animate-[fade-in_0.2s_ease-out]"
      onMouseDown={handleBackgroundMouseDown}
      onClick={handleBackgroundClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg m-4 px-6 pb-6 pt-12 flex flex-col max-h-[80vh]"
        onMouseDown={handleModalMouseDown}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center mb-2">
          <h2 className="text-xl font-bold text-slate-800">
            {view === 'chat' ? 'Ask AI About Your Schedule' : 'Settings'}
          </h2>
          {view === 'chat' && (
            <button
              onClick={() => setView('settings')}
              className="text-slate-500 hover:text-slate-800 transition-colors p-1 rounded-full ml-2"
              aria-label="Open settings"
            >
              <Icon name="settings" />
            </button>
          )}
        </div>

        {view === 'chat' ? renderChatView() : renderSettingsView()}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={view === 'chat' ? 'Close chat' : 'Close settings'}
        >
          <Icon name="close" />
        </button>
      </div>
    </div>
  );
};

export default ChatModal;