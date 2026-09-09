import type { DetectorOptions } from "i18next-browser-languagedetector";

export const PERSISTENT_DETECTION_OPTIONS: DetectorOptions = {
  order: ["cookie", "localStorage"],
  caches: ["cookie", "localStorage"],
  lookupCookie: "i18next",
};
