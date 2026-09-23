import { cn } from "@/lib/utils"

/** An unfilled blank on the label, waiting for its print run. */
function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-[1px] border border-foreground/10 bg-secondary",
                className
            )}
            {...props}
        />
    )
}

export { Skeleton }
