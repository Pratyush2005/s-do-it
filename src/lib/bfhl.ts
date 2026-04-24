// Core processing logic for the /bfhl endpoint.
// Pure functions — safe to import on server and client.

export type TreeNode = { [key: string]: TreeNode };

export type Hierarchy = {
  root: string;
  tree: TreeNode;
  depth?: number;
  has_cycle?: true;
};

export type BfhlResponse = {
  user_id: string;
  email_id: string;
  college_roll_number: string;
  hierarchies: Hierarchy[];
  invalid_entries: string[];
  duplicate_edges: string[];
  summary: {
    total_trees: number;
    total_cycles: number;
    largest_tree_root: string;
  };
};

const EDGE_RE = /^([A-Z])->([A-Z])$/;

export function processBfhl(
  rawData: unknown,
  identity: { user_id: string; email_id: string; college_roll_number: string },
): BfhlResponse {
  const invalid_entries: string[] = [];
  const duplicate_edges: string[] = [];
  const seenEdges = new Set<string>();
  const dupSet = new Set<string>();
  const edges: Array<[string, string]> = [];

  const data = Array.isArray(rawData) ? rawData : [];

  for (const raw of data) {
    if (typeof raw !== "string") {
      invalid_entries.push(String(raw));
      continue;
    }
    const entry = raw.trim();
    const m = entry.match(EDGE_RE);
    if (!m || m[1] === m[2]) {
      invalid_entries.push(raw);
      continue;
    }
    const key = `${m[1]}->${m[2]}`;
    if (seenEdges.has(key)) {
      if (!dupSet.has(key)) {
        dupSet.add(key);
        duplicate_edges.push(key);
      }
      continue;
    }
    seenEdges.add(key);
    edges.push([m[1], m[2]]);
  }

  // Build parent map: first-parent-wins for diamond case.
  const parentOf = new Map<string, string>();
  const children = new Map<string, string[]>();
  const nodes = new Set<string>();
  const adj = new Map<string, string[]>(); // undirected for grouping

  const addAdj = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  };

  for (const [p, c] of edges) {
    nodes.add(p);
    nodes.add(c);
    addAdj(p, c);
    if (parentOf.has(c)) {
      // diamond — silently discard subsequent parent edges
      continue;
    }
    parentOf.set(c, p);
    if (!children.has(p)) children.set(p, []);
    children.get(p)!.push(c);
  }

  // Group connected components (undirected).
  const visited = new Set<string>();
  const groups: string[][] = [];
  const sortedNodes = [...nodes].sort();
  for (const n of sortedNodes) {
    if (visited.has(n)) continue;
    const stack = [n];
    const comp: string[] = [];
    visited.add(n);
    while (stack.length) {
      const cur = stack.pop()!;
      comp.push(cur);
      for (const nb of adj.get(cur) ?? []) {
        if (!visited.has(nb)) {
          visited.add(nb);
          stack.push(nb);
        }
      }
    }
    groups.push(comp.sort());
  }

  const hierarchies: Hierarchy[] = [];

  for (const comp of groups) {
    // Determine root candidates: nodes in comp with no parent recorded.
    const roots = comp.filter((c) => !parentOf.has(c));

    // Cycle detection: a component is cyclic if it has no root (pure cycle),
    // or if following directed edges from a root encounters a back-edge.
    // Given our rules (first-parent-wins, single parent per node), a cycle
    // only occurs when every node in the group has a parent inside the group.
    const hasCycle = roots.length === 0;

    if (hasCycle) {
      hierarchies.push({
        root: comp[0], // lexicographically smallest
        tree: {},
        has_cycle: true,
      });
      continue;
    }

    // Valid tree — pick lexicographically smallest root if multiple.
    const root = roots.sort()[0];

    const build = (node: string): TreeNode => {
      const obj: TreeNode = {};
      const kids = (children.get(node) ?? []).slice().sort();
      for (const k of kids) obj[k] = build(k);
      return obj;
    };

    const subtree: TreeNode = { [root]: build(root) };

    const depthOf = (node: string): number => {
      const kids = children.get(node) ?? [];
      if (kids.length === 0) return 1;
      return 1 + Math.max(...kids.map(depthOf));
    };

    hierarchies.push({
      root,
      tree: subtree,
      depth: depthOf(root),
    });
  }

  // Sort hierarchies by root for deterministic output.
  hierarchies.sort((a, b) => a.root.localeCompare(b.root));

  const validTrees = hierarchies.filter((h) => !h.has_cycle);
  const cycles = hierarchies.filter((h) => h.has_cycle);

  let largest_tree_root = "";
  let bestDepth = -1;
  for (const t of validTrees) {
    const d = t.depth ?? 0;
    if (d > bestDepth || (d === bestDepth && t.root < largest_tree_root)) {
      bestDepth = d;
      largest_tree_root = t.root;
    }
  }

  return {
    ...identity,
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees: validTrees.length,
      total_cycles: cycles.length,
      largest_tree_root,
    },
  };
}

export const IDENTITY = {
  user_id: "pratyushpradhan_24072005",
  email_id: "pp5020@srmist.edu.in",
  college_roll_number: "RA2311047010095",
};
