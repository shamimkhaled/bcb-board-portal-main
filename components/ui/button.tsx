import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ds text-sm font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-ds hover:bg-primary-hover",
        secondary: "bg-bcb-navy text-white hover:opacity-90",
        outline: "border border-slate-200 bg-white text-bcb-ink hover:bg-slate-50 hover:border-slate-300",
        ghost: "text-bcb-ink hover:bg-slate-100/80",
        danger: "bg-destructive text-destructive-foreground hover:opacity-90",
        gold: "bg-accent text-accent-foreground hover:opacity-90 shadow-ds"
      },
      size: {
        default: "min-h-11 h-11 px-4 py-2",
        sm: "min-h-9 h-9 px-3 text-xs",
        lg: "min-h-12 h-12 px-5 text-base",
        icon: "min-h-11 h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
