import { AlertCircle, CheckCircle2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StructureTreeRowProps = {
  icon: LucideIcon;
  indent?: 0 | 1 | 2;
  label: string;
  status?: "pass" | "warn" | "error";
};

export const StructureTreeRow = ({
  icon: Icon,
  indent = 0,
  label,
  status,
}: StructureTreeRowProps) => {
  const indentClass = indent === 2 ? "pl-12" : indent === 1 ? "pl-6" : "pl-0";
  const iconTone =
    status === "error"
      ? "text-red-500"
      : status === "warn"
        ? "text-[var(--line-accent)]"
        : "text-[var(--line-muted)]";

  return (
    <div
      className={cn(
        "flex min-h-10 items-center gap-3 border-b border-[var(--line-border)] px-2 text-sm last:border-b-0",
        indentClass,
        status === "warn" && "bg-[var(--line-warning-surface)]",
      )}
    >
      <Icon aria-hidden="true" className={cn("size-3.5 shrink-0", iconTone)} />
      <code className="font-mono text-[12px] text-[var(--line-foreground)]">{label}</code>
      {status && (
        <span className="ml-auto inline-flex items-center">
          {status === "pass" ? (
            <CheckCircle2 aria-hidden="true" className="size-3.5 text-[var(--line-success)]" />
          ) : (
            <AlertCircle
              aria-hidden="true"
              className={cn(
                "size-3.5",
                status === "warn" ? "text-[var(--line-accent)]" : "text-red-500",
              )}
            />
          )}
        </span>
      )}
    </div>
  );
};

StructureTreeRow.displayName = "StructureTreeRow";
