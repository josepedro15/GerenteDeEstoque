"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
    onValueChange?: (value: number[]) => void;
    value?: number[];
    min?: number;
    max?: number;
    step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, onValueChange, value, min = 0, max = 100, step = 1, ...props }, ref) => {
        const currentValue = value?.[0] ?? min;
        const percentage = ((currentValue - min) / (max - min)) * 100;

        return (
            <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
                <input
                    ref={ref}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={currentValue}
                    onChange={(e) => {
                        const newVal = parseFloat(e.target.value);
                        onValueChange?.([newVal]);
                    }}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:h-5
                        [&::-webkit-slider-thumb]:w-5
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-primary
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-background
                        [&::-webkit-slider-thumb]:shadow-md
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:h-5
                        [&::-moz-range-thumb]:w-5
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-primary
                        [&::-moz-range-thumb]:border-2
                        [&::-moz-range-thumb]:border-background
                        [&::-moz-range-thumb]:cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, hsl(var(--primary)) ${percentage}%, hsl(var(--muted)) ${percentage}%)`
                    }}
                    {...props}
                />
            </div>
        );
    }
);

Slider.displayName = "Slider";

export { Slider };
