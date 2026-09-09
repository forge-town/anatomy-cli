import { cn } from "@/lib/cn";
import { Menu } from "@base-ui/react/menu";

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
DropdownMenuItem.displayName = "DropdownMenuItem";
