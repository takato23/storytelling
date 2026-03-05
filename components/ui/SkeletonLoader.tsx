import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string
    variant?: "default" | "circular" | "card" | "text"
}

export function SkeletonLoader({ className, variant = "default", ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden bg-charcoal-100/50 animate-pulse",
                variant === "circular" && "rounded-full",
                variant === "card" && "rounded-xl",
                variant === "text" && "rounded-md h-4 w-full",
                variant === "default" && "rounded-md",
                className
            )}
            {...props}
        >
            <div
                className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"
                style={{
                    backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)'
                }}
            />
        </div>
    )
}
