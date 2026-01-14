"use client";

import React, { useState } from "react";

export function SimpleTooltip({ children, content }: { children: React.ReactNode, content: React.ReactNode }) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg z-50 pointer-events-none">
                    {content}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                </div>
            )}
        </div>
    );
}
