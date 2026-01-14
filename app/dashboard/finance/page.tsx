import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FinancePage() {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
            <Wallet className="h-16 w-16 text-emerald-500 mb-4" />
            <h1 className="text-3xl font-bold mb-2">Financial Hub</h1>
            <p className="text-muted-foreground max-w-md mb-8">
                Connect your bank accounts, track mortgage payments, and manage cash flow.
                This advanced module is currently under development.
            </p>
            <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
            </Link>
        </div>
    );
}
