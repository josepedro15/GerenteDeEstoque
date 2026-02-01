"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Adapter matching Radix UI Slider API but using native input
// Expects value as number[]
interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value?: number[];
    max?: number;
    step?: number;
    onValueChange?: (value: number[]) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, value, onValueChange, max = 100, step = 1, ...props }, ref) => {
        const val = value && value.length > 0 ? value[0] : 0

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (onValueChange) {
                onValueChange([Number(e.target.value)])
            }
        }

        return (
            <input
                type="range"
                className={cn(
                    "w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400",
                    "range-sm",
                    className
                )}
                ref={ref}
                value={val}
                max={max}
                step={step}
                onChange={handleChange}
                {...props}
            />
        )
    }
)
Slider.displayName = "Slider"

export { Slider }
