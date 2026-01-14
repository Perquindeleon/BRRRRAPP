import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FindDealsPage() {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
            <Construction className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-3xl font-bold mb-2">Find Deals</h1>
            <p className="text-muted-foreground max-w-md mb-8">
                We are building a powerful engine to scrape and analyze off-market deals.
                This feature is coming in the next update.
            </p>
            <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
            </Link>
        </div>
    );
}
