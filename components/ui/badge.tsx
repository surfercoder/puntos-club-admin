import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-xs border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-3 focus:ring-gray-300 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-gray-200 bg-gray-100 text-black shadow-xs hover:bg-gray-200",
        secondary:
          "border-gray-200 bg-gray-200 text-black hover:bg-gray-300",
        destructive:
          "border-red-200 bg-red-100 text-red-800 shadow-xs hover:bg-red-200",
        outline: "text-black border-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
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
