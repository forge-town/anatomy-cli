import { parseNameTemplate } from "./parseNameTemplate.js";
import { formatBindingValue } from "./formatBindingValue.js";

/** Render every known capture, preserving unresolved placeholders for query output. */
export const renderNameTemplate = (
  value: string,
  captures: Readonly<Record<string, string>>,
): string => {
  const tokens = parseNameTemplate(value);
  if (!tokens) return value;
  return tokens
    .map((token) => {
      if (token.kind === "literal") return token.value;
      if (!Object.hasOwn(captures, token.name)) return token.raw;
      const captured = captures[token.name]!;
      return token.format ? formatBindingValue(captured, token.format) : captured;
    })
    .join("");
};
