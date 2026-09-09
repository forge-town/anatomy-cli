import { cn } from "@/lib/cn";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "./buttonVariants";

export type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

export const Button = ({
  className,
  size = "default",
  variant = "default",
  ...props
}: ButtonProps) => (
  <ButtonPrimitive
    className={cn(buttonVariants({ className, size, variant }))}
    data-slot="button"
    {...props}
  />
);
Button.displayName = "Button";
