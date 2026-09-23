import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Buttons are printed controls, not pills. Corners are cut at 2px, the
 * lettering is the condensed label cut, and the secondary variants fill
 * with glaze from the bottom on hover — the same liquid gesture that
 * carries occupancy and progress everywhere else in the product.
 */
const buttonVariants = cva(
    "relative isolate inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] " +
    "label-caps transition-[transform,background-color,color,box-shadow] duration-200 " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
    "disabled:pointer-events-none disabled:opacity-45 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow-plate hover:-translate-y-px hover:shadow-plate-lift active:translate-y-0 active:shadow-none",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-plate hover:-translate-y-px hover:shadow-plate-lift active:translate-y-0 active:shadow-none",
                outline:
                    "overflow-hidden border border-foreground/70 bg-transparent text-foreground " +
                    "before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:bg-primary " +
                    "before:transition-transform before:duration-300 before:ease-out-liquid " +
                    "hover:border-primary hover:text-primary-foreground hover:before:scale-y-100",
                secondary:
                    "overflow-hidden border border-transparent bg-secondary text-secondary-foreground " +
                    "before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:bg-primary " +
                    "before:transition-transform before:duration-300 before:ease-out-liquid " +
                    "hover:text-primary-foreground hover:before:scale-y-100",
                ghost:
                    "text-foreground hover:bg-accent hover:text-accent-foreground",
                link:
                    "stretch-normal normal-case tracking-normal text-primary underline underline-offset-4 decoration-1 hover:decoration-2",
            },
            size: {
                default: "h-10 px-5 text-[0.8125rem]",
                sm: "h-9 px-3.5 text-[0.75rem]",
                lg: "h-12 px-8 text-[0.9375rem]",
                icon: "h-10 w-10 px-0",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
