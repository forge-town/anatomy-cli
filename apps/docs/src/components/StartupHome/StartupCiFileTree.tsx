import { File, Folder, FolderOpen } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./StartupCiFileTree.css";

type CiTreeNode = {
  fullPath: string;
  id: string;
  kind: "file" | "folder" | "root";
  label: string;
  parentId?: string;
  x: number;
  y: number;
};

const NODE_WIDTH = 126;
const NODE_HALF_WIDTH = NODE_WIDTH / 2;
const ACTIVE_INTERVAL_MS = 2_800;
const ACTIVE_LEAF_IDS = ["button", "home", "engine"] as const;

const treeNodes: CiTreeNode[] = [
  {
    fullPath: "repository",
    id: "repository",
    kind: "root",
    label: "repository",
    x: 82,
    y: 190,
  },
  {
    fullPath: "src/",
    id: "src",
    kind: "folder",
    label: "src/",
    parentId: "repository",
    x: 232,
    y: 190,
  },
  {
    fullPath: "src/components/",
    id: "components",
    kind: "folder",
    label: "components/",
    parentId: "src",
    x: 402,
    y: 70,
  },
  {
    fullPath: "src/components/Button.tsx",
    id: "button",
    kind: "file",
    label: "Button.tsx",
    parentId: "components",
    x: 582,
    y: 70,
  },
  {
    fullPath: "src/routes/",
    id: "routes",
    kind: "folder",
    label: "routes/",
    parentId: "src",
    x: 402,
    y: 190,
  },
  {
    fullPath: "src/routes/home.tsx",
    id: "home",
    kind: "file",
    label: "home.tsx",
    parentId: "routes",
    x: 582,
    y: 190,
  },
  {
    fullPath: "src/lib/",
    id: "lib",
    kind: "folder",
    label: "lib/",
    parentId: "src",
    x: 402,
    y: 310,
  },
  {
    fullPath: "src/lib/anatomy.ts",
    id: "engine",
    kind: "file",
    label: "anatomy.ts",
    parentId: "lib",
    x: 582,
    y: 310,
  },
];

const treeNodeById = new Map(treeNodes.map((node) => [node.id, node]));

const getActivePath = (leafId: string) => {
  const path = new Set<string>();
  let node = treeNodeById.get(leafId);

  while (node) {
    path.add(node.id);
    node = node.parentId ? treeNodeById.get(node.parentId) : undefined;
  }

  return path;
};

const getEdgePath = (parent: CiTreeNode, node: CiTreeNode) => {
  const startX = parent.x + NODE_HALF_WIDTH;
  const endX = node.x - NODE_HALF_WIDTH;
  const controlOffset = Math.max(36, (endX - startX) * 0.52);

  return `M ${startX} ${parent.y} C ${startX + controlOffset} ${parent.y}, ${endX - controlOffset} ${node.y}, ${endX} ${node.y}`;
};

export const StartupCiFileTree = () => {
  const { t } = useTranslation();
  const treeRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(treeRef, { amount: 0.35 });
  const shouldReduceMotion = useReducedMotion();
  const [activeLeafIndex, setActiveLeafIndex] = useState(0);
  const activeLeafId = ACTIVE_LEAF_IDS[activeLeafIndex] ?? ACTIVE_LEAF_IDS[0];
  const activeLeaf = treeNodeById.get(activeLeafId) ?? treeNodes[0]!;
  const activePath = useMemo(() => getActivePath(activeLeafId), [activeLeafId]);
  const completedLeafIds = new Set(ACTIVE_LEAF_IDS.slice(0, activeLeafIndex));

  useEffect(() => {
    if (!isInView || shouldReduceMotion) return;

    const timer = window.setInterval(() => {
      setActiveLeafIndex((current) => (current + 1) % ACTIVE_LEAF_IDS.length);
    }, ACTIVE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isInView, shouldReduceMotion]);

  return (
    <div
      aria-label={t("startup.previewScan")}
      className="flex h-full min-h-[30rem] flex-1 flex-col overflow-hidden bg-[var(--line-surface-raised)]"
      ref={treeRef}
      role="img"
    >
      <svg aria-hidden="true" className="ci-file-tree__canvas min-h-0 w-full flex-1" viewBox="0 0 670 380">
        {treeNodes.map((node) => {
          const parent = node.parentId ? treeNodeById.get(node.parentId) : undefined;
          if (!parent) return null;

          const edgeIsActive = activePath.has(parent.id) && activePath.has(node.id);
          const edgePath = getEdgePath(parent, node);

          return (
            <g key={`edge-${node.id}`}>
              <path
                d={edgePath}
                fill="none"
                stroke="var(--line-border-strong)"
                strokeLinecap="round"
                strokeWidth="1.25"
              />
              <motion.path
                animate={{ opacity: edgeIsActive ? 1 : 0, pathLength: edgeIsActive ? 1 : 0 }}
                d={edgePath}
                fill="none"
                initial={false}
                stroke="var(--line-accent)"
                strokeLinecap="round"
                strokeWidth="2"
                transition={{ duration: shouldReduceMotion ? 0 : 0.78, ease: [0.22, 1, 0.36, 1] }}
              />
            </g>
          );
        })}

        {treeNodes.map((node) => {
          const isActive = activePath.has(node.id);
          const isCurrent = node.id === activeLeafId;
          const isComplete = completedLeafIds.has(node.id as (typeof ACTIVE_LEAF_IDS)[number]);
          const Icon = node.kind === "file" ? File : node.kind === "root" ? FolderOpen : Folder;

          return (
            <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
              <g>
                <rect
                  fill={isActive ? "var(--line-warning-surface)" : "var(--line-surface)"}
                  height="40"
                  rx="2"
                  stroke={isActive ? "var(--line-accent)" : "var(--line-border-strong)"}
                  strokeWidth={isActive ? "1.5" : "1"}
                  width={NODE_WIDTH}
                  x={-NODE_HALF_WIDTH}
                  y="-20"
                />
                <Icon
                  aria-hidden="true"
                  color={isActive ? "var(--line-accent)" : "var(--line-muted)"}
                  height="14"
                  strokeWidth="1.7"
                  width="14"
                  x={-NODE_HALF_WIDTH + 12}
                  y="-7"
                />
                <text
                  fill={isActive ? "var(--line-foreground)" : "var(--line-muted)"}
                  fontFamily="var(--font-interface)"
                  fontSize="11"
                  fontWeight={isActive ? "600" : "500"}
                  x={-NODE_HALF_WIDTH + 34}
                  y="4"
                >
                  {node.label}
                </text>
                {isComplete && (
                  <circle
                    cx={NODE_HALF_WIDTH - 10}
                    cy="0"
                    fill="var(--line-success)"
                    r="3"
                  />
                )}
                {isCurrent && (
                  <motion.circle
                    animate={
                      shouldReduceMotion
                        ? { opacity: 0.72, r: 2.7 }
                        : { opacity: [0.55, 0.78, 0.55], r: [2.5, 2.9, 2.5] }
                    }
                    cx={NODE_HALF_WIDTH - 10}
                    cy="0"
                    fill="var(--line-accent)"
                    transition={{
                      duration: 2.2,
                      ease: "easeInOut",
                      repeat: shouldReduceMotion ? 0 : Infinity,
                    }}
                  />
                )}
              </g>
            </g>
          );
        })}
      </svg>

      <div className="flex min-w-0 shrink-0 items-center gap-3 border-t border-[var(--line-border)] px-5 py-3 font-mono text-[10px] tracking-[0.08em] text-[var(--line-muted)]">
        <span className="h-px w-3 shrink-0 bg-[var(--line-accent)]" />
        <code className="min-w-0 flex-1 truncate text-[var(--line-foreground)]">{activeLeaf.fullPath}</code>
        <span className="shrink-0 uppercase">
          {activeLeafIndex + 1} / {ACTIVE_LEAF_IDS.length}
        </span>
      </div>
    </div>
  );
};

StartupCiFileTree.displayName = "StartupCiFileTree";
