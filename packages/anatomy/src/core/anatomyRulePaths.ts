import type { AnatomyDraftInput, AnatomyNode } from "@anatomy-cli/schemas";

export const anatomyRulePaths = (definition: AnatomyDraftInput) => {
  const rules = new Map<string, { rulePath: string; node: AnatomyNode }>();
  const visit = (nodes: AnatomyNode[], path: string): void => {
    nodes.forEach((node, index) => {
      const rulePath = `${path}/${index}`;
      rules.set(node.id, { rulePath, node });
      if (node.kind === "directory") visit(node.children, `${rulePath}/children`);
      if (node.kind === "one_of") visit(node.alternatives, `${rulePath}/alternatives`);
    });
  };
  visit(definition.structure.root.children, "/structure/root/children");
  return rules;
};
