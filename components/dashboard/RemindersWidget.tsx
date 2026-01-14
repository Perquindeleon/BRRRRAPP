"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, Plus, CheckCircle2 } from "lucide-react";
import { SimpleDialog } from "@/components/ui/simple-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Reminder = {
    id?: string;
    title?: string;
    message?: string; // from alert format
    due_date?: string;
    type: string;
    priority?: 'low' | 'medium' | 'high';
    property_id?: string;
};

export function RemindersWidget({ initialReminders }: { initialReminders?: any[] }) {
    const [reminders, setReminders] = useState<Reminder[]>(initialReminders || []);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDate, setNewDate] = useState("");

    const handleAdd = async () => {
        if (!newTitle || !newDate) return;

        // Optimistic UI update
        const tempId = Math.random().toString();
        const newReminder: Reminder = {
            id: tempId,
            title: newTitle,
            due_date: newDate,
            type: 'other',
            priority: 'medium'
        };

        setReminders([...reminders, newReminder]);
        setIsAddOpen(false);
        setNewTitle("");
        setNewDate("");

        // Call API
        try {
            await fetch('/api/reminders', {
                method: 'POST',
                body: JSON.stringify({
                    title: newTitle,
                    date: newDate,
                    type: 'other',
                    status: 'pending'
                })
            });
            // Ideally re-fetch or update ID, but for MVP this is fine
        } catch (e) {
            console.error("Failed to save reminder", e);
        }
    };

    return (
        <Card className="h-full border-none shadow-md bg-card">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <CalendarClock className="h-5 w-5 text-orange-500" />
                            Up Next
                        </CardTitle>
                        <CardDescription>Upcoming tasks & alerts</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsAddOpen(true)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {reminders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm bg-muted/30 rounded-lg">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50 text-emerald-500" />
                        All caught up!
                    </div>
                ) : (
                    reminders.slice(0, 5).map((rem, i) => (
                        <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-muted/40 border border-muted hover:bg-muted/60 transition-colors">
                            <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${rem.type === 'lease' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                            <div className="space-y-1 flex-1">
                                <p className="text-sm font-semibold text-foreground leading-none">{rem.title || rem.message || "Alert"}</p>
                                <p className="text-xs text-muted-foreground">
                                    {rem.due_date ? new Date(rem.due_date).toLocaleDateString() : 'Action Required'}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>

            <SimpleDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                title="Add New Reminder"
            >
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Task / Title</Label>
                        <Input
                            placeholder="e.g. Inspect Roof at 123 Main"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                        />
                    </div>
                    <Button className="w-full" onClick={handleAdd}>Add Reminder</Button>
                </div>
            </SimpleDialog>
        </Card>
    );
}
