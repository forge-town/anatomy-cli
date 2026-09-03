import { RhombusPattern } from "./RhombusPattern";
import { KiteDartPattern } from "./KiteDartPattern";

type StartupGridBackgroundProps = {
  gridRef: { current: HTMLDivElement | null };
};

export const StartupGridBackground = ({ gridRef }: StartupGridBackgroundProps) => (
  <div
    ref={gridRef}
    aria-hidden="true"
    className="startup-grid-background pointer-events-none absolute inset-0 z-0"
  >
    <RhombusPattern />
    <KiteDartPattern />
  </div>
);

StartupGridBackground.displayName = "StartupGridBackground";
