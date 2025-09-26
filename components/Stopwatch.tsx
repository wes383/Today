import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

interface StopwatchProps {
    onSessionComplete: (durationInSeconds: number, tag: string | null) => void;
    onIsActiveChange?: (isActive: boolean) => void;
}

const Stopwatch: React.FC<StopwatchProps> = ({ onSessionComplete, onIsActiveChange }) => {
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [timeSpentInSession, setTimeSpentInSession] = useState(0);

    const [tags, setTags] = useState<string[]>(() => {
        try {
            const savedTags = localStorage.getItem('focusTags');
            return savedTags ? JSON.parse(savedTags) : ['Work', 'Study', 'Reading'];
        } catch {
            return ['Work', 'Study', 'Reading'];
        }
    });
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);
    const [newTag, setNewTag] = useState('');

    const timerId = useRef<number | null>(null);
    const tagSelectorRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        onIsActiveChange?.(isActive);
    }, [isActive, onIsActiveChange]);

    useEffect(() => {
        if (isActive) {
            timerId.current = window.setInterval(() => {
                setSecondsElapsed(prev => prev + 1);
                setTimeSpentInSession(prev => prev + 1);
            }, 1000);
        } else if (timerId.current) {
            clearInterval(timerId.current);
            timerId.current = null;
        }

        return () => {
            if (timerId.current) {
                clearInterval(timerId.current);
            }
        };
    }, [isActive]);

    useEffect(() => {
        document.title = isActive ? `Stopwatch: ${formatTime(secondsElapsed)}` : 'Today';
    }, [secondsElapsed, isActive]);
    
    useEffect(() => {
        try {
            localStorage.setItem('focusTags', JSON.stringify(tags));
        } catch (error: any) {
            console.error("Failed to save tags to localStorage", error);
        }
    }, [tags]);

    useEffect(() => {
        if (!isTagSelectorOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (tagSelectorRef.current && !tagSelectorRef.current.contains(event.target as Node)) {
                setIsTagSelectorOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isTagSelectorOpen]);

    const handleStartPause = () => {
        if (isActive) { // Pausing
            if (timeSpentInSession > 0) {
                onSessionComplete(timeSpentInSession, selectedTag);
            }
            setTimeSpentInSession(0); // Reset for next segment
        }
        setIsActive(!isActive);
    };

    const handleFinish = () => {
        if (timerId.current) clearInterval(timerId.current);
        
        if (timeSpentInSession > 0) {
            onSessionComplete(timeSpentInSession, selectedTag);
        }
        
        setIsActive(false);
        setSecondsElapsed(0);
        setTimeSpentInSession(0);
    };

    const formatTime = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        
        const parts = [
            String(minutes).padStart(2, '0'),
            String(secs).padStart(2, '0')
        ];
        
        if (hours > 0) {
            parts.unshift(String(hours).padStart(2, '0'));
        }

        return parts.join(':');
    };

    const handleAddNewTag = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTag = newTag.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            const updatedTags = [...tags, trimmedTag];
            setTags(updatedTags);
            setSelectedTag(trimmedTag);
            setNewTag('');
            setIsTagSelectorOpen(false);
        }
    };
    
    const handleDeleteTag = (tagToDelete: string) => {
        const updatedTags = tags.filter(tag => tag !== tagToDelete);
        setTags(updatedTags);
        if (selectedTag === tagToDelete) {
            setSelectedTag(null);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 animate-[fade-in_0.3s_ease-out]">
            <div className="relative w-72 h-72 mx-auto my-8 flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="text-6xl font-bold text-center text-slate-800 tabular-nums">
                        {formatTime(secondsElapsed)}
                    </div>

                    <div className="absolute bottom-[20%]" ref={tagSelectorRef}>
                        <button
                            onClick={() => !isActive && setIsTagSelectorOpen(prev => !prev)}
                            disabled={isActive}
                            className={`bg-slate-100 text-slate-600 rounded-full text-sm font-semibold flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 ${selectedTag ? 'gap-2' : ''}`}
                            aria-haspopup="true"
                            aria-expanded={isTagSelectorOpen}
                            aria-label={selectedTag || 'Select Tag'}
                        >
                            <Icon name="label" className="text-lg" />
                            {selectedTag && (
                                <span className="truncate max-w-[120px]" title={selectedTag}>{selectedTag}</span>
                            )}
                        </button>

                        {isTagSelectorOpen && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-30 animate-[fade-in_0.1s_ease-out]">
                                <ul className="max-h-64 overflow-y-auto pr-1">
                                    <li className="rounded-md hover:bg-slate-100">
                                        <button
                                            onClick={() => { setSelectedTag(null); setIsTagSelectorOpen(false); }}
                                            className="w-full text-left px-3 py-1.5 text-slate-500"
                                        >
                                            No Tag
                                        </button>
                                    </li>
                                    {tags.length > 0 && <li className="h-px bg-slate-200 my-1 mx-2"></li>}
                                    {tags.map(tag => (
                                        <li key={tag} className="flex items-center justify-between group rounded-md hover:bg-slate-100">
                                            <button 
                                                onClick={() => { setSelectedTag(tag); setIsTagSelectorOpen(false); }}
                                                className="w-full text-left px-3 py-1.5 truncate"
                                                title={tag}
                                            >
                                                {tag}
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteTag(tag)} 
                                                className="flex-shrink-0 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 mr-1"
                                                aria-label={`Delete tag: ${tag}`}
                                            >
                                                <Icon name="delete" className="text-sm" />
                                            </button>
                                        </li>
                                    ))}
                                    {tags.length === 0 && <li className="text-center text-slate-400 text-sm py-2">No tags yet.</li>}
                                </ul>
                                
                                <form onSubmit={handleAddNewTag} className="mt-2 pt-2 border-t border-slate-200">
                                    <input 
                                        type="text" 
                                        value={newTag}
                                        onChange={e => setNewTag(e.target.value)}
                                        placeholder="New tag (Enter to add)"
                                        maxLength={16}
                                        className="w-full p-1.5 border border-slate-300 rounded-lg text-sm focus:ring-0 focus:outline-none transition-colors"
                                    />
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
                <button 
                    onClick={handleStartPause} 
                    className="w-16 h-16 flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus:outline-none focus:ring-0 bg-green-500 text-white hover:bg-green-600"
                    aria-label={isActive ? 'Pause stopwatch' : 'Start stopwatch'}
                >
                    <Icon name={isActive ? 'pause' : 'play_arrow'} className="text-3xl" />
                </button>
                <button 
                    onClick={handleFinish} 
                    className="w-16 h-16 flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus:outline-none focus:ring-0 bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Finish and save session"
                    disabled={secondsElapsed === 0 && !isActive}
                >
                    <Icon name="stop" className="text-3xl" />
                </button>
            </div>
        </div>
    );
};

export default Stopwatch;