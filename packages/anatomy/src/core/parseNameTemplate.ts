import type { AnatomyBindingFormat } from "@anatomy-cli/schemas";
import type { NameTemplateToken } from "./NameTemplateToken.js";
import { bindingFormatPatterns } from "./bindingFormatPatterns.js";

/** Parse all placeholders; malformed brackets and unknown formats fail closed. */
export const parseNameTemplate = (value: string): NameTemplateToken[] | undefined => {
  const tokens: NameTemplateToken[] = [];
  const expression = /<([A-Za-z][A-Za-z0-9_]*)(\?)?(?::([A-Za-z_-]+))?>/g;
  let offset = 0;
  for (const match of value.matchAll(expression)) {
    const literal = value.slice(offset, match.index);
    if (/[<>]/.test(literal)) return undefined;
    if (literal) tokens.push({ kind: "literal", value: literal });
    const format = match[3] as AnatomyBindingFormat | undefined;
    if (format !== undefined && !Object.hasOwn(bindingFormatPatterns, format)) return undefined;
    tokens.push({
      kind: "placeholder",
      name: match[1]!,
      optional: match[2] !== undefined,
      format,
      raw: match[0],
    });
    offset = match.index + match[0].length;
  }
  const tail = value.slice(offset);
  if (/[<>]/.test(tail) || !tokens.some((token) => token.kind === "placeholder")) return undefined;
  if (tail) tokens.push({ kind: "literal", value: tail });
  return tokens;
};
