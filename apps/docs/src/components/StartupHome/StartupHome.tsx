import { StartupCta } from "./StartupCta";
import { StartupCiSection } from "./StartupCiSection";
import { StartupFeatures } from "./StartupFeatures";
import { StartupFooter } from "./StartupFooter";
import { StartupHeader } from "./StartupHeader";
import { StartupHero } from "./StartupHero";
import { StartupScanSection } from "./StartupScanSection";

export const StartupHome = () => (
  <div className="min-h-screen bg-[var(--line-background)] text-[var(--line-foreground)]">
    <StartupHeader />
    <main>
      <StartupHero />
      <StartupScanSection />
      <StartupFeatures />
      <StartupCiSection />
      <StartupCta />
    </main>
    <StartupFooter />
  </div>
);

StartupHome.displayName = "StartupHome";
