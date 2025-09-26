import React from 'react';
import type { ScheduleItem, FilterType } from '../types';
import ScheduleItemComponent from './ScheduleItem';
import Icon from './Icon';

interface ScheduleListProps {
  items: ScheduleItem[];
  filter: FilterType;
  onDeleteItem: (id: string) => void;
  onToggleComplete: (id: string) => void;
  isEditMode: boolean;
  onStartTimeFocus: (durationInSeconds: number) => void;
}

const ScheduleList: React.FC<ScheduleListProps> = ({ items, filter, onDeleteItem, onToggleComplete, isEditMode, onStartTimeFocus }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredItems = items
    .filter(item => {
      switch (filter) {
        case 'today':
          return item.date === todayStr && !item.completed;
        case 'all':
          return !item.completed;
        case 'completed':
          return item.completed;
        default:
          return true;
      }
    })
    .sort((a, b) => {
        // Sort by date first
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;
        // Then sort by time
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1; // Items with time come first
        if (b.time) return 1;
        return 0;
    });

    const showDate = filter !== 'today';

  if (filteredItems.length === 0) {
    const emptyMessages = {
        today: "You have no tasks scheduled for today.",
        all: "Your schedule is empty.",
        completed: "You haven't completed any tasks yet."
    };
      
    return (
      <div className="text-center py-16 px-6 bg-slate-100 rounded-2xl">
        <Icon name="celebration" className="text-5xl text-slate-400 mb-4" />
        <h3 className="text-xl font-semibold text-slate-700">All Clear!</h3>
        <p className="text-slate-500 mt-1">
          {emptyMessages[filter]}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {filteredItems.map(item => (
        <ScheduleItemComponent 
            key={item.id} 
            item={item} 
            onDeleteItem={onDeleteItem} 
            onToggleComplete={onToggleComplete}
            isEditMode={isEditMode}
            showDate={showDate}
            onStartTimeFocus={onStartTimeFocus}
            filter={filter}
        />
      ))}
    </ul>
  );
};

export default ScheduleList;