"use client";

import { useRef } from "react";
import { addRehabItem } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"; // I assume I might need to install this or create it

export function AddItemForm({ propertyId }: { propertyId: string }) {
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Add New Task</CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    ref={formRef}
                    action={async (formData) => {
                        await addRehabItem(formData);
                        formRef.current?.reset();
                    }}
                    className="space-y-4"
                >
                    <input type="hidden" name="property_id" value={propertyId} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <select
                                name="category"
                                id="category"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="" disabled selected>Select Category</option>
                                <option value="Exterior">Exterior</option>
                                <option value="Interior">Interior</option>
                                <option value="Kitchen">Kitchen</option>
                                <option value="Bathroom">Bathroom</option>
                                <option value="Mechanical">Mechanical (HVAC/Elec/Plumb)</option>
                                <option value="Permits">Permits & Fees</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="estimated_cost">Estimated Cost</Label>
                            <Input
                                id="estimated_cost"
                                name="estimated_cost"
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit_number">Unit / Apt (Optional)</Label>
                            <Input
                                id="unit_number"
                                name="unit_number"
                                placeholder="e.g. Unit A"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            name="description"
                            placeholder="e.g., Install new shingle roof"
                            required
                        />
                    </div>

                    <SubmitButton className="w-full">Add Task</SubmitButton>
                </form>
            </CardContent>
        </Card>
    );
}
