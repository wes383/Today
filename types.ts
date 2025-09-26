export interface ScheduleItem {
  id: string;
  title: string;
  description: string | null;
  date: string; // 'YYYY-MM-DD'
  time: string | null; // 'HH:mm' start time
  endTime: string | null; // 'HH:mm' end time
  category?: 'work' | 'personal' | 'health' | 'fitness' | 'shopping' | 'social' | 'finance' | 'travel' | 'study';
  completed: boolean;
}

export type ScheduleItemData = Omit<ScheduleItem, 'id' | 'completed'>;

export type FilterType = 'today' | 'all' | 'completed' | null;

export interface FocusSession {
  id: string;
  completedAt: string; // ISO string
  duration: number; // in seconds
  tag: string | null;
}
