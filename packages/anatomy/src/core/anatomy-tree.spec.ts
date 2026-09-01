import { describe, it, expect } from "vitest";
import {
  createEmptyStructure,
  createDirectoryEntry,
  createFileEntry,
  insertAnatomyNode,
  removeAnatomyNode,
  updateAnatomyNode,
  locateNodeInTree,
  groupSiblingEntries,
} from "./anatomy-tree";

describe("anatomy-tree", () => {
  describe("createEmptyStructure", () => {
    it("returns a valid empty structure", () => {
      const structure = createEmptyStructure();

      expect(structure.schemaVersion).toBe(1);
      expect(structure.root.children).toEqual([]);
      expect(structure.defaultPolicies.missingRequired).toBe("block");
    });
  });

  describe("insertAnatomyNode", () => {
    it("inserts a file at the root level", () => {
      const structure = createEmptyStructure();
      const file = createFileEntry("README.md");
      const updated = insertAnatomyNode(structure, null, file);

      expect(updated.root.children).toHaveLength(1);
      expect(updated.root.children[0]?.id).toBe(file.id);
      expect(updated.root.children[0]?.kind).toBe("file");
    });

    it("inserts a file into a root-level directory", () => {
      const dir = createDirectoryEntry("src");
      const structure = insertAnatomyNode(createEmptyStructure(), null, dir);
      const file = createFileEntry("index.ts");
      const updated = insertAnatomyNode(structure, dir.id, file);

      expect(updated.root.children).toHaveLength(1);
      const updatedDir = updated.root.children[0];
      expect(updatedDir?.kind).toBe("directory");
      if (updatedDir?.kind !== "directory") return;

      expect(updatedDir.children).toHaveLength(1);
      expect(updatedDir.children[0]?.id).toBe(file.id);
      expect(updatedDir.children[0]?.kind).toBe("file");
    });

    it("inserts nested directories", () => {
      const outer = createDirectoryEntry("outer");
      const withOuter = insertAnatomyNode(createEmptyStructure(), null, outer);
      const inner = createDirectoryEntry("inner");
      const withInner = insertAnatomyNode(withOuter, outer.id, inner);
      const file = createFileEntry("leaf.txt");
      const structure = insertAnatomyNode(withInner, inner.id, file);

      const outerNode = structure.root.children[0];
      expect(outerNode?.kind).toBe("directory");
      if (outerNode?.kind !== "directory") return;

      const innerNode = outerNode.children[0];
      expect(innerNode?.kind).toBe("directory");
      if (innerNode?.kind !== "directory") return;

      expect(innerNode.children).toHaveLength(1);
      expect(innerNode.children[0]?.kind).toBe("file");
    });

    it("does not insert into a file node", () => {
      const file = createFileEntry("README.md");
      const structure = insertAnatomyNode(createEmptyStructure(), null, file);
      const child = createFileEntry("child.md");
      const updated = insertAnatomyNode(structure, file.id, child);

      expect(updated.root.children).toHaveLength(1);
      expect(updated.root.children[0]?.kind).toBe("file");
    });
  });

  describe("removeAnatomyNode", () => {
    it("removes a root-level node", () => {
      const file = createFileEntry("README.md");
      const structure = insertAnatomyNode(createEmptyStructure(), null, file);
      const updated = removeAnatomyNode(structure, file.id);

      expect(updated.root.children).toHaveLength(0);
    });

    it("removes a nested node", () => {
      const dir = createDirectoryEntry("src", [createFileEntry("index.ts")]);
      const structure = insertAnatomyNode(createEmptyStructure(), null, dir);
      const childId = dir.children[0]?.id as string;
      const updated = removeAnatomyNode(structure, childId);

      const updatedDir = updated.root.children[0];
      expect(updatedDir?.kind).toBe("directory");
      if (updatedDir?.kind !== "directory") return;

      expect(updatedDir.children).toHaveLength(0);
    });

    it("removes an alternative from a one_of group", () => {
      const a = createFileEntry("a.ts");
      const b = createFileEntry("b.ts");
      const step1 = insertAnatomyNode(createEmptyStructure(), null, a);
      const step2 = insertAnatomyNode(step1, null, b);
      const structure = groupSiblingEntries(step2, null, [a.id, b.id]);

      const group = structure.root.children[0];
      expect(group?.kind).toBe("one_of");
      if (group?.kind !== "one_of") return;

      expect(group.alternatives).toHaveLength(2);

      const updated = removeAnatomyNode(structure, a.id);
      const updatedGroup = updated.root.children[0];
      expect(updatedGroup?.kind).toBe("one_of");
      if (updatedGroup?.kind !== "one_of") return;

      expect(updatedGroup.alternatives).toHaveLength(1);
      expect(updatedGroup.alternatives[0]?.id).toBe(b.id);
    });
  });

  describe("updateAnatomyNode", () => {
    it("updates a node name", () => {
      const file = createFileEntry("old.md");
      const structure = insertAnatomyNode(createEmptyStructure(), null, file);
      const updated = updateAnatomyNode(structure, file.id, (node) => {
        if (node.kind === "one_of") return node;

        return {
          ...node,
          name: { type: "literal", value: "new.md" },
        };
      });

      const updatedFile = updated.root.children[0];
      expect(updatedFile?.kind).toBe("file");
      if (updatedFile?.kind !== "file") return;

      expect(updatedFile.name.value).toBe("new.md");
    });

    it("updates a nested node", () => {
      const dir = createDirectoryEntry("src", [createFileEntry("index.ts")]);
      const structure = insertAnatomyNode(createEmptyStructure(), null, dir);
      const childId = dir.children[0]?.id as string;
      const updated = updateAnatomyNode(structure, childId, (node) => {
        if (node.kind === "one_of") return node;

        return { ...node, quantity: "exactly_one" };
      });

      const updatedDir = updated.root.children[0];
      expect(updatedDir?.kind).toBe("directory");
      if (updatedDir?.kind !== "directory") return;

      const updatedChild = updatedDir.children[0];
      expect(updatedChild?.kind).toBe("file");
      if (updatedChild?.kind !== "file") return;

      expect(updatedChild.quantity).toBe("exactly_one");
    });
  });

  describe("locateNodeInTree", () => {
    it("locates a root-level node", () => {
      const file = createFileEntry("README.md");
      const structure = insertAnatomyNode(createEmptyStructure(), null, file);
      const located = locateNodeInTree(structure.root.children, file.id);

      expect(located.found).toBe(true);
      if (!located.found) return;

      expect(located.node.id).toBe(file.id);
      expect(located.parent).toBeNull();
    });

    it("locates an alternative inside one_of", () => {
      const a = createFileEntry("a.ts");
      const b = createFileEntry("b.ts");
      const step1 = insertAnatomyNode(createEmptyStructure(), null, a);
      const step2 = insertAnatomyNode(step1, null, b);
      const structure = groupSiblingEntries(step2, null, [a.id, b.id]);

      const located = locateNodeInTree(structure.root.children, a.id);
      expect(located.found).toBe(true);
      if (!located.found) return;

      expect(located.parent?.kind).toBe("one_of");
      expect(located.index).toBe(0);
    });
  });

  describe("groupSiblingEntries", () => {
    it("groups root-level siblings into one_of", () => {
      const a = createFileEntry("a.ts");
      const b = createFileEntry("b.ts");
      const step1 = insertAnatomyNode(createEmptyStructure(), null, a);
      const step2 = insertAnatomyNode(step1, null, b);
      const structure = groupSiblingEntries(step2, null, [a.id, b.id]);

      expect(structure.root.children).toHaveLength(1);
      const group = structure.root.children[0];
      expect(group?.kind).toBe("one_of");
      if (group?.kind !== "one_of") return;

      expect(group.alternatives).toHaveLength(2);
    });

    it("groups siblings under a directory", () => {
      const a = createFileEntry("a.ts");
      const b = createFileEntry("b.ts");
      const dir = createDirectoryEntry("src", [a, b]);
      const structure = insertAnatomyNode(createEmptyStructure(), null, dir);
      const updated = groupSiblingEntries(structure, dir.id, [a.id, b.id]);

      const updatedDir = updated.root.children[0];
      expect(updatedDir?.kind).toBe("directory");
      if (updatedDir?.kind !== "directory") return;

      expect(updatedDir.children).toHaveLength(1);
      expect(updatedDir.children[0]?.kind).toBe("one_of");
    });

    it("does nothing when fewer than 2 entries are selected", () => {
      const a = createFileEntry("a.ts");
      const structure = insertAnatomyNode(createEmptyStructure(), null, a);
      const updated = groupSiblingEntries(structure, null, [a.id]);

      expect(updated.root.children[0]?.kind).toBe("file");
    });
  });
});
