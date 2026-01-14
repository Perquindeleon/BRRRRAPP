"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingInputProps {
    name?: string;
    value: number;
    onChange?: (value: number) => void;
    max?: number;
}

export function StarRatingInput({ name, value, onChange, max = 5 }: StarRatingInputProps) {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    return (
        <div className="flex gap-1">
            {name && <input type="hidden" name={name} value={value} />}
            {Array.from({ length: max }).map((_, i) => {
                const starValue = i + 1;
                const isActive = starValue <= (hoverValue || value);

                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onChange?.(starValue)}
                        onMouseEnter={() => setHoverValue(starValue)}
                        onMouseLeave={() => setHoverValue(null)}
                        className={`transition-colors focus:outline-none focus-visible:ring-2 ring-violet-400 rounded-sm ${isActive ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                        <Star className={`h-6 w-6 ${isActive ? 'fill-current' : ''}`} />
                    </button>
                );
            })}
        </div>
    );
}
