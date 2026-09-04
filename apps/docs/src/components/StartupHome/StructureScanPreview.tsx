import {
  Braces,
  CheckCircle2,
  FileCode2,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { StructureTreeRow } from "./StructureTreeRow";

export const scanRows = [
  { icon: FolderOpen, label: "src/", status: "pass" as const },
  { icon: Folder, label: "components/", indent: 1 as const, status: "pass" as const },
  { icon: Folder, label: "ui/", indent: 2 as const, status: "pass" as const },
  { icon: Folder, label: "routes/", indent: 1 as const, status: "pass" as const },
  { icon: Folder, label: "lib/", indent: 1 as const, status: "pass" as const },
  { icon: Folder, label: "tests/", indent: 1 as const, status: "pass" as const },
  { icon: Folder, label: "legacy/", indent: 1 as const, status: "warn" as const },
];

const definitionExample = `{
  "root": {
    "children": [
      {
        "kind": "directory",
        "name": { "type": "literal", "value": "src" },
        "quantity": "exactly_one",
        "children": [
          {
            "kind": "directory",
            "name": { "type": "literal", "value": "components" },
            "quantity": "exactly_one",
            "children": [
              {
                "kind": "directory",
                "name": { "type": "literal", "value": "ui" },
                "quantity": "exactly_one",
                "children": []
              }
            ]
          },
          {
            "kind": "directory",
            "name": { "type": "literal", "value": "routes" },
            "quantity": "exactly_one",
            "children": []
          },
          {
            "kind": "directory",
            "name": { "type": "literal", "value": "lib" },
            "quantity": "exactly_one",
            "children": []
          },
          {
            "kind": "directory",
            "name": { "type": "literal", "value": "tests" },
            "quantity": "exactly_one",
            "children": []
          }
        ]
      }
    ]
  }
}`;

const humanDefinitionRows = [
  { key: "definitionRootRule", path: "src/" },
  { key: "definitionComponentsRule", path: "src/components/" },
  { key: "definitionUiRule", path: "src/components/ui/" },
  { key: "definitionRoutesRule", path: "src/routes/" },
  { key: "definitionLibRule", path: "src/lib/" },
  { key: "definitionTestsRule", path: "src/tests/" },
] as const;

export const StructureScanPreview = ({ onStageChange }: { onStageChange?: (stage: number) => void }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [scanStage, setScanStage] = useState(0);
  const [showJson, setShowJson] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const node = previewRef.current;
    if (!node) return;
    let frame = 0;
    const updateStage = () => {
      const rect = node.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const start = window.innerHeight * 0.84;
      const end = window.innerHeight * 0.5;
      const progress = Math.max(0, Math.min(1, (start - center) / (start - end)));
      const nextStage = Math.min(scanRows.length, Math.ceil(progress * scanRows.length));
      setScanStage((current) => Math.max(current, nextStage));
    };
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateStage);
    };
    updateStage();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateStage);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateStage);
    };
  }, []);

  useEffect(() => {
    onStageChange?.(scanStage);
  }, [onStageChange, scanStage]);

  return (
    <div ref={previewRef} data-scan-stage={scanStage} className="grid overflow-hidden bg-[var(--line-surface)] text-left md:grid-cols-2">
      <div className="border-b border-[var(--line-border)] px-5 py-6 md:border-b-0 md:border-r md:px-8 md:py-8">
        <div className="flex h-8 items-center justify-between gap-4 border-b border-[var(--line-border)]">
          <div className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--line-muted)]">
            <FileCode2 aria-hidden="true" className="size-3.5 shrink-0 text-[var(--line-accent)]" />{" "}
            {showJson ? "anatomy.json" : t("startup.definitionHumanLabel")}
          </div>
          <Button
            aria-label={showJson ? t("startup.definitionHumanToggle") : t("startup.definitionJsonToggle")}
            aria-pressed={showJson}
            className="size-7 shrink-0 rounded-sm border-0 bg-transparent p-0 text-[var(--line-muted)] shadow-none hover:bg-[var(--line-hover)] hover:text-[var(--line-foreground)]"
            size="icon"
            title={showJson ? t("startup.definitionHumanToggle") : t("startup.definitionJsonToggle")}
            variant="ghost"
            onClick={() => setShowJson((current) => !current)}
          >
            <Braces aria-hidden="true" className="size-3.5" />
          </Button>
        </div>
        <div className="relative mt-5 h-[20rem] overflow-hidden">
          <div aria-hidden={showJson} className={`absolute inset-0 overflow-y-auto pr-3 transition-[opacity,transform] duration-300 ease-out ${showJson ? "pointer-events-none -translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}>
            <p className="text-base font-medium leading-7 tracking-[-0.01em] text-[var(--line-foreground)]">{t("startup.definitionHumanIntro")}</p>
            <div className="mt-5 space-y-3 font-mono text-xs text-[var(--line-muted)]">
              {humanDefinitionRows.map((row, index) => (
                <div
                  className="flex min-w-0 items-center gap-3 border-b border-[var(--line-border)] pb-3 last:border-b-0"
                  key={row.key}
                >
                  <span className="w-5 shrink-0 text-[10px] text-[var(--line-accent)]">0{index + 1}</span>
                  <code className="shrink-0 text-[var(--line-foreground)]">{row.path}</code>
                  <span className="min-w-0 flex-1 truncate" title={t(`startup.${row.key}`)}>
                    {t(`startup.${row.key}`)}
                  </span>
                  <CheckCircle2 aria-hidden="true" className="ml-auto size-3.5 shrink-0 text-[var(--line-success)]" />
                </div>
              ))}
            </div>
          </div>
          <pre aria-hidden={!showJson} className={`absolute inset-0 overflow-y-auto overscroll-contain whitespace-pre-wrap break-words pr-3 font-mono text-[11px] leading-5 transition-[opacity,transform] duration-300 ease-out sm:text-xs ${showJson ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}>
            {definitionExample}
          </pre>
        </div>
      </div>
      <div className="bg-[var(--line-surface-raised)] px-5 py-6 md:px-8 md:py-8">
        <div className="flex h-8 items-center gap-2 border-b border-[var(--line-border)] font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--line-muted)]">
          <FolderOpen aria-hidden="true" className="size-3.5 text-[var(--line-accent)]" /> src/
        </div>
        <div className="mt-5">
          {scanRows.map((row, index) => (
            <div className={cn("transition-[opacity,transform] duration-500", scanStage > index ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")} key={row.label}>
              <StructureTreeRow icon={row.icon} label={row.label} indent={row.indent} status={row.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

StructureScanPreview.displayName = "StructureScanPreview";
