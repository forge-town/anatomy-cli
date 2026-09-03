import { Menu } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;

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

export type DropdownMenuItemProps = Menu.Item.Props;

export const DropdownMenuItem = ({ className, ...props }: DropdownMenuItemProps) => (
  <Menu.Item
    className={cn(
      "flex h-9 cursor-pointer items-center rounded-md px-3 text-sm outline-none data-highlighted:bg-[var(--muted)]",
      className,
    )}
    {...props}
  />
);

export type DropdownMenuSeparatorProps = Menu.Separator.Props;

export const DropdownMenuSeparator = ({ className, ...props }: DropdownMenuSeparatorProps) => (
  <Menu.Separator className={cn("my-1 h-px bg-[var(--border)]", className)} {...props} />
);

DropdownMenuContent.displayName = "DropdownMenuContent";
DropdownMenuItem.displayName = "DropdownMenuItem";
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";
