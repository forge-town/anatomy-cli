import { StartupCta } from "./StartupCta";
import { StartupCiSection } from "./StartupCiSection";
import { StartupFooter } from "./StartupFooter";
import { StartupHeader } from "./StartupHeader";
import { StartupHero } from "./StartupHero";
import { StartupScanSection } from "./StartupScanSection";
import { StartupTerminalCase } from "./StartupTerminalCase";

export const StartupHome = () => (
  <div className="min-h-screen bg-[var(--line-background)] text-[var(--line-foreground)]">
    <StartupHeader />
    <main>
      <StartupHero />
      <StartupScanSection />
      <StartupTerminalCase />
      <StartupCiSection />
      <StartupCta />
    </main>
    <StartupFooter />
  </div>
);

StartupHome.displayName = "StartupHome";
