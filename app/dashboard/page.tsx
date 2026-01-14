import { getDashboardMetrics } from "./get-metrics";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { DashboardWelcome } from "@/components/dashboard/DashboardWelcome";

export default async function DashboardPage() {
    const data = await getDashboardMetrics();

    if (!data) {
        return <div className="p-8">Loading...</div>; // Or error state
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Dashboard</h2>
                    <p className="text-muted-foreground">Your investment portfolio at a glance.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/dashboard/properties/new">
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-md">
                            <Plus className="mr-2 h-4 w-4" /> Add Deal
                        </Button>
                    </Link>
                </div>
            </div>

            {data.stats.totalProperties === 0 ? (
                <div className="mt-8">
                    <DashboardWelcome />
                </div>
            ) : (
                <DashboardCharts data={data} />
            )}
        </div>
    );
}
