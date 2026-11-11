import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-red-600 text-white shadow hover:bg-red-700 active:bg-red-800",
        destructive:
          "bg-red-900/80 text-red-100 hover:bg-red-900",
        outline:
          "border border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-800 hover:text-white",
        secondary:
          "bg-neutral-800 text-neutral-200 shadow-sm hover:bg-neutral-700",
        ghost:
          "hover:bg-neutral-800 hover:text-neutral-100 text-neutral-300",
        link:
          "text-red-500 underline-offset-4 hover:underline",
        fighter:
          "bg-[#E63946] text-white font-semibold tracking-wide shadow-lg shadow-red-900/30 hover:bg-[#d62839] active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
