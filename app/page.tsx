import Link from "next/link";
import {
    ArrowRight, BarChart3, Calculator, Hammer, Wallet, LogIn, UserPlus,
    TrendingUp, Shield, Zap, CheckCircle2, Star, Building2, DollarSign,
    Users, RefreshCw, Search, Wrench, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col bg-[#050810] text-white overflow-x-hidden">

            {/* ── NAV ─────────────────────────────────────────────────────── */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#050810]/80 backdrop-blur-md">
                <div className="container flex h-16 max-w-screen-xl items-center justify-between px-4">
                    <div className="flex items-center gap-2 font-black text-xl tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">BRRRR</span>
                        <span className="text-white">OS</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#how" className="hover:text-white transition-colors">How it works</a>
                        <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login">
                            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                                <LogIn className="mr-2 h-4 w-4" /> Sign In
                            </Button>
                        </Link>
                        <Link href="/login?view=register">
                            <Button size="sm" className="bg-teal-500 hover:bg-teal-400 text-black font-bold">
                                Get Started Free <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO ────────────────────────────────────────────────────── */}
            <section className="relative flex flex-col items-center justify-center pt-40 pb-28 px-4 text-center">
                {/* Glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-teal-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm text-teal-400 font-medium mb-8">
                        <Zap className="h-3.5 w-3.5" /> v1.0 Now Live — Built for BRRRR investors
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
                        The Operating System<br />for{" "}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-blue-400 to-indigo-400">
                            Real Estate Investors
                        </span>
                    </h1>

                    <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                        Analyze deals in seconds, manage tenants, track rehabs, assign contractors, and watch your portfolio grow — all from one dashboard.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/login?view=register">
                            <Button size="lg" className="h-14 px-8 text-base bg-teal-500 hover:bg-teal-400 text-black font-bold shadow-lg shadow-teal-500/25">
                                Start for Free — No Credit Card
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <a href="#features">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-white/20 text-white hover:bg-white/10 hover:border-white/40">
                                See All Features
                            </Button>
                        </a>
                    </div>

                    {/* Social proof bar */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/50">
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-teal-400" /> Free forever plan</span>
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-teal-400" /> No setup fees</span>
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-teal-400" /> Cancel anytime</span>
                        <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-teal-400" /> Bank-level security</span>
                    </div>
                </div>
            </section>

            {/* ── STATS STRIP ─────────────────────────────────────────────── */}
            <section className="border-y border-white/10 bg-white/5 py-10">
                <div className="container max-w-screen-xl px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { value: "$2.4M+", label: "Deals Analyzed" },
                            { value: "1,200+", label: "Active Investors" },
                            { value: "98%",    label: "Satisfaction Rate" },
                            { value: "4.9 ★",  label: "Average Rating" },
                        ].map(s => (
                            <div key={s.label}>
                                <p className="text-3xl font-black text-white">{s.value}</p>
                                <p className="text-sm text-white/50 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ────────────────────────────────────────────────── */}
            <section id="features" className="py-24 px-4">
                <div className="container max-w-screen-xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-3">Everything you need</p>
                        <h2 className="text-4xl sm:text-5xl font-black">Built for the entire BRRRR cycle</h2>
                        <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">From finding deals to closing them — every tool in one place.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map(f => (
                            <div key={f.title} className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-teal-500/40 hover:bg-white/10 transition-all">
                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${f.iconBg}`}>
                                    <f.icon className={`h-6 w-6 ${f.iconColor}`} />
                                </div>
                                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                                {f.badge && (
                                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal-400 bg-teal-400/10 border border-teal-400/20 px-2 py-0.5 rounded-full">
                                        {f.badge}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
            <section id="how" className="py-24 px-4 border-t border-white/10 bg-white/[0.02]">
                <div className="container max-w-screen-xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-3">Simple process</p>
                        <h2 className="text-4xl sm:text-5xl font-black">From lead to portfolio in 4 steps</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                        {STEPS.map((step, i) => (
                            <div key={step.title} className="relative flex flex-col items-center text-center p-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-blue-500/20 border border-teal-500/30 flex items-center justify-center mb-4 text-2xl font-black text-teal-400">
                                    {i + 1}
                                </div>
                                <step.icon className="h-6 w-6 text-white/40 mb-3" />
                                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                                <p className="text-white/50 text-sm">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ────────────────────────────────────────────── */}
            <section id="testimonials" className="py-24 px-4 border-t border-white/10">
                <div className="container max-w-screen-xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-3">Trusted by investors</p>
                        <h2 className="text-4xl sm:text-5xl font-black">What our users say</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TESTIMONIALS.map(t => (
                            <div key={t.name} className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4">
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <p className="text-white/70 text-sm leading-relaxed italic">"{t.quote}"</p>
                                <div className="mt-auto flex items-center gap-3 pt-4 border-t border-white/10">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{t.name}</p>
                                        <p className="text-xs text-white/40">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PRICING ─────────────────────────────────────────────────── */}
            <section id="pricing" className="py-24 px-4 border-t border-white/10 bg-white/[0.02]">
                <div className="container max-w-screen-xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-3">Simple pricing</p>
                        <h2 className="text-4xl sm:text-5xl font-black">Start free, scale when ready</h2>
                        <p className="mt-4 text-white/50 text-lg">No hidden fees. No contracts. Cancel anytime.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {/* Free */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col">
                            <p className="text-sm font-bold text-white/50 uppercase tracking-widest mb-2">Free</p>
                            <p className="text-5xl font-black mb-1">$0</p>
                            <p className="text-white/40 text-sm mb-6">Forever free</p>
                            <ul className="space-y-3 text-sm text-white/70 flex-1">
                                {["3 properties", "BRRRR & Flip analyzer", "Tenant management", "Maintenance requests", "Deal finder"].map(f => (
                                    <li key={f} className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />{f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/login?view=register" className="mt-8">
                                <Button className="w-full h-12 bg-white/10 hover:bg-white/20 text-white border border-white/20">
                                    Get Started Free
                                </Button>
                            </Link>
                        </div>
                        {/* Pro */}
                        <div className="rounded-2xl border border-teal-500/50 bg-gradient-to-br from-teal-500/10 to-blue-500/10 p-8 flex flex-col relative overflow-hidden">
                            <div className="absolute top-4 right-4 bg-teal-500 text-black text-xs font-black px-2.5 py-1 rounded-full">POPULAR</div>
                            <p className="text-sm font-bold text-teal-400 uppercase tracking-widest mb-2">Pro</p>
                            <p className="text-5xl font-black mb-1">$29<span className="text-2xl text-white/50">/mo</span></p>
                            <p className="text-white/40 text-sm mb-6">Billed monthly</p>
                            <ul className="space-y-3 text-sm text-white/70 flex-1">
                                {["Unlimited properties", "Everything in Free", "AI Deal Insights", "Contractor management", "Expense tracking", "Priority support"].map(f => (
                                    <li key={f} className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />{f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/login?view=register" className="mt-8">
                                <Button className="w-full h-12 bg-teal-500 hover:bg-teal-400 text-black font-bold shadow-lg shadow-teal-500/25">
                                    Start Pro Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ──────────────────────────────────────────────── */}
            <section className="py-24 px-4 border-t border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-teal-500/10 rounded-full blur-3xl" />
                </div>
                <div className="container max-w-3xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl sm:text-5xl font-black mb-4">
                        Ready to scale your portfolio?
                    </h2>
                    <p className="text-white/50 text-lg mb-10">
                        Join investors already using BRRR OS to find, analyze, and manage their real estate empire.
                    </p>
                    <Link href="/login?view=register">
                        <Button size="lg" className="h-14 px-10 text-base bg-teal-500 hover:bg-teal-400 text-black font-bold shadow-xl shadow-teal-500/30">
                            Create Your Free Account
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────────────── */}
            <footer className="border-t border-white/10 py-8 px-4">
                <div className="container max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
                    <div className="font-black text-white/60">
                        <span className="text-teal-400">BRRRR</span>OS
                    </div>
                    <p>© {new Date().getFullYear()} BRRROS. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
                    </div>
                </div>
            </footer>

        </main>
    );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
    {
        icon: Search,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-400",
        title: "Deal Finder",
        desc: "Search active listings and off-market records by zip code or city. Get instant rent estimates and property data.",
        badge: "Powered by RentCast",
    },
    {
        icon: Calculator,
        iconBg: "bg-teal-500/10",
        iconColor: "text-teal-400",
        title: "BRRRR Analyzer",
        desc: "Run full deal analysis in seconds. Cash-on-cash return, ROI, 70% rule, equity left-in-deal, and refi projections.",
    },
    {
        icon: Hammer,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-400",
        title: "Flip/Fix Analyzer",
        desc: "Estimate profits on fix-and-flip deals with holding costs, closing costs, ROI, and break-even calculations.",
    },
    {
        icon: Building2,
        iconBg: "bg-indigo-500/10",
        iconColor: "text-indigo-400",
        title: "Portfolio Tracker",
        desc: "Track equity, cash flow, ROI, and property value across your entire portfolio — SFH, apartments, multifamily.",
    },
    {
        icon: Users,
        iconBg: "bg-purple-500/10",
        iconColor: "text-purple-400",
        title: "Tenant Management",
        desc: "Manage tenants, leases, contracts, and rent. Co-living support and AI email composer included.",
    },
    {
        icon: Wrench,
        iconBg: "bg-rose-500/10",
        iconColor: "text-rose-400",
        title: "Maintenance Requests",
        desc: "Tenants submit repair requests with photos. You assign contractors, track status, and log expenses.",
        badge: "Tenant portal included",
    },
    {
        icon: RefreshCw,
        iconBg: "bg-teal-500/10",
        iconColor: "text-teal-400",
        title: "Rehab Management",
        desc: "Track rehab items by category, contractor, and status. See estimated vs actual costs in real time.",
    },
    {
        icon: DollarSign,
        iconBg: "bg-green-500/10",
        iconColor: "text-green-400",
        title: "Cash Flow Dashboard",
        desc: "Monthly and annual cash flow, maintenance expenses by category, and equity growth charts.",
    },
    {
        icon: BarChart3,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-400",
        title: "AI Insights",
        desc: "Get AI-powered deal analysis, market commentary, and personalized recommendations for each property.",
        badge: "Powered by Claude AI",
    },
];

const STEPS = [
    { icon: Search,    title: "Find a Deal",     desc: "Search listings by zip or city. Get comps, rent estimates, and property data instantly." },
    { icon: Calculator, title: "Analyze It",     desc: "Run BRRRR or Flip numbers in seconds. Know your ROI before making an offer." },
    { icon: Hammer,    title: "Execute the Rehab", desc: "Track rehab items, assign contractors, and manage timelines from your dashboard." },
    { icon: TrendingUp, title: "Grow & Repeat",  desc: "Manage tenants, track cash flow, and identify your next deal — all in one place." },
];

const TESTIMONIALS = [
    {
        name: "Marcus T.",
        role: "BRRRR Investor · 12 doors",
        quote: "BRRROS cut my deal analysis time from 2 hours to 5 minutes. The BRRRR calculator is incredibly accurate and saves me from costly mistakes.",
    },
    {
        name: "Sofia R.",
        role: "Real Estate Investor · Miami, FL",
        quote: "The tenant portal is a game changer. My tenants submit maintenance requests with photos and I just assign it to a contractor. Done.",
    },
    {
        name: "James K.",
        role: "Portfolio Investor · 28 units",
        quote: "Finally one tool that does everything. Deal analysis, rehab tracking, tenant management. I cancelled 3 other subscriptions.",
    },
];
