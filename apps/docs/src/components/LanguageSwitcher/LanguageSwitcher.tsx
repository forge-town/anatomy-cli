import { Select } from "@base-ui/react/select";
import { Check, ChevronDown, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { value: "zh", labelKey: "common.chinese" },
  { value: "en", labelKey: "common.english" },
] as const;

export type LanguageSwitcherProps = {
  immersive?: boolean;
  mono?: boolean;
  startup?: boolean;
};

export const LanguageSwitcher = ({
  immersive = false,
  mono = false,
  startup = false,
}: LanguageSwitcherProps) => {
  const { i18n, t } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage ?? i18n.language ?? "zh").startsWith("en")
    ? "en"
    : "zh";
  const triggerClassName = cn(
    "group inline-flex h-9 items-center gap-1.5 rounded-full border px-3 font-mono text-[10px] font-semibold tracking-[0.08em] outline-none transition-colors",
    startup
      ? "border-[var(--line-border)] bg-transparent text-[var(--line-muted)] hover:border-[var(--line-border-strong)] hover:bg-[var(--line-hover)] hover:text-[var(--line-foreground)]"
      : immersive
        ? "border-white/15 bg-white/[0.04] text-white/70 hover:border-white/35 hover:bg-white/[0.08]"
        : mono
          ? "border-[#26352e]/35 bg-transparent text-[#26352e]/75 hover:border-[#d9654b] hover:bg-[#dbe5dd] hover:text-[#26352e]"
          : "border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--foreground)]",
  );
  const popupClassName = cn(
    "w-full overflow-hidden p-1 outline-none transition-[opacity,transform] duration-150 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0",
    startup
      ? "rounded-md border border-[var(--line-border)] bg-[var(--line-surface-raised)] text-[var(--line-foreground)] shadow-none"
      : mono
        ? "rounded-none border-2 border-[#26352e] bg-[#f2efe8] text-[#26352e] shadow-[6px_6px_0_#d9654b]"
        : "rounded-xl border border-white/15 bg-[#191522] text-white shadow-[0_18px_55px_rgba(0,0,0,0.35)]",
  );
  const itemClassName = cn(
    "flex cursor-default items-center justify-between gap-4 px-3 py-2 font-mono text-[10px] font-semibold tracking-[0.08em] outline-none transition-colors",
    startup
      ? "rounded-sm text-[var(--line-muted)] [data-highlighted]:bg-[var(--line-hover)] [data-selected]:bg-[var(--line-surface)]"
      : mono
        ? "rounded-none text-[#26352e] [data-highlighted]:bg-[#dbe5dd] [data-selected]:bg-[#d5ef91]"
        : "rounded-lg [data-highlighted]:bg-white/10 [data-selected]:bg-white/[0.06]",
  );
  const indicatorClassName = cn(
    "size-3.5",
    startup ? "text-[var(--line-accent)]" : mono ? "text-[#d9654b]" : "text-cyan-300",
  );

  return (
    <Select.Root
      items={Object.fromEntries(
        LANGUAGES.map((language) => [language.value, t(language.labelKey)]),
      )}
      onValueChange={(value) => {
        if (value) void i18n.changeLanguage(value);
      }}
      value={currentLanguage}
    >
      <Select.Trigger aria-label={t("common.selectLanguage")} className={triggerClassName}>
        <Languages aria-hidden="true" className="size-3.5 opacity-65" />
        <Select.Value />
        <Select.Icon>
          <ChevronDown
            aria-hidden="true"
            className="size-3 opacity-55 transition-transform group-data-popup-open:rotate-180"
          />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          align="end"
          alignItemWithTrigger={false}
          className="z-[220] min-w-[8.5rem]"
          sideOffset={6}
        >
          <Select.Popup className={popupClassName}>
            <Select.List>
              {LANGUAGES.map((language) => (
                <Select.Item className={itemClassName} key={language.value} value={language.value}>
                  <Select.ItemText>{t(language.labelKey)}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check aria-hidden="true" className={indicatorClassName} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
};

LanguageSwitcher.displayName = "LanguageSwitcher";
