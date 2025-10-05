import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const logoVariants = cva(
  "inline-flex items-center justify-center shrink-0",
  {
    variants: {
      size: {
        sm: "size-6",
        default: "size-10", 
        lg: "size-12",
        xl: "size-16",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const Logo = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof logoVariants>
>(({ className, size, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="logo"
      className={cn(logoVariants({ size, className }))}
      {...props}
    >
      <svg
        className="size-full"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="logo-mask">
            <rect x="0" y="0" width="100" height="100" rx="20" ry="20" fill="white" />
            <rect x="25" y="25" width="50" height="50" rx="8" ry="8" fill="black" />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          rx="20"
          ry="20"
          className="fill-primary"
          mask="url(#logo-mask)"
        />
      </svg>
    </div>
  )
})

Logo.displayName = "Logo"

export { Logo, logoVariants }
