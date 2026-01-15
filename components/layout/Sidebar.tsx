
"use client";

import { SimpleDialog } from "@/components/ui/simple-dialog";
import { QuickCalculatorsContent } from "@/components/tools/QuickCalculators";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    BarChart3,
    Search,
    Calculator,
    Building,
    Hammer,
    Wallet,
    Bot,
    Settings,
    Menu,
    X,
    FolderOpen,
    Bookmark,
    LayoutDashboard,
    Users,
    LogOut
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// NAV_ITEMS moved inside component for translation support

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isCalcOpen, setIsCalcOpen] = useState(false);
    const { t } = useLanguage();
    const supabase = createClient();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/login');
    };

    const [expandedMenu, setExpandedMenu] = useState<string | null>("Projects"); // Default open for projects

    const NAV_ITEMS_TRANSLATED = [
        { label: t('sidebar.dashboard'), href: "/dashboard", icon: BarChart3 },
        { label: t('sidebar.find'), href: "/dashboard/find", icon: Search },
        { label: t('sidebar.analyze'), href: "/dashboard/analyze", icon: Calculator },
        { label: t('sidebar.saved'), href: "/dashboard/saved-deals", icon: Bookmark },
        { label: t('sidebar.properties'), href: "/dashboard/properties", icon: Building },
        {
            label: t('sidebar.projects'),
            href: "/dashboard/projects",
            icon: Hammer,
            children: [
                { label: "Overview", href: "/dashboard/projects", icon: LayoutDashboard },
                { label: "Contractors", href: "/dashboard/projects/contractors", icon: Users }
            ]
        },
        { label: t('sidebar.insights'), href: "/dashboard/insights", icon: Bot },
        { label: t('settings.title'), href: "/dashboard/settings", icon: Settings },
    ];

    const toggleMenu = (label: string) => {
        if (expandedMenu === label) {
            setExpandedMenu(null);
        } else {
            setExpandedMenu(label);
        }
    };

    return (
        <>
            {/* Mobile Header/Toggle */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b z-50 px-4 flex items-center justify-between">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-400">
                    BRRRR<span className="text-foreground">OS</span>
                </span>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-md hover:bg-accent focus:outline-none"
                    aria-label="Toggle Menu"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 overflow-y-auto",
                    isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="h-16 flex items-center px-6 border-b">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-400">
                            BRRRR<span className="text-foreground">OS</span>
                        </span>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {NAV_ITEMS_TRANSLATED.map((item) => {
                            const Icon = item.icon;
                            // Check isActive for parent or children
                            const isChildActive = item.children?.some(child => pathname === child.href);
                            const isActive = pathname === item.href || isChildActive;
                            const hasChildren = item.children && item.children.length > 0;
                            const isExpanded = expandedMenu === item.label;

                            return (
                                <div key={item.label}>
                                    {hasChildren ? (
                                        <button
                                            onClick={() => toggleMenu(item.label)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                                isActive
                                                    ? "bg-primary/10 text-primary" // Different style for parent of active child
                                                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground hover:scale-105 transition-all duration-200"
                                            )}
                                        >
                                            <div className="flex items-center">
                                                <Icon className="w-5 h-5 mr-3" />
                                                {item.label}
                                            </div>
                                            {/* Arrow Icon */}
                                            <div className="text-xs">{isExpanded ? '▼' : '▶'}</div>
                                        </button>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                                isActive
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground hover:scale-105 transition-all duration-200"
                                            )}
                                        >
                                            <Icon className="w-5 h-5 mr-3" />
                                            {item.label}
                                        </Link>
                                    )}

                                    {/* Submenu */}
                                    {hasChildren && isExpanded && (
                                        <div className="ml-10 space-y-1 mt-1 border-l-2 border-border pl-2 mb-2">
                                            {item.children?.map((child) => (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    onClick={() => setIsOpen(false)}
                                                    className={cn(
                                                        "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                                        pathname === child.href
                                                            ? "bg-muted text-foreground font-bold"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    {child.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* QUICK CALCULATOR BUTTON */}
                        <button
                            onClick={() => setIsCalcOpen(true)}
                            className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-violet-600 hover:bg-violet-50 mt-4 border border-dashed border-violet-200"
                        >
                            <Calculator className="w-5 h-5 mr-3" />
                            {t('sidebar.quick_tools')}
                        </button>
                    </nav>

                    {/* Footer (Logout) */}
                    <div className="p-4 border-t">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 hover:scale-105 transition-all duration-200"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Log out
                        </button>
                    </div>
                </div>
            </aside>

            {/* CALCULATOR MODAL */}
            <SimpleDialog
                isOpen={isCalcOpen}
                onClose={() => setIsCalcOpen(false)}
                title={<div className="flex items-center gap-2"><Calculator className="h-5 w-5 text-violet-600" /> <span className="text-violet-600">Quick Calculators</span></div>}
            >
                <QuickCalculatorsContent />
            </SimpleDialog>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
