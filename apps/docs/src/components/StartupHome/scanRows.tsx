import {
FileCode2,
Folder,
FolderOpen
} from "lucide-react";

export const scanRows = [
  { icon: FolderOpen, label: "src/", status: "pass" as const },
  { icon: Folder, label: "components/", indent: 1 as const, status: "pass" as const },
  { icon: Folder, label: "ui/", indent: 2 as const, status: "pass" as const },
  { icon: Folder, label: "routes/", indent: 1 as const, status: "pass" as const },
  { icon: FileCode2, label: "home.tsx", indent: 2 as const, status: "pass" as const },
  { icon: Folder, label: "lib/", indent: 1 as const, status: "pass" as const },
  { icon: FileCode2, label: "utils.ts", indent: 2 as const, status: "pass" as const },
  { icon: Folder, label: "hooks/", indent: 1 as const, status: "pass" as const },
  { icon: Folder, label: "assets/", indent: 1 as const, status: "pass" as const },
  { icon: Folder, label: "tests/", indent: 1 as const, status: "pass" as const },
  { icon: Folder, label: "legacy/", indent: 1 as const, status: "warn" as const },
];
