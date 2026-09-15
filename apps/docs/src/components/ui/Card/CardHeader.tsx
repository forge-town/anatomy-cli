import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export const CardHeader = ({ className, ...props }: CardHeaderProps) => (
  <div className={cn("p-6", className)} {...props} />
);
CardHeader.displayName = "CardHeader";
