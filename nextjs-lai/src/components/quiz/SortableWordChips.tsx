'use client'

import { useState } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface SortableWordChipsProps {
    words: string[]
    onChange: (words: string[]) => void
    disabled?: boolean
}

function SortableChip({ id, word, disabled }: { id: string; word: string; disabled?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium select-none ${
                isDragging
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : disabled
                        ? 'bg-muted text-muted-foreground cursor-default'
                        : 'bg-background hover:bg-accent cursor-grab active:cursor-grabbing'
            }`}
            {...attributes}
            {...listeners}
        >
            {!disabled && <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            {word}
        </div>
    )
}

export function SortableWordChips({ words, onChange, disabled }: SortableWordChipsProps) {
    // Create stable IDs for each word position
    const [ids] = useState(() => words.map((_, i) => `word-${i}`))

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = ids.indexOf(String(active.id))
        const newIndex = ids.indexOf(String(over.id))
        if (oldIndex === -1 || newIndex === -1) return

        const newIds = arrayMove(ids, oldIndex, newIndex)
        const newWords = arrayMove(words, oldIndex, newIndex)

        // Update ids in place to keep them synced with words
        ids.splice(0, ids.length, ...newIds)
        onChange(newWords)
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-dashed bg-muted/30 min-h-[60px]">
                    {words.map((word, i) => (
                        <SortableChip
                            key={ids[i]}
                            id={ids[i]}
                            word={word}
                            disabled={disabled}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}
