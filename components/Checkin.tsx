import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

interface Theme {
  id: string;
  name: string;
}

interface CheckinData {
  [themeId: string]: {
    [date: string]: boolean;
  };
}

interface CheckinProps {
    setConfirmModal: React.Dispatch<React.SetStateAction<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        iconName?: string;
        iconBgClass?: string;
        iconColorClass?: string;
        confirmBtnClass?: string;
    }>>;
}

const initialThemes: Theme[] = [
  { id: 'workout', name: 'Workout' },
  { id: 'study', name: 'Study' },
  { id: 'read', name: 'Reading' },
];

const Checkin: React.FC<CheckinProps> = ({ setConfirmModal }) => {
  const [themes, setThemes] = useState<Theme[]>(() => {
    try {
      const saved = localStorage.getItem('checkinThemes');
      return saved ? JSON.parse(saved) : initialThemes;
    } catch {
      return initialThemes;
    }
  });

  const [checkinData, setCheckinData] = useState<CheckinData>(() => {
    try {
      const saved = localStorage.getItem('checkinData');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedThemeId, setSelectedThemeId] = useState(themes[0]?.id || '');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isMonthHeaderHovered, setIsMonthHeaderHovered] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const themeSelectorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem('checkinThemes', JSON.stringify(themes));
  }, [themes]);

  useEffect(() => {
    localStorage.setItem('checkinData', JSON.stringify(checkinData));
  }, [checkinData]);

  useEffect(() => {
    if (!isThemeSelectorOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
        if (themeSelectorRef.current && !themeSelectorRef.current.contains(event.target as Node)) {
            setIsThemeSelectorOpen(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isThemeSelectorOpen]);

  const handleAddNewTheme = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newThemeName.trim();
    if (trimmedName) {
        const newTheme: Theme = {
            id: `${new Date().getTime()}`,
            name: trimmedName,
        };
        const updatedThemes = [...themes, newTheme];
        setThemes(updatedThemes);
        setSelectedThemeId(newTheme.id);
        setNewThemeName('');
        setIsThemeSelectorOpen(false);
    }
  };

  const handleDeleteTheme = (themeIdToDelete: string) => {
    if (themes.length <= 1) {
        setConfirmModal({
            isOpen: true,
            title: 'Cannot Delete Last Theme',
            message: 'You must have at least one theme.',
            onConfirm: () => {},
            iconName: 'warning',
            iconBgClass: 'bg-yellow-100',
            iconColorClass: 'text-yellow-600',
            confirmBtnClass: 'bg-yellow-600 hover:bg-yellow-700'
        });
        return;
    }

    const themeToDelete = themes.find(theme => theme.id === themeIdToDelete);
    if (!themeToDelete) return;

    setConfirmModal({
        isOpen: true,
        title: `Delete "${themeToDelete.name}"?`,
        message: 'Are you sure? All check-in data for this theme will be permanently deleted.',
        onConfirm: () => {
            const updatedThemes = themes.filter(theme => theme.id !== themeIdToDelete);
            setThemes(updatedThemes);

            setCheckinData(prev => {
                const newData = { ...prev };
                delete newData[themeIdToDelete];
                return newData;
            });

            if (selectedThemeId === themeIdToDelete) {
                setSelectedThemeId(updatedThemes[0]?.id || '');
            }
        },
        iconName: 'delete',
        iconBgClass: 'bg-red-100',
        iconColorClass: 'text-red-600',
        confirmBtnClass: 'bg-red-600 hover:bg-red-700'
    });
  };

  const handleToggleCheckin = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    setCheckinData(prev => {
      const newThemeData = { ...(prev[selectedThemeId] || {}) };
      newThemeData[dateString] = !newThemeData[dateString];
      return {
        ...prev,
        [selectedThemeId]: newThemeData,
      };
    });
  };

  const requestToggleCheckin = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const isChecked = checkinData[selectedThemeId]?.[dateString];
    
    setConfirmModal({
        isOpen: true,
        title: isChecked ? 'Cancel Check-in?' : 'Confirm Check-in?',
        message: `Are you sure you want to ${isChecked ? 'cancel your check-in for' : 'check in for'} ${date.toLocaleDateString('en-US')}?`,
        onConfirm: () => handleToggleCheckin(date),
        iconName: 'check',
        iconBgClass: 'bg-green-100',
        iconColorClass: 'text-green-600',
        confirmBtnClass: 'bg-teal-600 hover:bg-teal-700',
    });
  };

  const calculateStreak = () => {
    const themeCheckins = checkinData[selectedThemeId] || {};
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    // If today is not checked in, start checking from yesterday.
    // Otherwise, the loop will start from today, including it in the streak.
    if (!themeCheckins[checkDate.toISOString().split('T')[0]]) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (themeCheckins[checkDate.toISOString().split('T')[0]]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  };

  const renderCalendar = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const themeCheckins = checkinData[selectedThemeId] || {};

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to midnight for accurate date comparison

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      dayDate.setHours(0,0,0,0); // Normalize day date for comparison
      
      const dateString = dayDate.toISOString().split('T')[0];
      const isChecked = themeCheckins[dateString];
      
      const isToday = dayDate.getTime() === today.getTime();
      const isFuture = dayDate > today;

      let buttonClasses = 'w-10 h-10 rounded-lg flex items-center justify-center font-semibold transition-all duration-200';

      if (isFuture) {
          buttonClasses += ' bg-slate-50 text-slate-300 cursor-not-allowed';
      } else if (isChecked) {
          buttonClasses += ' bg-teal-500 text-white scale-105 shadow-md';
      } else {
          buttonClasses += ' bg-slate-100 text-slate-600 hover:bg-slate-200';
      }

      if (isToday && !isChecked && !isFuture) {
          buttonClasses += ' ring-2 ring-teal-500';
      }

      days.push(
        <div key={i} className="flex justify-center items-center">
          <button
            onClick={() => requestToggleCheckin(dayDate)}
            disabled={isFuture}
            className={buttonClasses}
          >
            {i}
          </button>
        </div>
      );
    }
    return <div className="grid grid-cols-7 gap-1">{days}</div>;
  };

  const selectedTheme = themes.find(t => t.id === selectedThemeId);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row justify-end sm:items-center gap-4 mb-6">
        <div className="relative" ref={themeSelectorRef}>
            <button
                onClick={() => setIsThemeSelectorOpen(prev => !prev)}
                className="bg-slate-100 text-slate-600 rounded-full text-sm font-semibold flex items-center justify-center hover:bg-slate-200 transition-colors px-4 py-2 gap-2"
                aria-haspopup="true"
                aria-expanded={isThemeSelectorOpen}
            >
                <span>{selectedTheme?.name || 'Select Theme'}</span>
            </button>

            {isThemeSelectorOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-30 animate-[fade-in_0.1s_ease-out]">
                    <ul className="max-h-48 overflow-y-auto">
                        {themes.map(theme => (
                            <li key={theme.id} className="flex items-center justify-between group rounded-md hover:bg-slate-100">
                                <button 
                                    onClick={() => { setSelectedThemeId(theme.id); setIsThemeSelectorOpen(false); }}
                                    className={`w-full text-left px-3 py-2 truncate flex items-center gap-3 ${selectedThemeId === theme.id ? 'font-semibold text-indigo-600' : 'font-medium'}`}
                                    title={theme.name}
                                >
                                    <span>{theme.name}</span>
                                </button>
                                <button 
                                    onClick={() => handleDeleteTheme(theme.id)} 
                                    className="flex-shrink-0 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 mr-1"
                                    aria-label={`Delete theme: ${theme.name}`}
                                >
                                    <Icon name="delete" className="text-sm" />
                                </button>
                            </li>
                        ))}
                    </ul>
                    
                    <form onSubmit={handleAddNewTheme} className="mt-2 pt-2 border-t border-slate-200">
                        <p className="font-semibold text-sm text-slate-600 px-1 mb-2">Add New Theme</p>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newThemeName}
                                onChange={e => setNewThemeName(e.target.value)}
                                placeholder="e.g. Meditate"
                                maxLength={20}
                                className="flex-grow p-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                            />
                        </div>
                         <button type="submit" className="w-full mt-2 bg-indigo-600 text-white font-semibold text-sm p-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50" disabled={!newThemeName.trim()}>
                            Add Theme
                        </button>
                    </form>
                </div>
            )}
        </div>
      </div>

      <div className="text-center mb-6 p-4 bg-slate-50 rounded-xl">
        <p className="text-slate-600">Current Streak</p>
        <p className="text-5xl font-bold text-teal-500">{calculateStreak()}</p>
        <p className="text-slate-500">days</p>
      </div>

      <div className="max-w-xs mx-auto">
        <div className="mb-4 flex justify-between items-center">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 rounded-full text-slate-500 hover:text-slate-800"><Icon name="chevron_left" /></button>
            
            <div className="flex-grow text-center">
                {(() => {
                    const now = new Date();
                    const isCurrentMonthView = currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() === now.getMonth();

                    return (
                        <div
                            onMouseEnter={() => !isCurrentMonthView && setIsMonthHeaderHovered(true)}
                            onMouseLeave={() => !isCurrentMonthView && setIsMonthHeaderHovered(false)}
                            onClick={() => !isCurrentMonthView && setCurrentDate(new Date())}
                            className={`relative inline-block text-lg font-semibold px-3 py-1 rounded-md transition-colors ${!isCurrentMonthView ? 'cursor-pointer text-slate-600 hover:bg-slate-100' : 'text-slate-700'}`}
                        >
                            <span className="opacity-0">
                                {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                            <span className="absolute inset-0 flex items-center justify-center">
                                {isMonthHeaderHovered && !isCurrentMonthView
                                    ? 'Today'
                                    : currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    );
                })()}
            </div>

            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 rounded-full text-slate-500 hover:text-slate-800"><Icon name="chevron_right" /></button>
        </div>

        {renderCalendar()}
      </div>
      
      {/* TODO: Add theme management UI */}
    </div>
  );
};

export default Checkin;