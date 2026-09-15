import { cn } from "@/lib/cn";
import { Menu } from "@base-ui/react/menu";

export type DropdownMenuContentProps = Menu.Popup.Props &
  Pick<Menu.Positioner.Props, "align" | "side" | "sideOffset">;

export const DropdownMenuContent = ({
  className,
  sideOffset = 6,
  ...props
}: DropdownMenuContentProps) => (
  <Menu.Portal>
    <Menu.Positioner
      align="start"
      side="bottom"
      sideOffset={sideOffset}
      className="z-50 outline-none"
    >
      <Menu.Popup
        className={cn(
          "min-w-48 rounded-lg border border-[var(--border)] bg-[var(--popover)] p-1.5 text-[var(--popover-foreground)] shadow-2xl outline-none",
          className,
        )}
        {...props}
      />
    </Menu.Positioner>
  </Menu.Portal>
);
DropdownMenuContent.displayName = "DropdownMenuContent";
