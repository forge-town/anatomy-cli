import { cn } from "@/lib/cn";
import { Menu } from "@base-ui/react/menu";

export type DropdownMenuSeparatorProps = Menu.Separator.Props;

export const DropdownMenuSeparator = ({ className, ...props }: DropdownMenuSeparatorProps) => (
  <Menu.Separator className={cn("my-1 h-px bg-[var(--border)]", className)} {...props} />
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";
