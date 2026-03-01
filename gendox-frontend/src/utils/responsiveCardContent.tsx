import { forwardRef, HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ResponsiveCardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export const ResponsiveCardContent = forwardRef<
  HTMLDivElement,
  ResponsiveCardContentProps
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "py-8 px-4 sm:px-16",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

ResponsiveCardContent.displayName = "ResponsiveCardContent"
