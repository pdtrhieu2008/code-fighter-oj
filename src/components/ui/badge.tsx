import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-red-600/90 text-white shadow hover:bg-red-700",
        secondary:
          "border-transparent bg-neutral-800 text-neutral-300 hover:bg-neutral-700",
        destructive:
          "border-transparent bg-red-950 text-red-400 border-red-900/50",
        outline: "border-neutral-700 text-neutral-300",
        success:
          "border-emerald-900/40 bg-emerald-950/60 text-emerald-400",
        warning:
          "border-yellow-900/40 bg-yellow-950/60 text-yellow-400",
        info:
          "border-blue-900/40 bg-blue-950/60 text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
