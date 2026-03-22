import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        const variants = {
            default: "public-button-primary shadow-sm",
            destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
            outline: "public-button-secondary",
            secondary: "surface-chip hover:bg-[var(--surface-elevated)] text-[var(--text-primary)]",
            ghost: "hover:bg-[var(--surface-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            link: "public-link underline-offset-4 hover:underline",
        }

        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10",
        }

        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                    variants[variant],
                    sizes[size],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
