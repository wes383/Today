import React, { useState, useEffect, useRef } from 'react';
import type { ScheduleItem, ScheduleItemData, FilterType, FocusSession } from './types';
import Header from './components/Header';
import AddItemForm from './components/AddItemForm';
import FilterToggle from './components/FilterToggle';
import ScheduleList from './components/ScheduleList';
import Icon from './components/Icon';
import ChatModal from './components/ChatModal';
import FocusTimer from './components/FocusTimer';
import FocusStats from './components/FocusStats';
import Stopwatch from './components/Stopwatch';
import ConfirmModal from './components/ConfirmModal';
import Checkin from './components/Checkin';

// Helper function to get a date string for tomorrow
const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
};

const INITIAL_SCHEDULE: ScheduleItem[] = [
    {
        id: '1',
        title: 'Project Stand-up Meeting',
        description: 'Discuss progress on the new dashboard feature.',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        endTime: '09:30',
        category: 'work',
        completed: false,
    },
    {
        id: '6',
        title: 'Learn React Hooks',
        description: 'Focus on useEffect and useState.',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        endTime: '11:30',
        category: 'study',
        completed: false,
    },
    {
        id: '2',
        title: 'Dentist Appointment',
        description: 'Annual check-up.',
        date: new Date().toISOString().split('T')[0],
        time: '14:30',
        endTime: null,
        category: 'health',
        completed: false,
    },
    {
        id: '3',
        title: 'Go to the gym',
        description: 'Leg day workout.',
        date: new Date().toISOString().split('T')[0],
        time: '18:00',
        endTime: null,
        category: 'fitness',
        completed: true,
    },
    {
        id: '4',
        title: 'Meet friends for dinner',
        description: null,
        date: getTomorrowDateString(),
        time: '19:30',
        endTime: null,
        category: 'social',
        completed: false,
    },
    {
        id: '5',
        title: 'Book flights to Bali',
        description: 'Find good deals for the holidays.',
        date: getTomorrowDateString(),
        time: null, // all-day
        endTime: null,
        category: 'travel',
        completed: false,
    }
];

const App: React.FC = () => {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(() => {
    try {
      const savedItems = localStorage.getItem('scheduleItems');
      return savedItems ? JSON.parse(savedItems) : INITIAL_SCHEDULE;
    } catch (error) {
      console.error("Failed to parse schedule items from localStorage", error);
      return INITIAL_SCHEDULE;
    }
  });

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    try {
      const savedSessions = localStorage.getItem('focusSessions');
      return savedSessions ? JSON.parse(savedSessions) : [];
    } catch (error) {
      console.error("Failed to parse focus sessions from localStorage", error);
      return [];
    }
  });
  
  const [filter, setFilter] = useState<FilterType | null>('today');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFocusTimerActive, setIsFocusTimerActive] = useState(false);
  const [isStopwatchActive, setIsStopwatchActive] = useState(false);
  const [isStatsViewActive, setIsStatsViewActive] = useState(false);
  const [isCheckinViewActive, setIsCheckinViewActive] = useState(false);
  const [focusDuration, setFocusDuration] = useState<number | null>(null);
  const [isTimerInternallyActive, setIsTimerInternallyActive] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    iconName?: string;
    iconBgClass?: string;
    iconColorClass?: string;
    confirmBtnClass?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });


  useEffect(() => {
    try {
      localStorage.setItem('scheduleItems', JSON.stringify(scheduleItems));
    } catch (error) {
      console.error("Failed to save schedule items to localStorage", error);
    }
  }, [scheduleItems]);

  useEffect(() => {
    try {
      localStorage.setItem('focusSessions', JSON.stringify(focusSessions));
    } catch (error) {
      console.error("Failed to save focus sessions to localStorage", error);
    }
  }, [focusSessions]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isTimerInternallyActive) {
            e.preventDefault();
            e.returnValue = 'A timer is running. Are you sure you want to leave?';
            return 'A timer is running. Are you sure you want to leave?';
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isFocusTimerActive, isStopwatchActive]);

  useEffect(() => {
    // Exit edit mode if the user clicks outside of a delete button or the edit button
    if (!isEditMode) return;

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        // Don't exit if clicking the edit/done toggle button
        if (target.closest('[data-role="edit-button"]')) return;
        // Don't exit if clicking a floating action button
        if (target.closest('[data-role="fab"]')) return;
        // Don't exit if clicking a delete button
        if (target.closest('[data-role="delete-button"]')) return;
        // Don't exit if clicking inside the modal
        if (target.closest('[role="dialog"]')) return;

        setIsEditMode(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
}, [isEditMode]);

  const handleAddItems = (itemsData: ScheduleItemData[]) => {
    const newItems: ScheduleItem[] = itemsData.map((itemData, index) => ({
      ...itemData,
      id: `${new Date().getTime()}-${index}`, // Simple unique ID for multiple items
      completed: false,
    }));
    setScheduleItems(prevItems => [...prevItems, ...newItems]);
    setIsModalOpen(false); // Close modal on add
  };

  const handleDeleteItem = (id: string) => {
    setScheduleItems(prevItems => prevItems.filter(item => item.id !== id));
  };
  
  const handleToggleComplete = (id: string) => {
    setScheduleItems(prevItems =>
        prevItems.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        )
    );
  };

  const performViewChange = (change: () => void) => {
    setIsFocusTimerActive(false);
    setIsStopwatchActive(false);
    setIsStatsViewActive(false);
    setIsCheckinViewActive(false);
    setFocusDuration(null);
    setIsTimerInternallyActive(false);
    change();
  };

  const requestViewChange = (change: () => void) => {
    if (isTimerInternallyActive) {
        setConfirmModal({
            isOpen: true,
            title: 'Timer is Running',
            message: 'Are you sure you want to switch? The current timer progress will be lost.',
            onConfirm: () => performViewChange(change),
        });
    } else {
        performViewChange(change);
    }
  };

  const handleFilterChange = (newFilter: FilterType) => {
    requestViewChange(() => setFilter(newFilter));
  };
  
  const handleViewChange = (viewSetter: React.Dispatch<React.SetStateAction<boolean>>, currentViewActive: boolean) => {
    requestViewChange(() => {
        // If clicking an active button, go back to schedule view
        if (currentViewActive) {
            setFilter('today');
        } else {
            // Activating a new view
            viewSetter(true);
            setFilter(null); // De-select schedule filters
        }
    });
  };
  
  const handleStartTimeFocus = (durationInSeconds: number) => {
    requestViewChange(() => {
        setFocusDuration(durationInSeconds);
        setIsFocusTimerActive(true);
    });
  };

  const handleFocusClick = () => {
    handleViewChange(setIsFocusTimerActive, isFocusTimerActive);
  };

  const handleStopwatchClick = () => {
    handleViewChange(setIsStopwatchActive, isStopwatchActive);
  };

  const handleStatsClick = () => {
    handleViewChange(setIsStatsViewActive, isStatsViewActive);
  };

  const handleCheckinClick = () => {
    handleViewChange(setIsCheckinViewActive, isCheckinViewActive);
  };



  const handleAddFocusSession = (durationInSeconds: number, tag: string | null) => {
    const newSession: FocusSession = {
        id: `${new Date().getTime()}`,
        completedAt: new Date().toISOString(),
        duration: durationInSeconds,
        tag,
    };
    setFocusSessions(prev => [...prev, newSession]);
  };


  return (
    <div className={`min-h-screen text-slate-800 antialiased transition-colors duration-500 bg-slate-50`}>
        <main className={`max-w-[888px] mx-auto px-4 py-8 transition-opacity duration-300 opacity-100 ${isFocusTimerActive || isStopwatchActive || isStatsViewActive || isCheckinViewActive ? 'pb-8' : 'pb-24'}`}>
            <Header />
            <div className="my-6 relative">
                {/* Centered Group for filters and actions */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-2">
                    <FilterToggle 
                        currentFilter={filter} 
                        onFilterChange={handleFilterChange}
                        isTimerActive={isFocusTimerActive || isStatsViewActive} 
                    />

                    <div className="p-1 bg-slate-200 rounded-full flex">
                        <button
                            onClick={handleFocusClick}
                            className={`px-5 py-2 rounded-full font-semibold transition-colors duration-200 text-sm ${isFocusTimerActive ? 'bg-purple-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                            aria-pressed={isFocusTimerActive}
                        >
                            Focus
                        </button>
                        <button
                            onClick={handleStopwatchClick}
                            className={`px-5 py-2 rounded-full font-semibold transition-colors duration-200 text-sm ${isStopwatchActive ? 'bg-green-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                            aria-pressed={isStopwatchActive}
                        >
                            Stopwatch
                        </button>
                        <button
                            onClick={handleStatsClick}
                            className={`px-5 py-2 rounded-full font-semibold transition-colors duration-200 text-sm ${isStatsViewActive ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                            aria-pressed={isStatsViewActive}
                        >
                            Stats
                        </button>
                    </div>
                    <div className="p-1 bg-slate-200 rounded-full flex">
                        <button
                            onClick={handleCheckinClick}
                            className={`px-5 py-2 rounded-full font-semibold transition-colors duration-200 text-sm ${isCheckinViewActive ? 'bg-teal-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                            aria-pressed={isCheckinViewActive}
                        >
                            Check
                        </button>
                    </div>
                </div>

                {/* Edit Button - absolutely positioned on all screen sizes */}
                {!isFocusTimerActive && !isStopwatchActive && !isStatsViewActive && !isCheckinViewActive && (
                    <div className="absolute right-[-8px] top-0 md:right-[-8px] md:top-1/2 md:-translate-y-1/2">
                        <button
                            data-role="edit-button"
                            onClick={() => setIsEditMode(!isEditMode)}
                            className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-2 rounded-lg"
                            aria-live="polite"
                        >
                            {isEditMode ? 'Done' : 'Edit'}
                        </button>
                    </div>
                )}
            </div>

            {isFocusTimerActive ? (
                <FocusTimer 
                    initialDuration={focusDuration} 
                    onSessionComplete={handleAddFocusSession} 
                    onIsActiveChange={setIsTimerInternallyActive}
                />
            ) : isStopwatchActive ? (
                <Stopwatch 
                    onSessionComplete={handleAddFocusSession} 
                    onIsActiveChange={setIsTimerInternallyActive}
                />
            ) : isStatsViewActive ? (
                <FocusStats sessions={focusSessions} onDeleteSession={(id) => setFocusSessions(prev => prev.filter(s => s.id !== id))} />
            ) : isCheckinViewActive ? (
                <Checkin setConfirmModal={setConfirmModal} />
            ) : (
                <ScheduleList 
                    items={scheduleItems} 
                    filter={filter} 
                    onDeleteItem={handleDeleteItem} 
                    onToggleComplete={handleToggleComplete} 
                    isEditMode={isEditMode} 
                    onStartTimeFocus={handleStartTimeFocus} 
                />
            )}
        </main>

        <ConfirmModal 
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            onConfirm={confirmModal.onConfirm}
            title={confirmModal.title}
            message={confirmModal.message}
            iconName={confirmModal.iconName}
            iconBgClass={confirmModal.iconBgClass}
            iconColorClass={confirmModal.iconColorClass}
            confirmBtnClass={confirmModal.confirmBtnClass}
        />

        {!isFocusTimerActive && !isStopwatchActive && !isStatsViewActive && !isCheckinViewActive && (
          <>
            <button
              data-role="fab"
              onClick={() => setIsChatModalOpen(true)}
              className={`fixed bottom-8 left-8 bg-white text-purple-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 z-30 md:flex ${isEditMode ? 'flex' : 'hidden'}`}
              aria-label="Ask AI about your schedule"
            >
              <Icon name="fiber_manual_record" className="text-3xl" />
            </button>

            <button
              data-role="fab"
              onClick={() => setIsModalOpen(true)}
              className={`fixed bottom-8 right-8 bg-white text-indigo-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 z-30 md:flex ${isEditMode ? 'flex' : 'hidden'}`}
              aria-label="Add new schedule item"
            >
              <Icon name="add" className="text-3xl" />
            </button>
          </>
        )}

        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex justify-center items-center transition-opacity duration-300 animate-[fade-in_0.2s_ease-out]"
            onClick={() => setIsModalOpen(false)}
            aria-modal="true"
            role="dialog"
          >
            <div 
              className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg m-4"
              onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              <AddItemForm onAddItems={handleAddItems} scheduleItems={scheduleItems} />
              
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close add item form"
              >
                <Icon name="close" />
              </button>
            </div>
          </div>
        )}

        {isChatModalOpen && (
            <ChatModal 
                isOpen={isChatModalOpen} 
                onClose={() => setIsChatModalOpen(false)} 
                scheduleItems={scheduleItems} 
            />
        )}
    </div>
  );
};

export default App;