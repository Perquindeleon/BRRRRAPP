"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addMilestone, deleteMilestone } from "@/app/dashboard/projects/actions";
import { useRouter } from "next/navigation";

interface Milestone {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    status: string;
    notes?: string;
}

export default function TimelineGantt({
    milestones,
    propertyId
}: {
    milestones: Milestone[],
    propertyId: string
}) {
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setIsAdding(true); // Optimistic loading state could be better, simplified here
        await addMilestone(formData);
        setIsAdding(false);
        // Reset form manually or just close modal if we had one. 
        // For inline form, simple reset logic or uncontrolled + router.refresh is easiest.
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-foreground">Project Timeline & Application Milestones</h3>
            </div>

            {/* Add Milestone Form */}
            <Card className="bg-muted/30 border-dashed">
                <CardContent className="pt-6">
                    <form action={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                        <input type="hidden" name="property_id" value={propertyId} />
                        <div className="space-y-2 flex-1">
                            <label className="text-xs font-medium text-muted-foreground">Milestone Title</label>
                            <Input name="title" placeholder="e.g. Demolition, Inspection, Listing" required className="bg-background" />
                        </div>
                        <div className="space-y-2 w-full md:w-40">
                            <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                            <Input name="start_date" type="date" className="bg-background" />
                        </div>
                        <div className="space-y-2 w-full md:w-32">
                            <label className="text-xs font-medium text-muted-foreground">Status</label>
                            <Select name="status" defaultValue="pending">
                                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" disabled={isAdding} className="bg-violet-600 hover:bg-violet-700 text-white">
                            <Plus className="w-4 h-4 mr-2" /> Add
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* GANTT CHART VISUALIZATION */}
            {milestones.length > 0 && (
                <div className="border rounded-lg p-4 bg-card overflow-x-auto">
                    <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Visual Schedule
                    </h4>

                    <div className="min-w-[600px] space-y-4">
                        <GanttChart bars={milestones} propertyId={propertyId} />
                    </div>
                </div>
            )}
        </div>
    );
}

function GanttChart({ bars, propertyId }: { bars: Milestone[], propertyId: string }) {
    // 1. Find Range
    const dates = bars.map(b => [new Date(b.start_date!).getTime(), new Date(b.end_date || b.start_date!).getTime()]).flat();
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const totalDuration = maxDate - minDate + (1000 * 60 * 60 * 24 * 7); // Add buffer

    return (
        <div className="relative space-y-2 mt-2">
            {/* Grid Lines (every 25%) */}
            <div className="absolute inset-0 flex justify-between pointer-events-none text-xs text-muted-foreground opacity-30">
                <div className="border-l h-full pl-1">Start</div>
                <div className="border-l h-full pl-1">25%</div>
                <div className="border-l h-full pl-1">50%</div>
                <div className="border-l h-full pl-1">75%</div>
                <div className="border-r h-full pr-1">End</div>
            </div>

            {bars.map((bar) => {
                const start = new Date(bar.start_date!).getTime();
                const end = new Date(bar.end_date || bar.start_date!).getTime();
                const duration = Math.max(end - start, 1000 * 60 * 60 * 24); // Min 1 day

                const left = ((start - minDate) / totalDuration) * 100;
                const width = (duration / totalDuration) * 100;

                return (
                    <div key={bar.id} className="relative h-8 w-full flex items-center group">
                        <div
                            className={`absolute h-6 rounded-md shadow-sm border flex items-center px-2 text-xs font-medium whitespace-nowrap overflow-hidden transition-all hover:z-10 hover:shadow-md
                            ${bar.status === 'completed' ? 'bg-emerald-200 border-emerald-300 text-emerald-800 dark:bg-emerald-900 dark:border-emerald-700 dark:text-emerald-100' :
                                    bar.status === 'in_progress' ? 'bg-blue-200 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100' :
                                        'bg-slate-200 border-slate-300 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                        >
                            {bar.title}
                            <span className="hidden group-hover:inline ml-2 opacity-75">
                                ({format(new Date(bar.start_date!), 'MMM d')} - {bar.end_date ? format(new Date(bar.end_date), 'MMM d') : ''})
                            </span>
                        </div>

                        {/* Delete Button (only visible on hover of row) */}
                        <div className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-red-500"
                                onClick={async () => {
                                    if (confirm("Delete this milestone?")) {
                                        await deleteMilestone(bar.id, propertyId);
                                    }
                                }}
                            >
                                <Trash className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
