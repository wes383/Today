import React from 'react';
import type { FilterType } from '../types';

interface FilterToggleProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  isTimerActive: boolean;
}

const BASE_CLASSES = 'px-5 py-2 rounded-full font-semibold transition-colors duration-200 text-sm';
const INACTIVE_CLASSES = 'bg-white text-slate-600 hover:bg-slate-100';
const BASE_ACTIVE = 'text-white shadow-md';

const FilterToggle: React.FC<FilterToggleProps> = ({ currentFilter, onFilterChange, isTimerActive }) => {
  const getActiveClasses = (filter: FilterType) => {
    switch (filter) {
        case 'today':
            return `bg-teal-500 ${BASE_ACTIVE}`;
        case 'all':
            return `bg-sky-600 ${BASE_ACTIVE}`;
        case 'completed':
            return `bg-slate-300 text-slate-700 shadow-md`;
    }
  }

  return (
    <div className="flex justify-center p-1 bg-slate-200 rounded-full">
      <button
        onClick={() => onFilterChange('today')}
        className={`${BASE_CLASSES} ${currentFilter === 'today' && !isTimerActive ? getActiveClasses('today') : INACTIVE_CLASSES}`}
      >
        Today
      </button>
      <button
        onClick={() => onFilterChange('all')}
        className={`${BASE_CLASSES} ${currentFilter === 'all' && !isTimerActive ? getActiveClasses('all') : INACTIVE_CLASSES}`}
      >
        All
      </button>
      <button
        onClick={() => onFilterChange('completed')}
        className={`${BASE_CLASSES} ${currentFilter === 'completed' && !isTimerActive ? getActiveClasses('completed') : INACTIVE_CLASSES}`}
      >
        Completed
      </button>
    </div>
  );
};

export default FilterToggle;