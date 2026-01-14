"use client";

import { useState } from "react";
import { updateRehabItem, deleteRehabItem } from "../actions";
import { CheckCircle2, Circle, Clock, DollarSign, Save, Trash, Edit, User, HardHat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function RehabItemRow({ item, contractors = [] }: { item: any, contractors?: any[] }) {
    const router = useRouter();
    const [status, setStatus] = useState(item.status);
    const [actualCost, setActualCost] = useState(item.actual_cost || 0);
    const [contractorId, setContractorId] = useState(item.contractor_id || "none"); // Default to string "none" for Select compatibility
    const [isDirty, setIsDirty] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editDescription, setEditDescription] = useState(item.description);
    const [editCategory, setEditCategory] = useState(item.category);
    const [editEstimatedCost, setEditEstimatedCost] = useState(item.estimated_cost);
    const [editUnitNumber, setEditUnitNumber] = useState(item.unit_number || "");

    const handleStatusChange = async (newStatus: string) => {
        setStatus(newStatus);
        await updateRehabItem(item.id, { status: newStatus });
        router.refresh();
    };

    const handleContractorChange = async (newContractorId: string) => {
        setContractorId(newContractorId);
        await updateRehabItem(item.id, { contractor_id: newContractorId === "none" ? null : newContractorId });
        router.refresh();
    };

    const handleSaveCost = async () => {
        await updateRehabItem(item.id, { actual_cost: actualCost });
        setIsDirty(false);
        router.refresh();
    };

    const handleSaveEdit = async () => {
        await updateRehabItem(item.id, {
            description: editDescription,
            category: editCategory,
            estimated_cost: editEstimatedCost,
            unit_number: editUnitNumber || null
        });
        setIsEditing(false);
        router.refresh();
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this task?")) {
            await deleteRehabItem(item.id);
            router.refresh();
        }
    };

    const assignedContractor = contractors.find(c => c.id === contractorId);

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b py-4 last:border-0 gap-4 bg-card p-4 rounded-lg shadow-sm mb-2 border transition-all hover:border-violet-200">
            <div className="flex items-start gap-3 flex-1">
                <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                        <div className="flex items-center gap-2">
                            <StatusIcon status={status} />
                            <SelectValue />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex-1 space-y-1">
                    {isEditing ? (
                        <div className="flex flex-col gap-2">
                            <Input
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="h-8 font-semibold"
                            />
                            <div className="flex gap-2">
                                <Input
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                    className="h-7 text-xs w-32"
                                    placeholder="Category"
                                />
                                <Input
                                    value={editUnitNumber}
                                    onChange={(e) => setEditUnitNumber(e.target.value)}
                                    className="h-7 text-xs w-24"
                                    placeholder="Unit/Apt"
                                />
                                <Input
                                    type="number"
                                    value={editEstimatedCost}
                                    onChange={(e) => setEditEstimatedCost(Number(e.target.value))}
                                    className="h-7 text-xs w-24"
                                    placeholder="Est. Cost"
                                />
                            </div>
                            <div className="flex gap-2 mt-1">
                                <Button size="sm" onClick={handleSaveEdit} className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700">Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 px-3">Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 group">
                                <h4 className="font-semibold text-foreground">{item.description}</h4>
                                <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-violet-600 transition-opacity">
                                    <Edit className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <p className="text-[10px] text-slate-300 uppercase tracking-wide font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{item.category}</p>
                                {item.unit_number && (
                                    <p className="text-[10px] text-violet-300 uppercase tracking-wide font-bold bg-violet-900/50 px-1.5 py-0.5 rounded border border-violet-700/50">Unit: {item.unit_number}</p>
                                )}

                                {/* Contractor Select - Replaced Popover with Select */}
                                <Select value={contractorId || "none"} onValueChange={handleContractorChange}>
                                    <SelectTrigger className={`h-6 text-[10px] w-fit px-2 ${contractorId && contractorId !== 'none' ? 'text-violet-700 font-medium bg-violet-50 border-violet-200' : 'text-gray-400 bg-transparent border-transparent hover:bg-gray-100'}`}>
                                        <div className="flex items-center gap-1">
                                            <HardHat className="w-3 h-3" />
                                            <span>
                                                {contractorId && contractorId !== 'none'
                                                    ? contractors.find(c => c.id === contractorId)?.name
                                                    : "Assign"}
                                            </span>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Unassigned</SelectItem>
                                        {contractors.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name} ({c.specialty})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 lg:gap-8">
                <div className="text-right min-w-[80px]">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Budget</span>
                    <span className="font-medium text-foreground text-sm">${item.estimated_cost?.toLocaleString()}</span>
                </div>

                <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Actual Spend</span>
                    <div className="flex items-center gap-1 justify-end">
                        <div className="relative w-24">
                            <DollarSign className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
                            <Input
                                type="number"
                                className="h-9 pl-7 text-right font-bold text-foreground bg-background border-slate-200 dark:text-white dark:bg-slate-900 dark:border-slate-700 focus:ring-violet-500 focus:border-violet-500"
                                value={actualCost === 0 ? '' : actualCost}
                                placeholder="0"
                                onChange={(e) => {
                                    setActualCost(Number(e.target.value));
                                    setIsDirty(true);
                                }}
                            />
                        </div>
                        {isDirty && (
                            <Button size="icon" className="h-7 w-7 bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveCost}>
                                <Save className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    onClick={handleDelete}
                    title="Delete Task"
                >
                    <Trash className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

function StatusIcon({ status }: { status: string }) {
    if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    if (status === 'in_progress') return <Clock className="h-4 w-4 text-amber-500" />
    return <Circle className="h-4 w-4 text-slate-400" />
}
