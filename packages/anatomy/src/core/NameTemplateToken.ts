import type { AnatomyBindingFormat } from "@anatomy-cli/schemas";

export type NameTemplateToken =
  | { kind: "literal"; value: string }
  | {
      kind: "placeholder";
      name: string;
      optional: boolean;
      format?: AnatomyBindingFormat;
      raw: string;
    };
