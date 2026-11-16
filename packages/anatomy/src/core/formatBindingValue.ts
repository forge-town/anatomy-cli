import type { AnatomyBindingFormat } from "@anatomy-cli/schemas";

/** Render a canonical capture in the explicitly requested naming convention. */
export const formatBindingValue = (value: string, format: AnatomyBindingFormat): string => {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
  const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
  switch (format) {
    case "PascalCase":
      return words.map(capitalize).join("");
    case "camelCase":
      return words.map((word, index) => (index ? capitalize(word) : word)).join("");
    case "kebab-case":
      return words.join("-");
    case "snake_case":
      return words.join("_");
    case "SCREAMING_SNAKE_CASE":
      return words.join("_").toUpperCase();
  }
};
