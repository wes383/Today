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

interface DraggableTagListProps {
    tags: string[];
    selectedTag: string | null;
    onTagSelect: (tag: string | null) => void;
    onTagsReorder: (newTags: string[]) => void;
    onTagDelete: (tag: string) => void;
    onAddNewTag: (tag: string) => void;
    onClose: () => void;
    buttonColor?: 'purple' | 'green';
}

interface SortableTagItemProps {
    tag: string;
    onTagSelect: (tag: string) => void;
    onTagDelete: (tag: string) => void;
    onClose: () => void;
    isEditMode: boolean;
}

const SortableTagItem: React.FC<SortableTagItemProps> = ({ tag, onTagSelect, onTagDelete, onClose, isEditMode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: tag });

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
                    onClick={() => { onTagSelect(tag); onClose(); }}
                    className="flex-1 text-left px-1 py-1.5 truncate"
                    title={tag}
                >
                    {tag}
                </button>
            </div>
            {isEditMode && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onTagDelete(tag);
                    }}
                    className="flex-shrink-0 text-red-500 hover:text-red-600 transition-colors p-1 mr-1"
                    aria-label={`Delete tag: ${tag}`}
                >
                    <Icon name="delete" className="text-sm" />
                </button>
            )}
        </li>
    );
};

const DraggableTagList: React.FC<DraggableTagListProps> = ({
    tags,
    selectedTag,
    onTagSelect,
    onTagsReorder,
    onTagDelete,
    onAddNewTag,
    onClose,
    buttonColor = 'purple'
}) => {
    const [newTag, setNewTag] = useState('');
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
            const oldIndex = tags.indexOf(active.id as string);
            const newIndex = tags.indexOf(over?.id as string);

            onTagsReorder(arrayMove(tags, oldIndex, newIndex));
        }
    };

    const handleAddNewTag = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTag = newTag.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            onAddNewTag(trimmedTag);
            setNewTag('');
        }
    };

    return (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-30 animate-[fade-in_0.1s_ease-out]">
            <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-medium text-slate-500">
                    Select a tag
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
            <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '266px' }}>
                <div className="rounded-md hover:bg-slate-100">
                    <button
                        onClick={() => { onTagSelect(null); onClose(); }}
                        className="w-full text-left px-3 py-1.5 text-slate-500"
                    >
                        No Tag
                    </button>
                </div>

                {tags.length > 0 && <div className="h-px bg-slate-200 my-1 mx-2"></div>}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                >
                    <SortableContext items={tags} strategy={verticalListSortingStrategy}>
                        <ul ref={containerRef} className="space-y-0">
                            {tags.map((tag) => (
                                <SortableTagItem
                                    key={tag}
                                    tag={tag}
                                    onTagSelect={onTagSelect}
                                    onTagDelete={onTagDelete}
                                    onClose={onClose}
                                    isEditMode={isEditMode}
                                />
                            ))}
                        </ul>
                    </SortableContext>
                </DndContext>

                {tags.length === 0 && <div className="text-center text-slate-400 text-sm py-2">No tags yet.</div>}
            </div>

            <form onSubmit={handleAddNewTag} className="mt-2 pt-2 border-t border-slate-200">
                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        placeholder="New tag"
                        maxLength={16}
                        className="flex-1 p-1.5 border border-slate-300 rounded-lg text-sm focus:ring-0 focus:outline-none transition-colors"
                    />
                    <button
                        type="submit"
                        className={`flex-shrink-0 w-8 h-8 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${buttonColor === 'green'
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-purple-500 hover:bg-purple-600'
                            }`}
                        disabled={!newTag.trim()}
                        aria-label="Add tag"
                    >
                        <Icon name="add" className="text-lg" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DraggableTagList;