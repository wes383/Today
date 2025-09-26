import React from 'react';
import type { FilterType } from '../types';

interface FilterToggleProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  isTimerActive: boolean;
}

const FilterToggle: React.FC<FilterToggleProps> = ({ currentFilter, onFilterChange, isTimerActive }) => {
  const baseClasses = 'px-5 py-2 rounded-full font-semibold transition-colors duration-200 text-sm';
  const inactiveClasses = 'bg-white text-slate-600 hover:bg-slate-100';

  const getActiveClasses = (filter: FilterType) => {
    const baseActive = 'text-white shadow-md';
    switch (filter) {
        case 'today':
            return `bg-teal-500 ${baseActive}`;
        case 'all':
            return `bg-sky-600 ${baseActive}`;
        case 'completed':
            return `bg-slate-300 text-slate-700 shadow-md`;
    }
  }

  return (
    <div className="flex justify-center p-1 bg-slate-200 rounded-full">
      <button
        onClick={() => onFilterChange('today')}
        className={`${baseClasses} ${currentFilter === 'today' && !isTimerActive ? getActiveClasses('today') : inactiveClasses}`}
      >
        Today
      </button>
      <button
        onClick={() => onFilterChange('all')}
        className={`${baseClasses} ${currentFilter === 'all' && !isTimerActive ? getActiveClasses('all') : inactiveClasses}`}
      >
        All
      </button>
      <button
        onClick={() => onFilterChange('completed')}
        className={`${baseClasses} ${currentFilter === 'completed' && !isTimerActive ? getActiveClasses('completed') : inactiveClasses}`}
      >
        Completed
      </button>
    </div>
  );
};

export default FilterToggle;