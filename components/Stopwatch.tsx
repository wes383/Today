import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import DraggableTagList from './DraggableTagList';

interface StopwatchProps {
    onSessionComplete: (durationInSeconds: number, tag: string | null) => void;
    onIsActiveChange?: (isActive: boolean) => void;
    onConfirmAction?: (title: string, message: string, onConfirm: () => void) => void;
}

const Stopwatch: React.FC<StopwatchProps> = ({ onSessionComplete, onIsActiveChange, onConfirmAction }) => {
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
        if (isActive) {
            if (timeSpentInSession > 0) {
                onSessionComplete(timeSpentInSession, selectedTag);
            }
            setTimeSpentInSession(0);
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

    const handleAddNewTag = (tagName: string) => {
        const updatedTags = [...tags, tagName];
        setTags(updatedTags);
        setSelectedTag(tagName);
        setIsTagSelectorOpen(false);
    };

    const handleDeleteTag = (tagToDelete: string) => {
        if (onConfirmAction) {
            onConfirmAction(
                'Delete Tag?',
                `Are you sure you want to delete "${tagToDelete}"? This action cannot be undone.`,
                () => {
                    const updatedTags = tags.filter(tag => tag !== tagToDelete);
                    setTags(updatedTags);
                    if (selectedTag === tagToDelete) {
                        setSelectedTag(null);
                    }
                }
            );
        } else {
            const updatedTags = tags.filter(tag => tag !== tagToDelete);
            setTags(updatedTags);
            if (selectedTag === tagToDelete) {
                setSelectedTag(null);
            }
        }
    };

    const handleTagsReorder = (newTags: string[]) => {
        setTags(newTags);
    };

    const handleTagSelect = (tag: string | null) => {
        setSelectedTag(tag);
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
                            <DraggableTagList
                                tags={tags}
                                selectedTag={selectedTag}
                                onTagSelect={handleTagSelect}
                                onTagsReorder={handleTagsReorder}
                                onTagDelete={handleDeleteTag}
                                onAddNewTag={handleAddNewTag}
                                onClose={() => setIsTagSelectorOpen(false)}
                                buttonColor="green"
                            />
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