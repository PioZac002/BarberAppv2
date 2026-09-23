import * as React from "react"

import { cn } from "@/lib/utils"

/** A field is a blank ruled into the label: square, inked border, no pill. */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-11 w-full rounded-[2px] border border-foreground/45 bg-background px-3 py-2 text-base",
                    "transition-[border-color,box-shadow] duration-200",
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                    "placeholder:text-muted-foreground",
                    "hover:border-foreground/70",
                    "focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "aria-[invalid=true]:border-destructive aria-[invalid=true]:outline-destructive",
                    "md:text-sm",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
