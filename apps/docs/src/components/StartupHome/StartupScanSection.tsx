import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { scanRows, StructureScanPreview } from "./StructureScanPreview";

export const StartupScanSection = () => {
  const { t } = useTranslation();
  const [scanStage, setScanStage] = useState(0);
  const matchingRows = scanRows.filter((row) => row.status === "pass").length;
  const warningRows = scanRows.filter((row) => row.status === "warn").length;
  const scanComplete = scanStage >= scanRows.length;

  return (
    <section id="scan" className="relative w-full border-y border-[var(--line-border)] bg-[var(--line-background)] px-4 pt-0 md:px-8">
      <div className="mx-auto max-w-7xl">
        <StructureScanPreview onStageChange={setScanStage} />
        <div className={cn("grid gap-5 border-t border-[var(--line-border)] px-5 py-4 transition-[opacity,transform] duration-500 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8 md:px-8", scanComplete ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0")}>
          <div className="min-w-0">
            <p className="max-w-xl text-base font-medium leading-7 tracking-[-0.01em] text-[var(--line-foreground)]">{t("startup.scanResultDescription")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs">
            <span className="inline-flex items-center gap-2 text-[var(--line-success)]"><CheckCircle2 aria-hidden="true" className="size-3.5" />{matchingRows} {t("startup.previewMatches")}</span>
            <span className="inline-flex items-center gap-2 text-[var(--line-accent)]"><AlertCircle aria-hidden="true" className="size-3.5" />{warningRows} {t("startup.previewWarnings")}</span>
            <span className="text-[var(--line-muted)]">{scanRows.length} {t("startup.previewEntries")}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

StartupScanSection.displayName = "StartupScanSection";
