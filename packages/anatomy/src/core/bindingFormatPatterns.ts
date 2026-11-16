import type { AnatomyBindingFormat } from "@anatomy-cli/schemas";

export const bindingFormatPatterns: Record<AnatomyBindingFormat, RegExp> = {
  PascalCase: /^[A-Z][A-Za-z0-9]*$/,
  camelCase: /^[a-z][A-Za-z0-9]*$/,
  "kebab-case": /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  snake_case: /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
  SCREAMING_SNAKE_CASE: /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/,
};
