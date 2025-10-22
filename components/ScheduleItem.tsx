import React, { useState, useEffect } from 'react';
import type { ScheduleItem, FilterType } from '../types';
import Icon from './Icon';

interface ScheduleItemProps {
  item: ScheduleItem;
  onDeleteItem: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onEditItem: (id: string) => void;
  isEditMode: boolean;
  showDate: boolean;
  onStartTimeFocus: (durationInSeconds: number) => void;
  filter: FilterType;
}

const ScheduleItemComponent: React.FC<ScheduleItemProps> = ({ item, onDeleteItem, onToggleComplete, onEditItem, isEditMode, showDate, onStartTimeFocus, filter }) => {
  const [isVisuallyCompleted, setIsVisuallyCompleted] = useState(item.completed);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsVisuallyCompleted(item.completed);
  }, [item.completed]);

  const handleToggle = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setIsVisuallyCompleted(prev => !prev);

    setTimeout(() => {
      onToggleComplete(item.id);
      setIsAnimating(false);
    }, 300);
  };

  const hasDuration = !!(item.time && item.endTime);
  const isFocusEnabled = hasDuration && filter === 'today';

  const handleFocusClick = (e: React.MouseEvent) => {
    if (isFocusEnabled && item.time && item.endTime) {
      e.stopPropagation();

      // Calculate duration directly from time strings
      const [startHour, startMinute] = item.time.split(':').map(Number);
      const [endHour, endMinute] = item.endTime.split(':').map(Number);
      const durationInSeconds = (endHour * 3600 + endMinute * 60) - (startHour * 3600 + startMinute * 60);

      if (durationInSeconds > 0) {
        onStartTimeFocus(durationInSeconds);
      }
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'work': return { icon: 'work', color: 'text-sky-500' };
      case 'personal': return { icon: 'person', color: 'text-amber-500' };
      case 'health': return { icon: 'favorite', color: 'text-rose-500' };
      case 'fitness': return { icon: 'fitness_center', color: 'text-lime-500' };
      case 'shopping': return { icon: 'shopping_cart', color: 'text-violet-500' };
      case 'social': return { icon: 'groups', color: 'text-orange-500' };
      case 'finance': return { icon: 'payments', color: 'text-green-500' };
      case 'travel': return { icon: 'flight_takeoff', color: 'text-cyan-500' };
      case 'study': return { icon: 'school', color: 'text-purple-500' };
      default: return { icon: 'task_alt', color: 'text-slate-400' };
    }
  };

  const categoryInfo = getCategoryIcon(item.category);

  const formatDate = (dateString: string) => {
    // Adding 'T00:00:00' ensures the date is parsed in the local timezone, avoiding UTC conversion issues.
    const date = new Date(dateString + 'T00:00:00');
    const currentYear = new Date().getFullYear();
    const dateYear = date.getFullYear();

    // Only show year if it's not the current year
    if (dateYear === currentYear) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString(navigator.language, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const timeDisplay = item.time
    ? item.endTime
      ? `${formatTime(item.time)} - ${formatTime(item.endTime)}`
      : formatTime(item.time)
    : null;

  return (
    <li
      className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 flex items-start sm:items-center gap-4 group/item"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(); } }}
      aria-pressed={isVisuallyCompleted}
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-opacity-10 transition-all duration-300 ${isVisuallyCompleted ? 'opacity-50' : ''} ${categoryInfo.color.replace('text-', 'bg-')}`}
        onClick={handleToggle}
      >
        <Icon name={categoryInfo.icon} className={`${categoryInfo.color} text-xl`} />
      </div>

      {/* Wrapper for content to allow responsive stacking */}
      <div className="flex-grow flex flex-col sm:flex-row sm:justify-between sm:items-center">
        {/* Main content area */}
        <div className="flex-grow" onClick={handleToggle}>
          <h3 id={`item-title-${item.id}`} className={`font-bold text-lg transition-colors duration-300 ${isVisuallyCompleted ? 'text-slate-400' : 'text-slate-800'}`}>
            <span className="relative inline-block">
              {item.title}
              <span className={`absolute top-1/2 -translate-y-1/2 left-0 w-full h-0.5 bg-slate-400 transition-transform duration-300 ease-in-out transform origin-left ${isVisuallyCompleted ? 'scale-x-100' : 'scale-x-0'}`}></span>
            </span>
          </h3>
          {item.description && (
            <p className={`text-sm mt-0.5 transition-colors duration-300 ${isVisuallyCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="relative inline-block">
                {item.description}
                <span className={`absolute top-1/2 -translate-y-1/2 left-0 w-full h-0.5 bg-slate-400 transition-transform duration-300 ease-in-out transform origin-left ${isVisuallyCompleted ? 'scale-x-100' : 'scale-x-0'}`}></span>
              </span>
            </p>
          )}
        </div>

        {/* Date, Time and Delete Button Group */}
        <div className="flex items-center justify-between gap-3 flex-shrink-0 z-10 mt-2 sm:mt-0 sm:ml-4 w-full sm:w-auto">
          <div className="text-left sm:text-right">
            {showDate && (
              <div className={`text-xs font-semibold mb-0.5 transition-colors duration-300 ${isVisuallyCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
                {formatDate(item.date)}
              </div>
            )}
            {timeDisplay && (
              showDate ? (
                <div
                  onClick={handleFocusClick}
                  className={`flex items-center justify-end gap-1.5 text-base font-medium transition-colors duration-300 ${isVisuallyCompleted ? 'text-slate-400' : 'text-indigo-600'} ${isFocusEnabled ? 'cursor-pointer' : ''}`}
                  title={isFocusEnabled ? 'Start focus session for this task' : undefined}
                >
                  <Icon name="schedule" className="text-base" />
                  <span>{timeDisplay}</span>
                </div>
              ) : (
                <div
                  onClick={handleFocusClick}
                  className={`flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full w-auto min-w-[5rem] transition-all duration-300 ${isVisuallyCompleted ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'} ${isFocusEnabled ? 'cursor-pointer hover:bg-indigo-100' : ''}`}
                  title={isFocusEnabled ? 'Start focus session for this task' : undefined}
                >
                  <Icon name="schedule" className="text-base" />
                  <span>{timeDisplay}</span>
                </div>
              )
            )}
          </div>

          <div className={`transition-all duration-300 ease-in-out flex items-center gap-2 overflow-hidden ${isEditMode ? 'w-16 opacity-100' : 'w-0 opacity-0'}`}>
            <button
              data-role="edit-button"
              onClick={(e) => {
                e.stopPropagation();
                onEditItem(item.id);
              }}
              className="text-slate-400 hover:text-blue-500 disabled:opacity-0 transition-colors flex-shrink-0"
              aria-label={`Edit schedule item: ${item.title}`}
              disabled={!isEditMode}
              tabIndex={isEditMode ? 0 : -1}
            >
              <Icon name="edit" />
            </button>

            <button
              data-role="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteItem(item.id);
              }}
              className="text-slate-400 hover:text-red-500 disabled:opacity-0 transition-colors flex-shrink-0"
              aria-label={`Delete schedule item: ${item.title}`}
              disabled={!isEditMode}
              tabIndex={isEditMode ? 0 : -1}
            >
              <Icon name="delete" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};

export default ScheduleItemComponent;