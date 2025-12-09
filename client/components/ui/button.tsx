import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        bezel:
          "bg-primary text-primary-foreground border-[3px] border-primary/80 shadow-[inset_0_2px_8px_rgba(0,0,0,0.2),inset_0_-2px_4px_rgba(255,255,255,0.15)] ring-1 ring-primary/40 ring-offset-1 ring-offset-background hover:bg-primary/90 hover:shadow-[inset_0_3px_10px_rgba(0,0,0,0.25),inset_0_-2px_4px_rgba(255,255,255,0.1)] active:shadow-[inset_0_4px_12px_rgba(0,0,0,0.35)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.4),inset_0_-2px_4px_rgba(255,255,255,0.08)] dark:hover:shadow-[inset_0_3px_10px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(255,255,255,0.05)]",
        "bezel-secondary":
          "bg-secondary text-secondary-foreground border-[3px] border-border shadow-[inset_0_2px_8px_rgba(0,0,0,0.1),inset_0_-2px_4px_rgba(255,255,255,0.2)] ring-1 ring-border/50 ring-offset-1 ring-offset-background hover:bg-secondary/80 hover:shadow-[inset_0_3px_10px_rgba(0,0,0,0.15),inset_0_-2px_4px_rgba(255,255,255,0.15)] active:shadow-[inset_0_4px_12px_rgba(0,0,0,0.2)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(255,255,255,0.05)] dark:hover:shadow-[inset_0_3px_10px_rgba(0,0,0,0.4),inset_0_-2px_4px_rgba(255,255,255,0.03)]",
        "bezel-outline":
          "bg-background text-foreground border-[3px] border-border shadow-[inset_0_2px_8px_rgba(0,0,0,0.08),inset_0_-2px_4px_rgba(255,255,255,0.25)] ring-1 ring-border/50 ring-offset-1 ring-offset-background hover:bg-accent hover:text-accent-foreground hover:shadow-[inset_0_3px_10px_rgba(0,0,0,0.12),inset_0_-2px_4px_rgba(255,255,255,0.2)] active:shadow-[inset_0_4px_12px_rgba(0,0,0,0.18)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.25),inset_0_-2px_4px_rgba(255,255,255,0.03)] dark:hover:shadow-[inset_0_3px_10px_rgba(0,0,0,0.35),inset_0_-2px_4px_rgba(255,255,255,0.02)]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
