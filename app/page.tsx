import Link from "next/link";
import { ArrowRight, BarChart3, Calculator, Hammer, Wallet, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col bg-background">
            {/* Navigation Bar */}
            <nav className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 max-w-screen-xl items-center justify-between px-4">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-blue-600">
                            BRRRR
                        </span>
                        <span className="text-foreground">Suite</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost" size="sm">
                                <LogIn className="mr-2 h-4 w-4" />
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/login?view=register">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Sign Up
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="flex flex-col items-center justify-center flex-1 px-4 py-20 text-center lg:py-32">
                <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium">
                    🎉 <span className="ml-2">v1.0 Now Live</span>
                </div>

                <h1 className="mt-8 text-5xl font-extrabold tracking-tight lg:text-7xl">
                    Real Estate Investing <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500">
                        Simplified.
                    </span>
                </h1>

                <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                    The ultimate tool for the BRRRR method. Analyze deals, calculate rehab costs, track cash flow, and manage your portfolio—all in one place.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    <Link href="/login?view=register">
                        <Button size="lg" className="w-full sm:w-auto text-lg h-12 bg-primary text-primary-foreground hover:bg-primary/90">
                            Get Started Free
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                    <Link href="#features">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg h-12">
                            Learn Requirements
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Features Grid */}
            <div id="features" className="container max-w-screen-xl py-20 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FeatureCard
                        icon={<Calculator className="h-8 w-8 text-emerald-500" />}
                        title="Smart Analysis"
                        description="Run numbers instantly. Calculate Cash on Cash return, ROI, and 70% Rule compliance."
                    />
                    <FeatureCard
                        icon={<Hammer className="h-8 w-8 text-amber-500" />}
                        title="Rehab Estimator"
                        description="Create detailed renovation budgets. Track material and labor costs."
                    />
                    <FeatureCard
                        icon={<Wallet className="h-8 w-8 text-blue-500" />}
                        title="Portfolio Tracker"
                        description="Monitor your total equity, cash flow, and net worth across all properties."
                    />
                    <FeatureCard
                        icon={<BarChart3 className="h-8 w-8 text-purple-500" />}
                        title="Market Insights"
                        description="AI-powered predictions for ARV and rental trends in your target area."
                    />
                </div>
            </div>

        </main>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="group relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 rounded-lg bg-background p-2 w-fit border border-border/50">
                {icon}
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
    )
}
