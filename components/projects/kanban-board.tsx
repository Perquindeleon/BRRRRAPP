"use client";

import React, { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { updateRehabItem } from '../../app/dashboard/projects/actions';

// --- TYPES ---
interface RehabItem {
    id: string;
    description: string;
    category: string;
    estimated_cost: number;
    status: string;
    [key: string]: any;
}

interface Column {
    id: string;
    title: string;
    color: string;
}

const COLUMNS: Record<string, Column> = {
    planned: { id: 'planned', title: 'Planned', color: 'bg-slate-100' },
    in_progress: { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50' },
    completed: { id: 'completed', title: 'Completed', color: 'bg-emerald-50' }
};

function SortableItem({ item }: { item: RehabItem }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-2 touch-none">
            <Card className="bg-white shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing">
                <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm text-foreground line-clamp-2">{item.description}</h4>
                        <Badge variant="outline" className="text-[10px] shrink-0 ml-2">{item.category}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground font-bold">
                        ${item.estimated_cost?.toLocaleString()}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

import { useRouter } from 'next/navigation';

export default function KanbanBoard({ items, propertyId }: { items: any[], propertyId: string }) {
    const router = useRouter(); // Use router for refresh

    // Typed Items Grouping
    const initialItems: Record<string, RehabItem[]> = {
        planned: items.filter(i => i.status === 'planned' || !i.status),
        in_progress: items.filter(i => i.status === 'in_progress'),
        completed: items.filter(i => i.status === 'completed')
    };

    const [columns, setColumns] = useState<Record<string, RehabItem[]>>(initialItems);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Require 5px movement before drag starts (prevents accidental clicks)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function findContainer(id: string): string | undefined {
        if (id in columns) return id;
        // Loose comparison (item.id == id) to handle number vs string mismatch
        return Object.keys(columns).find(key => columns[key].find(item => item.id == id));
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(over?.id as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            setActiveId(null);
            return;
        }

        // Move item locally
        // Loose comparison finding item
        const activeItem = columns[activeContainer].find(i => i.id == active.id);
        if (!activeItem) return;

        setColumns(prev => {
            const activeItems = prev[activeContainer].filter(i => i.id !== activeItem.id);
            const overItems = [...prev[overContainer], { ...activeItem, status: overContainer }];
            return {
                ...prev,
                [activeContainer]: activeItems,
                [overContainer]: overItems
            };
        });

        setActiveId(null);

        // Update server
        await updateRehabItem(active.id as string, { status: overContainer });
        router.refresh(); // Ensure server data is synced
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={(event: DragStartEvent) => setActiveId(event.active.id as string)}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px] overflow-x-auto p-1">
                {Object.keys(COLUMNS).map(colId => (
                    <div key={colId} className={`flex flex-col h-full rounded-lg p-2 ${COLUMNS[colId].color}`}>
                        <div className="flex items-center justify-between mb-3 px-2">
                            <h3 className="font-bold text-sm text-slate-700">{COLUMNS[colId].title}</h3>
                            <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm shadow-sm">
                                {columns[colId]?.length || 0}
                            </Badge>
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-[100px]">
                            <SortableContext items={columns[colId]?.map(c => c.id) || []} strategy={verticalListSortingStrategy}>
                                {columns[colId]?.map(item => <SortableItem key={item.id} item={item} />)}
                            </SortableContext>
                        </div>
                    </div>
                ))}
            </div>
            <DragOverlay>
                {activeId ? (
                    <Card className="bg-white shadow-xl opacity-90 rotate-2 cursor-grabbing w-full max-w-[200px]">
                        <CardContent className="p-3">
                            Moving Item...
                        </CardContent>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
