import React, { useState, useEffect, useRef } from 'react';
import type { ScheduleItem, ScheduleItemData } from '../types';
import { parseScheduleWithAI } from '../services/geminiService';
import Icon from './Icon';

interface AddItemFormProps {
  onAddItems: (itemData: ScheduleItemData[]) => void;
  onUpdateItem?: (id: string, itemData: ScheduleItemData) => void;
  scheduleItems: ScheduleItem[];
  editingItem?: ScheduleItem | null;
}

type FormMode = 'ai' | 'manual';
type View = 'form' | 'confirm';

const AddItemForm: React.FC<AddItemFormProps> = ({ onAddItems, onUpdateItem, scheduleItems, editingItem }) => {
  const [mode, setMode] = useState<FormMode>('ai');
  const [view, setView] = useState<View>('form');
  const [aiPrompt, setAiPrompt] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<ScheduleItemData[]>([]);
  const [selectedIndices, setSelectedIndexes] = useState<Set<number>>(new Set());

  const titleInputRef = useRef<HTMLInputElement>(null);

  const aiPlaceholders = [
    "e.g., Team meeting tomorrow 2pm",
    "e.g., Gym session every Monday 6am",
    "e.g., Dentist appointment next Friday 3pm",
    "e.g., Lunch with Sarah tomorrow noon",
    "e.g., Project deadline on Dec 15",
    "e.g., Weekend trip plan from Oct 25 to Oct 27"
  ];

  // Select a random placeholder on component mount
  const [aiPlaceholder] = useState(() =>
    aiPlaceholders[Math.floor(Math.random() * aiPlaceholders.length)]
  );

  // Initialize form with editing item data if provided
  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setDescription(editingItem.description || '');
      setDate(editingItem.date);
      setTime(editingItem.time || '');
      setEndTime(editingItem.endTime || '');
      setMode('manual');
    }
  }, [editingItem]);

  useEffect(() => {
    if (mode === 'manual') {
      if (!date) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);
      }

      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [mode]);


  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const parsedData = await parseScheduleWithAI(aiPrompt, scheduleItems);
      if (parsedData && parsedData.length > 0) {
        setSuggestions(parsedData);
        setSelectedIndexes(new Set(parsedData.map((_, index) => index))); // Select all by default
        setView('confirm');
      } else {
        setError('AI could not understand the input. Please try being more specific or add it manually.');
      }
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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date.trim()) {
      setError("Title and Date are required.");
      return;
    }

    const year = parseInt(date.split('-')[0]);
    if (year > 2999) {
      setError("Year cannot exceed 2999");
      return;
    }

    if (endTime && !time) {
      setError("Cannot set an end time without a start time.");
      return;
    }

    setError(null);

    const itemData: ScheduleItemData = {
      title,
      description: description || null,
      date,
      time: time || null,
      endTime: endTime || null,
    };

    if (editingItem && onUpdateItem) {
      onUpdateItem(editingItem.id, itemData);
    } else {
      onAddItems([itemData]);
    }
  };

  const handleToggleSelection = (index: number) => {
    const newSelection = new Set(selectedIndices);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedIndexes(newSelection);
  };

  const handleToggleSelectAll = () => {
    if (selectedIndices.size === suggestions.length && suggestions.length > 0) {
      setSelectedIndexes(new Set());
    } else {
      setSelectedIndexes(new Set(suggestions.map((_, index) => index)));
    }
  };

  const handleConfirmAdd = () => {
    const selectedItems = suggestions.filter((_, index) => selectedIndices.has(index));
    if (selectedItems.length > 0) {
      onAddItems(selectedItems);
    }
  };

  const resetAiForm = () => {
    setView('form');
    setSuggestions([]);
    setSelectedIndexes(new Set());
    setError(null);
  };

  const buttonBaseClasses = 'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const inputClasses = "w-full p-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-0 transition-colors";


  if (view === 'confirm') {
    return (
      <div className="px-6 pb-6 pt-12 max-h-[80vh] flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 mb-2">AI Suggestions</h2>
        <p className="text-sm text-slate-500 mb-4">Review the items generated by AI. Select the ones you want to add to your schedule.</p>

        <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-200 mb-2">
          <input
            type="checkbox"
            id="select-all"
            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            checked={selectedIndices.size === suggestions.length && suggestions.length > 0}
            onChange={handleToggleSelectAll}
            aria-label="Select all items"
          />
          <label htmlFor="select-all" className="font-semibold text-slate-700 cursor-pointer">Select All</label>
        </div>

        <ul className="space-y-3 overflow-y-auto flex-grow pr-2 -mr-2">
          {suggestions.map((item, index) => (
            <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-300 transition-colors">
              <input
                type="checkbox"
                id={`item-${index}`}
                className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-1 flex-shrink-0 cursor-pointer"
                checked={selectedIndices.has(index)}
                onChange={() => handleToggleSelection(index)}
                aria-labelledby={`item-title-${index}`}
              />
              <label htmlFor={`item-${index}`} className="flex-grow cursor-pointer">
                <p id={`item-title-${index}`} className="font-semibold text-slate-800">{item.title}</p>
                {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5"><Icon name="calendar_today" className="text-sm" /> {item.date}</span>
                  {item.time && <span className="flex items-center gap-1.5"><Icon name="schedule" className="text-sm" /> {item.time} {item.endTime ? `- ${item.endTime}` : ''}</span>}
                </div>
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex gap-4 pt-4 border-t border-slate-200">
          <button onClick={resetAiForm} className={`${buttonBaseClasses} bg-slate-200 text-slate-700 hover:bg-slate-300`}>
            Back
          </button>
          <button
            onClick={handleConfirmAdd}
            disabled={selectedIndices.size === 0}
            className={`${buttonBaseClasses} bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300`}
          >
            Add {selectedIndices.size} Selected
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 pt-12">
      {!editingItem && (
        <div className="flex border border-slate-200 rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode('ai')}
            className={`w-1/2 rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mode === 'ai' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Icon name="auto_awesome" /> Add with AI
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`w-1/2 rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mode === 'manual' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Icon name="edit" /> Add Manually
          </button>
        </div>
      )}

      {error && <div className="bg-red-100 border border-red-300 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}

      {mode === 'ai' ? (
        <form onSubmit={handleAiSubmit}>
          <label htmlFor="ai-prompt" className="sr-only">Describe your task...</label>
          <div className="relative">
            <input
              id="ai-prompt"
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={aiPlaceholder}
              className="w-full pl-4 pr-12 py-3 text-slate-800 bg-slate-100 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-0 transition"
              disabled={isLoading}
              autoComplete="off"
            />
            <div className="absolute inset-y-0 right-3 flex items-center text-slate-400">
              <Icon name="prompt_suggestion" />
            </div>
          </div>
          <button type="submit" className={`${buttonBaseClasses} mt-4 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed`} disabled={isLoading || !aiPrompt.trim()}>
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Parsing...</span>
              </>
            ) : (
              <>
                <Icon name="add_circle" />
                <span>Add Item</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-600 mb-1">Title</label>
              <input type="text" id="title" ref={titleInputRef} value={title} onChange={e => setTitle(e.target.value)} className={inputClasses} required />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-600 mb-1">Date</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  if (selectedDate) {
                    const year = parseInt(selectedDate.split('-')[0]);
                    if (year > 2999) {
                      setError('Year cannot exceed 2999');
                      setTimeout(() => setError(null), 3000);
                      return;
                    }
                  }
                  setDate(selectedDate);
                }}
                max="2999-12-31"
                className={inputClasses}
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">Description (Optional)</label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inputClasses}></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-slate-600 mb-1">Start Time (Optional)</label>
              <input
                type="time"
                id="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  if (!e.target.value && endTime) {
                    setEndTime('');
                    setError('End time cleared because start time was removed.');
                    setTimeout(() => setError(null), 3000);
                  }
                }}
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-slate-600 mb-1">End Time (Optional)</label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClasses}
                disabled={!time}
                title={!time ? "Please set a start time first" : ""}
              />
            </div>
          </div>

          <button type="submit" className={`${buttonBaseClasses} bg-slate-800 text-white hover:bg-slate-900`}>
            <Icon name={editingItem ? "check" : "add"} />
            <span>{editingItem ? 'Update' : 'Add Manually'}</span>
          </button>
        </form>
      )}
    </div>
  );
};

export default AddItemForm;