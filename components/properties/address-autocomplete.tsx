"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";

interface Prediction {
    placePrediction: {
        place: string; /* resource name */
        placeId: string;
        text: {
            text: string;
            matches: { endOffset: number }[];
        };
        structuredFormat: {
            mainText: { text: string; };
            secondaryText: { text: string; };
        };
    };
}

export interface AddressAutocompleteProps {
    onSelect: (address: string, placeId: string) => void;
    defaultValue?: string;
    value?: string;
    onChange?: (value: string) => void;
    label?: string | null;
    disabled?: boolean;
    name?: string;
    className?: string;
    placeholder?: string;
}

export function AddressAutocomplete({
    onSelect,
    defaultValue = "",
    value,
    onChange,
    label = "Street Address",
    disabled = false,
    name,
    className,
    placeholder = "Search address..."
}: AddressAutocompleteProps) {
    const [internalInput, setInternalInput] = React.useState(defaultValue);
    const [predictions, setPredictions] = React.useState<Prediction[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    // Use controlled value if provided, otherwise internal state
    const inputValue = value !== undefined ? value : internalInput;

    const handleInputChange = (val: string) => {
        setInternalInput(val);
        if (onChange) onChange(val);
        setIsOpen(true);
    };

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (inputValue.length < 3) {
                setPredictions([]);
                // don't close immediately if user is just deleting
                return;
            }

            if (!isOpen && inputValue === defaultValue) return; // Don't search on initial load if matching

            setIsLoading(true);
            try {
                const response = await fetch("/api/places/autocomplete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        input: inputValue,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setPredictions(data.suggestions || []);
                    if (document.activeElement === wrapperRef.current?.querySelector('input')) {
                        setIsOpen(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch suggestions:", error);
            } finally {
                setIsLoading(false);
            }
        }, 500); // Debounce 500ms

        return () => clearTimeout(timer);
    }, [inputValue, isOpen, defaultValue]);

    const handleSelect = (prediction: Prediction) => {
        const address = prediction.placePrediction.text.text;
        handleInputChange(address);
        setIsOpen(false);
        onSelect(address, prediction.placePrediction.placeId);
    };

    return (
        <div className="space-y-2 relative" ref={wrapperRef}>
            {label && <Label>{label} <span className="text-red-500">*</span></Label>}
            <div className="relative">
                <Input
                    name={name}
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete="off"
                    className={className}
                />
                {isLoading && (
                    <div className="absolute right-3 top-2.5">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}

                {isOpen && predictions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                        {predictions.map((p) => (
                            <div
                                key={p.placePrediction.placeId}
                                className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-start text-sm"
                                onClick={() => handleSelect(p)}
                            >
                                <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="font-medium">{p.placePrediction.structuredFormat.mainText.text}</div>
                                    <div className="text-xs text-muted-foreground">{p.placePrediction.structuredFormat.secondaryText.text}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
