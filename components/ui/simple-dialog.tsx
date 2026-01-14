"use client";

import { X } from "lucide-react";
import { Button } from "./button";

export function SimpleDialog({
    isOpen,
    onClose,
    title,
    children,
    description
}: {
    isOpen: boolean,
    onClose: () => void,
    title: React.ReactNode,
    children: React.ReactNode,
    description?: string
}) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-background rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-border">
                <div className="flex justify-between items-center p-4 border-b bg-muted/50">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">{title}</h3>
                        {description && <p className="text-sm text-gray-500">{description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="p-0">
                    {children}
                </div>
            </div>
        </div>
    );
}
