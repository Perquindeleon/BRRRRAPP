"use client";

import * as React from "react";
import { Input, InputProps } from "@/components/ui/input";
import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormattedCurrencyInputProps extends Omit<InputProps, "value" | "onChange"> {
    value: number;
    onChange: (value: number) => void;
    icon?: React.ComponentType<any>;
    allowNegative?: boolean;
}

export function FormattedCurrencyInput({
    value,
    onChange,
    icon: Icon = DollarSign,
    allowNegative = false,
    className,
    ...props
}: FormattedCurrencyInputProps) {
    // We keep the input type="text" always to allow commas
    // We update local state immediately for responsiveness
    // We propagate number value to parent via onChange

    // When value comes from parent (e.g. initial load), we format it.
    // When user types, we format on the fly.

    const [localValue, setLocalValue] = React.useState("");

    React.useEffect(() => {
        if (value === 0 || value === null || value === undefined) {
            setLocalValue("");
        } else {
            setLocalValue(value.toLocaleString("en-US", { maximumFractionDigits: 0 }));
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const numbersOnly = raw.replace(/[^0-9]/g, "");

        // Update parent with number
        const num = parseFloat(numbersOnly);
        if (Number.isNaN(num)) {
            onChange(0);
        } else {
            onChange(num);
        }

        // Update local display with formatting
        if (numbersOnly === "") {
            setLocalValue("");
        } else {
            const formatted = Number(numbersOnly).toLocaleString("en-US", { maximumFractionDigits: 0 });
            setLocalValue(formatted);
        }
    };

    return (
        <div className="relative">
            <Icon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                {...props}
                type="text"
                className={cn("pl-9", className)}
                value={localValue}
                onChange={handleChange}
                placeholder="0"
            />
            {/* Warning for negative values if not allowed */}
            {!allowNegative && value < 0 && (
                <p className="text-[10px] text-red-500 absolute -bottom-4 right-0">Negative value?</p>
            )}
        </div>
    );
}
