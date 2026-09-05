import type { ReactNode } from "react";
import { StartupFooter, StartupHeader } from "@/components/StartupHome";

export type PublicLayoutProps = {
  children: ReactNode;
};

export const PublicLayout = ({ children }: PublicLayoutProps) => (
  <div className="min-h-screen bg-[var(--line-background)] text-[var(--line-foreground)]">
    <StartupHeader />
    <main>{children}</main>
    <StartupFooter />
  </div>
);

PublicLayout.displayName = "PublicLayout";
