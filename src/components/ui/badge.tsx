import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Every state in this product is a stamp. Line style carries the meaning
 * alongside colour — dashed is waiting, solid is booked, double is done,
 * struck is void, dotted is a miss — so the state survives both themes
 * and colour-blind reading without a legend.
 */
const badgeVariants = cva("stamp", {
    variants: {
        variant: {
            default: "stamp--confirmed",
            secondary: "stamp--pending",
            destructive: "stamp--alert",
            void: "stamp--void",
            outline: "border-solid text-foreground/75",
            done: "stamp--done",
            absent: "stamp--absent",
        },
    },
    defaultVariants: { variant: "default" },
})

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
