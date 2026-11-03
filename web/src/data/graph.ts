import type { Chapter, GraphEdge, GraphNode } from "../types/graph";
import { data } from "./schema";

const GROUP_BITS: Record<string, number> = { temp: 2, position: 4 };

const FACET_FIELDS: Record<string, keyof GraphNode["facets"]> = {
  speaker: "speakers",
  flag: "flags",
  check: "checks",
  stat: "stats",
  rel: "rels",
};

const nodes = data.nodes;
const edges = data.edges;
const chapters = data.chapters;
const groups = data.vocab.edgeGroups || {};

const nodeById = new Map<string, GraphNode>();
const indexById = new Map<string, number>();

nodes.forEach((node, index) => {
  nodeById.set(node.id, node);
  indexById.set(node.id, index);
});

const outAdj: GraphEdge[][] = nodes.map(() => []);
const inAdj: GraphEdge[][] = nodes.map(() => []);
const edgeKinds = new Uint8Array(nodes.length);

for (const edge of edges) {
  const from = indexById.get(edge.from);
  const to = indexById.get(edge.to);
  if (from === undefined || to === undefined) continue;
  outAdj[from].push(edge);
  inAdj[to].push(edge);
  const bit = GROUP_BITS[groups[edge.kind]];
  if (bit) edgeKinds[from] |= bit;
}

for (const node of nodes) {
  if (node.systemIn <= 0) continue;
  const index = indexById.get(node.id);
  if (index !== undefined) edgeKinds[index] |= GROUP_BITS.position;
}

const visible = new Uint8Array(nodes.length);

const chapterOf = (node: GraphNode | null | undefined): Chapter => (
  node ? chapters[node.chapter] : undefined
) || { id: "", kind: "other", number: null, color: "#8A8578", count: 0 };

const passes = (index: number, filterSet: Set<number> | null): boolean => (
  !filterSet || filterSet.has(index)
);

const computeVisibility = (filterSet: Set<number> | null, selectedId: string): number => {
  const selectedIndex = selectedId ? indexById.get(selectedId) : undefined;
  let count = 0;
  for (let index = 0; index < nodes.length; index++) {
    let show = passes(index, filterSet);
    if (!show && index === selectedIndex) show = true;
    visible[index] = show ? 1 : 0;
    if (show) count++;
  }
  return count;
};

const hasEdgeGroup = (index: number, group: string): boolean => {
  const bit = GROUP_BITS[group] || 0;
  return bit > 0 && (edgeKinds[index] & bit) !== 0;
};

let byChapter: GraphNode[][] | null = null;

const nodesByChapter = (): GraphNode[][] => {
  if (byChapter) return byChapter;
  byChapter = chapters.map(() => []);
  nodes.forEach((node) => {
    const bucket = byChapter?.[node.chapter];
    if (bucket) bucket.push(node);
  });
  return byChapter;
};

const nextTargets = (node: GraphNode | null): { node: GraphNode; edge: GraphEdge }[] => {
  if (!node) return [];
  const index = indexById.get(node.id);
  if (index === undefined) return [];
  const seen = new Set<string>();
  const targets: { node: GraphNode; edge: GraphEdge }[] = [];
  for (const edge of outAdj[index]) {
    const target = nodeById.get(edge.to);
    if (!target || seen.has(target.id)) continue;
    seen.add(target.id);
    targets.push({ node: target, edge });
  }
  return targets;
};

const facetMatches = (node: GraphNode, kind: string, key: string): boolean => {
  if (!key) return false;
  const field = FACET_FIELDS[kind];
  if (!field) return false;
  const values = node.facets[field];
  return Array.isArray(values) && values.indexOf(key) >= 0;
};

const lookup = (kind: string, key: string): GraphNode[] => {
  const out: GraphNode[] = [];
  for (const node of nodes) {
    if (facetMatches(node, kind, key)) out.push(node);
  }
  return out;
};

const flagGroups = (key: string): { writes: GraphNode[]; reads: GraphNode[] } => {
  const writes: GraphNode[] = [];
  const reads: GraphNode[] = [];
  if (!key) return { writes, reads };
  for (const node of nodes) {
    if (node.facets.flags.indexOf(key) >= 0) {
      writes.push(node);
      continue;
    }
    if (node.facets.checks.some((check) => check === key || check.indexOf(`${key}_`) === 0)) {
      reads.push(node);
    }
  }
  return { writes, reads };
};

export const graph = {
  chapters,
  chapterOf,
  computeVisibility,
  edges,
  flagGroups,
  hasEdgeGroup,
  inAdj,
  indexById,
  lookup,
  nextTargets,
  nodeById,
  nodes,
  nodesByChapter,
  outAdj,
  passes,
  visible,
};
