import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

interface FocusTimerProps {
    initialDuration?: number | null;
    onSessionComplete: (durationInSeconds: number, tag: string | null) => void;
    onIsActiveChange?: (isActive: boolean) => void;
}

const FocusTimer: React.FC<FocusTimerProps> = ({ initialDuration, onSessionComplete, onIsActiveChange }) => {
    const [duration, setDuration] = useState(initialDuration ?? 25 * 60); // Default 25 minutes
    const [secondsLeft, setSecondsLeft] = useState(initialDuration ?? 25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [editTimeValue, setEditTimeValue] = useState('');
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
    const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
    const timeInputRef = useRef<HTMLInputElement | null>(null);
    const tagSelectorRef = useRef<HTMLDivElement | null>(null);

    // Effect for handling the timer countdown
    useEffect(() => {
        onIsActiveChange?.(isActive);
    }, [isActive, onIsActiveChange]);

    useEffect(() => {
        if (isActive && secondsLeft > 0) {
            timerId.current = window.setInterval(() => {
                setSecondsLeft(prev => prev - 1);
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
    }, [isActive, secondsLeft]);

    // Effect for handling timer completion and document title
    useEffect(() => {
        if (secondsLeft === 0 && isActive) {
            setIsActive(false);
            if (timeSpentInSession > 0) {
                onSessionComplete(timeSpentInSession, selectedTag);
            }
            setTimeSpentInSession(0);
            notificationAudioRef.current?.play().catch(e => console.error("Audio playback failed:", e));
        }
        if (!isEditingTime) {
            document.title = isActive ? `Focus: ${formatTime(secondsLeft)}` : 'Today';
        }
    }, [secondsLeft, isActive, isEditingTime, onSessionComplete, selectedTag, timeSpentInSession]);
    
    // Preload audio
    useEffect(() => {
        notificationAudioRef.current = new Audio('/clock.wav');
        notificationAudioRef.current.preload = 'auto';
    }, []);
    
    // Focus input when editing starts
    useEffect(() => {
        if (isEditingTime) {
            setEditTimeValue(formatTime(secondsLeft));
            const timer = setTimeout(() => {
                timeInputRef.current?.focus();
                timeInputRef.current?.select();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isEditingTime, secondsLeft]);
    
    // Save tags to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('focusTags', JSON.stringify(tags));
        } catch (error: any) {
            console.error("Failed to save tags to localStorage", error);
        }
    }, [tags]);

    // Handle closing tag selector on outside click
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
        if (isEditingTime) setIsEditingTime(false);
        if (isTagSelectorOpen) setIsTagSelectorOpen(false);

        if (isActive) { // Pausing
            if (timeSpentInSession > 0) {
                onSessionComplete(timeSpentInSession, selectedTag);
            }
            setTimeSpentInSession(0); // Reset for the next session segment
        } else { // Starting
            if (secondsLeft === 0) {
                setSecondsLeft(duration);
            }
        }
        setIsActive(!isActive);
    };

    const handleReset = () => {
        if(timerId.current) clearInterval(timerId.current);
        if (isActive && timeSpentInSession > 0) {
            onSessionComplete(timeSpentInSession, selectedTag);
        }
        setIsActive(false);
        setIsEditingTime(false);
        setSecondsLeft(duration);
        setTimeSpentInSession(0);
    };
    
    const selectDurationInSeconds = (newSeconds: number) => {
        if (timerId.current) clearInterval(timerId.current);
        setIsActive(false);
        setDuration(newSeconds);
        setSecondsLeft(newSeconds);
        setTimeSpentInSession(0);
    };

    const selectDuration = (minutes: number) => {
        selectDurationInSeconds(minutes * 60);
    }

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    
    const handleTimeEditCommit = () => {
        const parts = editTimeValue.split(':').map(val => parseInt(val, 10));
        let newSeconds = 0;

        if (parts.length === 1 && !isNaN(parts[0])) {
            newSeconds = parts[0] * 60; // Treat single number as minutes
        } else if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            newSeconds = parts[0] * 60 + parts[1];
        } else {
            setIsEditingTime(false);
            return;
        }
        
        newSeconds = Math.max(0, Math.min(newSeconds, 999 * 60)); // Clamp between 0 and 999 mins
        selectDurationInSeconds(newSeconds);
        setIsEditingTime(false);
    };

    const handleInputWheel = (e: React.WheelEvent<HTMLInputElement>) => {
        e.preventDefault();

        const parts = editTimeValue.split(':').map(val => parseInt(val, 10));
        let currentSeconds = 0;

        if (parts.length === 1 && !isNaN(parts[0])) {
            currentSeconds = parts[0] * 60; // Treat single number as minutes
        } else if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            currentSeconds = parts[0] * 60 + parts[1];
        } else {
            return; // Cannot parse, do nothing
        }

        const change = 300; // Adjust by 5 minutes
        let newSeconds = e.deltaY < 0
            ? currentSeconds + change // Scroll up to increase
            : currentSeconds - change; // Scroll down to decrease
        
        newSeconds = Math.max(0, Math.min(newSeconds, 999 * 60)); // Clamp between 0 and 999 mins

        setEditTimeValue(formatTime(newSeconds));
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

    const activePresetClasses = 'bg-slate-100 text-slate-600';
    const inactivePresetClasses = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
    const basePresetClasses = 'px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    const svgSize = 288; // 72 w-scale
    const radius = 130;
    const strokeWidth = 16;
    const circumference = 2 * Math.PI * radius;
    const progress = duration > 0 ? secondsLeft / duration : 0;
    const offset = circumference * (1 - progress);


    return (
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 animate-[fade-in_0.3s_ease-out]">
            <div className="flex justify-center gap-2 mb-6">
                <button onClick={() => selectDuration(25)} className={`${basePresetClasses} ${duration === 25 * 60 && !isEditingTime ? activePresetClasses : inactivePresetClasses}`} disabled={isActive}>25 min</button>
                <button onClick={() => selectDuration(45)} className={`${basePresetClasses} ${duration === 45 * 60 && !isEditingTime ? activePresetClasses : inactivePresetClasses}`} disabled={isActive}>45 min</button>
                <button onClick={() => selectDuration(60)} className={`${basePresetClasses} ${duration === 60 * 60 && !isEditingTime ? activePresetClasses : inactivePresetClasses}`} disabled={isActive}>60 min</button>
                <button onClick={() => selectDuration(90)} className={`${basePresetClasses} ${duration === 90 * 60 && !isEditingTime ? activePresetClasses : inactivePresetClasses}`} disabled={isActive}>90 min</button>
            </div>

            <div 
                className="relative w-72 h-72 mx-auto my-8 flex items-center justify-center rounded-full"
                role="timer"
                aria-live="off"
            >
                <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="absolute transform -rotate-90">
                    <circle
                        className="text-slate-200"
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        r={radius}
                        cx={svgSize / 2}
                        cy={svgSize / 2}
                    />
                    <circle
                        className="text-purple-400"
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.3s linear' }}
                        r={radius}
                        cx={svgSize / 2}
                        cy={svgSize / 2}
                    />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    {isEditingTime ? (
                        <input
                            ref={timeInputRef}
                            type="text"
                            value={editTimeValue}
                            onChange={(e) => setEditTimeValue(e.target.value)}
                            onBlur={handleTimeEditCommit}
                            onKeyDown={(e) => e.key === 'Enter' && handleTimeEditCommit()}
                            onWheel={handleInputWheel}
                            className="w-56 bg-transparent text-6xl font-bold text-center text-slate-800 z-20 outline-none border-b-2 border-slate-400 focus:border-purple-500 p-0 transition-colors"
                        />
                    ) : (
                        <div 
                            className={`text-6xl font-bold text-center text-slate-800 transition-opacity ${!isActive ? 'cursor-pointer' : ''}`}
                            onClick={() => !isActive && !isEditingTime && setIsEditingTime(true)}
                            title={!isActive ? "Click to edit time" : undefined}
                        >
                            {formatTime(secondsLeft)}
                        </div>
                    )}

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
                                <ul className="max-h-64 overflow-y-auto">
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
                    className="w-16 h-16 flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus:outline-none focus:ring-0 bg-purple-400 text-white hover:bg-purple-500"
                    aria-label={isActive ? 'Pause timer' : 'Start timer'}
                >
                    <Icon name={isActive ? 'pause' : 'play_arrow'} className="text-3xl" />
                </button>
                <button 
                    onClick={handleReset} 
                    className="w-16 h-16 flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus:outline-none focus:ring-0 bg-slate-200 text-slate-700 hover:bg-slate-300"
                    aria-label="Reset timer"
                >
                    <Icon name="restart_alt" className="text-3xl" />
                </button>
            </div>
        </div>
    );
};

export default FocusTimer;