import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Badge = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => <span className={cn("inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--primary)_35%,transparent)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--primary)]", className)} {...props} />;
