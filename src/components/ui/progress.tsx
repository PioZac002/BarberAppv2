import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

/** Progress is the same liquid as everywhere else, read on its side: a
 *  glaze field advancing to an exact line, with the meniscus at its edge. */
const Progress = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
    <ProgressPrimitive.Root
        ref={ref}
        className={cn(
            "relative h-2.5 w-full overflow-hidden rounded-[1px] border border-foreground/25 bg-secondary",
            className
        )}
        {...props}
    >
        <ProgressPrimitive.Indicator
            className="relative h-full bg-primary transition-[width] duration-700 ease-out-liquid after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-tile/90"
            style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }}
        />
    </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
