import { Sidebar } from "@/components/layout/Sidebar";

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />
            <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 ease-in-out bg-gray-50 dark:bg-background">
                {children}
            </main>
        </div>
    );
}
