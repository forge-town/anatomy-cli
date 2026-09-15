import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export type CardContentProps = HTMLAttributes<HTMLDivElement>;

export const CardContent = ({ className, ...props }: CardContentProps) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";
