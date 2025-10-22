import React, { useState, useRef } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import {
    restrictToVerticalAxis,
    restrictToParentElement,
} from '@dnd-kit/modifiers';
import Icon from './Icon';

interface DraggableThemeListProps {
    themes: string[];
    selectedTheme: string | null;
    onThemeSelect: (theme: string) => void;
    onThemesReorder: (newThemes: string[]) => void;
    onThemeDelete: (theme: string) => void;
    onAddNewTheme: (theme: string) => void;
    onClose: () => void;
}

interface SortableThemeItemProps {
    theme: string;
    isSelected: boolean;
    onThemeSelect: (theme: string) => void;
    onThemeDelete: (theme: string) => void;
    onClose: () => void;
    isEditMode: boolean;
}

const SortableThemeItem: React.FC<SortableThemeItemProps> = ({ theme, isSelected, onThemeSelect, onThemeDelete, onClose, isEditMode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: theme });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between group rounded-md hover:bg-slate-100 transition-colors"
        >
            <div className="flex items-center flex-1 min-w-0">
                <div
                    {...attributes}
                    {...listeners}
                    className="text-slate-400 text-sm mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab active:cursor-grabbing p-1"
                >
                    <Icon name="drag_indicator" className="text-sm" />
                </div>
                <button
                    onClick={() => { onThemeSelect(theme); onClose(); }}
                    className={`flex-1 text-left px-1 py-2 truncate ${isSelected ? 'font-semibold text-indigo-600' : 'font-medium'}`}
                    title={theme}
                >
                    {theme}
                </button>
            </div>
            {isEditMode && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onThemeDelete(theme);
                    }}
                    className="flex-shrink-0 text-red-500 hover:text-red-600 transition-colors p-1 mr-1"
                    aria-label={`Delete theme: ${theme}`}
                >
                    <Icon name="delete" className="text-sm" />
                </button>
            )}
        </li>
    );
};

const DraggableThemeList: React.FC<DraggableThemeListProps> = ({
    themes,
    selectedTheme,
    onThemeSelect,
    onThemesReorder,
    onThemeDelete,
    onAddNewTheme,
    onClose
}) => {
    const [newTheme, setNewTheme] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const containerRef = useRef<HTMLUListElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = themes.indexOf(active.id as string);
            const newIndex = themes.indexOf(over?.id as string);

            onThemesReorder(arrayMove(themes, oldIndex, newIndex));
        }
    };

    const handleAddNewTheme = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTheme = newTheme.trim();
        if (trimmedTheme && !themes.includes(trimmedTheme)) {
            onAddNewTheme(trimmedTheme);
            setNewTheme('');
        }
    };

    return (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-30 animate-[fade-in_0.1s_ease-out]">
            <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-medium text-slate-500">
                    Select a theme
                </span>
                <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`text-xs font-medium px-2 py-1 rounded transition-colors ${isEditMode
                        ? 'text-red-600 bg-red-50 hover:bg-red-100'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                >
                    {isEditMode ? 'Done' : 'Edit'}
                </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '202px' }}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                >
                    <SortableContext items={themes} strategy={verticalListSortingStrategy}>
                        <ul ref={containerRef} className="space-y-0">
                            {themes.map((theme) => (
                                <SortableThemeItem
                                    key={theme}
                                    theme={theme}
                                    isSelected={selectedTheme === theme}
                                    onThemeSelect={onThemeSelect}
                                    onThemeDelete={onThemeDelete}
                                    onClose={onClose}
                                    isEditMode={isEditMode}
                                />
                            ))}
                        </ul>
                    </SortableContext>
                </DndContext>

                {themes.length === 0 && <div className="text-center text-slate-400 text-sm py-2">No themes yet.</div>}
            </div>

            <form onSubmit={handleAddNewTheme} className="mt-2 pt-2 border-t border-slate-200">
                <p className="font-semibold text-sm text-slate-600 px-1 mb-2">Add New Theme</p>
                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={newTheme}
                        onChange={e => setNewTheme(e.target.value)}
                        placeholder="New theme"
                        maxLength={20}
                        className="flex-1 p-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                    <button
                        type="submit"
                        className="flex-shrink-0 w-8 h-8 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        disabled={!newTheme.trim()}
                        aria-label="Add theme"
                    >
                        <Icon name="add" className="text-lg" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DraggableThemeList;