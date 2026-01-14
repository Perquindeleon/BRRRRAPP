"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export function DashboardWelcome() {
    return (
        <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
            <div className="mx-auto h-24 w-24 bg-violet-100 rounded-full flex items-center justify-center mb-6">
                <PlusCircle className="h-12 w-12 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to your Portfolio</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
                You haven't added any properties yet. Start your journey by analyzing a new deal or adding an existing property.
            </p>
            <Link href="/dashboard/analyze">
                <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white">
                    Start New Analysis
                </Button>
            </Link>
        </div>
    );
}
