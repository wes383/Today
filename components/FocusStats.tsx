import React from 'react';
import type { FocusSession } from '../types';
import Icon from './Icon';

interface FocusStatsProps {
  sessions: FocusSession[];
  onDeleteSession: (id: string) => void;
}

const formatDuration = (totalSeconds: number) => {
    if (totalSeconds < 1) return '0 seconds';
    
    if (totalSeconds < 60) {
        const s = Math.round(totalSeconds);
        return `${s} second${s !== 1 ? 's' : ''}`;
    }
    
    if (totalSeconds < 3600) {
        const m = Math.round(totalSeconds / 60);
        return `${m} minute${m !== 1 ? 's' : ''}`;
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.round((totalSeconds % 3600) / 60);

    let result = `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) {
        result += ` ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return result;
};

const FocusStats: React.FC<FocusStatsProps> = ({ sessions, onDeleteSession }) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const todayData = React.useMemo(() => {
        const todaySessions = sessions
            .filter(session => session.completedAt.startsWith(todayStr))
            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

        let totalSeconds = 0;
        const tagSeconds: { [key: string]: number } = {};

        todaySessions.forEach(session => {
            totalSeconds += session.duration;
            const tag = session.tag || 'Untagged';
            if (!tagSeconds[tag]) {
                tagSeconds[tag] = 0;
            }
            tagSeconds[tag] += session.duration;
        });

        const sortedTags = Object.entries(tagSeconds)
            .sort(([, a], [, b]) => b - a)
            .map(([name, seconds]) => ({ name, seconds }));

        return {
            sessions: todaySessions,
            totalSeconds,
            sortedTags,
        };
    }, [sessions, todayStr]);
    
    const grandTotalSeconds = React.useMemo(() => {
        return sessions.reduce((total, session) => total + session.duration, 0);
    }, [sessions]);

    if (sessions.length === 0) {
        return (
          <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-md animate-[fade-in_0.3s_ease-out]">
            <Icon name="query_stats" className="text-5xl text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700">No Focus Data Yet</h3>
            <p className="text-slate-500 mt-1">
              Complete a focus session to see your stats here.
            </p>
          </div>
        );
    }
    
    // Milestone calculations
    const secondsInADay = 24 * 60 * 60;
    const completedDays = Math.floor(grandTotalSeconds / secondsInADay);
    const remainderSeconds = grandTotalSeconds % secondsInADay;
    const progressPercentage = (remainderSeconds / secondsInADay) * 100;

    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference * (1 - progressPercentage / 100);

    const tagInfo = { icon: 'label', color: 'text-blue-500', bg: 'bg-blue-100' };



    const handleDelete = (id: string) => {
        onDeleteSession(id);
    };

    return (
        <div className="bg-white rounded-2xl shadow-md p-6 animate-[fade-in_0.3s_ease-out]">
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">Today's Focus</h2>

             {todayData.totalSeconds > 0 ? (
                <>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8 text-center">
                        <p className="text-sm font-medium text-slate-500">Total Focus Time Today</p>
                        <p className="text-3xl font-bold text-slate-800 mt-1">{formatDuration(todayData.totalSeconds)}</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3 text-center">Today's Breakdown by Tag</h3>
                        <ul className="space-y-3">
                            {todayData.sortedTags.map(({ name, seconds }) => {
                                const percentage = todayData.totalSeconds > 0 ? (seconds / todayData.totalSeconds) * 100 : 0;

                                return (
                                    <li key={name} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${tagInfo.bg}`}>
                                            <Icon name={tagInfo.icon} className={`${tagInfo.color} text-xl`} />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <p className="font-semibold text-slate-800 capitalize">{name}</p>
                                                <p className="text-sm font-medium text-slate-600">{formatDuration(seconds)}</p>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                <div 
                                                    className={`${tagInfo.color.replace('text-', 'bg-')} h-2 rounded-full`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </>
            ) : (
                <div className="text-center py-8 px-6 bg-slate-50 rounded-xl my-6">
                    <Icon name="query_stats" className="text-4xl text-slate-400 mb-3" />
                    <h3 className="text-lg font-semibold text-slate-700">No Focus Data for Today</h3>
                    <p className="text-slate-500 mt-1 text-sm">
                        Complete a focus session to see today's stats.
                    </p>
                </div>
            )}
            
            <div className="mt-8 pt-4 border-t border-slate-200 text-center">
                <p className="text-sm font-medium text-slate-500">All-Time Total</p>
                <p className="text-xl font-bold text-slate-700 mt-1">{formatDuration(grandTotalSeconds)}</p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 text-center mb-2">Focus Milestones</h3>
                <p className="text-center text-sm text-slate-500 mb-4">
                    Each completed circle represents 24 hours of focused time.
                </p>
                <div className="flex flex-wrap justify-center items-center gap-3">
                    {Array.from({ length: completedDays }).map((_, index) => (
                        <div key={`completed-${index}`} className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center transition-transform hover:scale-110" title={`Milestone #${index + 1}: 24 hours of focus completed!`}>
                            <span className="font-bold text-2xl text-green-600">{index + 1}</span>
                        </div>
                    ))}

                    <div className="relative w-16 h-16" title={`${Math.floor(progressPercentage)}% to the next 24-hour milestone`}>
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                            <circle
                                className="text-slate-200"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                r={radius}
                                cx="32"
                                cy="32"
                            />
                            <circle
                                className="text-green-500"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray={circumference}
                                strokeDashoffset={progressOffset}
                                strokeLinecap="round"
                                fill="transparent"
                                r={radius}
                                cx="32"
                                cy="32"
                                style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-600">
                            {`${Math.floor(progressPercentage)}%`}
                        </span>
                    </div>
                </div>
            </div>

            {/* All focus records today */}
            <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 text-center">Today's Records</h3>
                {todayData.sessions.length === 0 ? (
                    <p className="text-center text-slate-500 text-sm">No records today.</p>
                ) : (
                    <ul className="space-y-2">
                        {todayData.sessions.map((s) => {
                            const completedTime = new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const tagLabel = s.tag || 'Untagged';
                            return (
                                <li key={s.id} className="group relative flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg">
                                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Icon name="timer" className="text-blue-500 text-lg" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between">
                                            <p className="font-medium text-slate-800 truncate">{formatDuration(s.duration)}</p>
                                            <span className="ml-3 text-xs text-slate-500 flex-shrink-0">{completedTime}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 truncate mt-0.5">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                                <Icon name="label" className="text-sm" /> {tagLabel}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="pointer-events-none absolute right-2 bottom-2">
                                        <button
                                            onClick={() => handleDelete(s.id)}
                                            className="pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 p-1.5"
                                            aria-label="Delete record"
                                            data-role="delete-button"
                                            title="Delete"
                                        >
                                            <Icon name="delete" className="text-xl" />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default FocusStats;