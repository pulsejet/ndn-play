import type { Node, Edge, Network, DataSet, Position } from 'vis-network/standalone';

type GraphNode = Node & {
    _sort_order?: number;
}

type Graph = {
    nodes: DataSet<GraphNode>,
    edges: DataSet<Edge>,
}

/**
 * @brief Untangle a graph defined by nodes and edges.
 *
 * @details Vis.js sorts horizontal nodes by order of insertion
 * which leads to a messy graph. This function sorts the nodes
 * on each level by the average x position of their parents.
 *
 * To use this function, the graph MUST have a root node with
 * no parents.
 *
 * The graph is modified in-place, cleared and reset.
 *
 * @warning This is really crude. It relies on some details like
 *    1/ vis.js sorts horizontally by order of insertion
 *    2/ y-positions of nodes are the same for one level
 *    3/ it clears the graph and redoes it; pretty inefficient
 *
 * @param graph The graph to be untangled
 * @param net The network object used to display the graph
 * @param reversed If true, the root is considered to be at the bottom
 */
export function untangleGraph(graph: Graph, net: Network, reversed: boolean = false) {
    // Get positions for all nodes
    const pos = net.getPositions(graph.nodes.getIds());

    // Populate level map
    const levels = new Map<number, GraphNode[]>();
    for (const node of graph.nodes.get()) {
        const nodePos: Position = pos[node.id]!;
        const level = reversed ? -nodePos.y : nodePos.y;

        const nodes = levels.get(level) ?? [];
        nodes.push(node);
        levels.set(level, nodes);
    }

    // Sort nodes on each level
    const levelsList = Array.from(levels.keys()).sort((a, b) => a - b);
    for (const level of levelsList) {
        const nodesOnLevel = levels.get(level)!;

        // Calculate sort order for each node
        for (const node of nodesOnLevel) {
            // get parents of this node
            const edges = net.getConnectedEdges(node.id!);
            const parents = edges.map(edgeId => {
                const edge = graph.edges.get(edgeId)!;
                const parentId = reversed ? edge.to : edge.from;
                if (parentId === node.id) return null;
                return graph.nodes.get(parentId!)!;
            }).filter(node => node) as GraphNode[];

            // average sort order or parent nodes
            if (parents.length === 0) {
                // root node has no parents
                node._sort_order = 0;
            } else  {
                // there are some parents
                node._sort_order = Math.round(parents.reduce((sum, parent) => {
                    // use average sort order of parents
                    return sum + parent._sort_order!;
                }, 0) / parents.length);
            }
        }

        // Do explicit tie-breaking on this level
        // Simple linear interpolation between first and last node
        if (nodesOnLevel.length > 1) {
            // sort nodes by sort order
            nodesOnLevel.sort((a, b) => a._sort_order! - b._sort_order!);

            // get start and end of level by parent algorithm
            const start = nodesOnLevel[0]._sort_order!;
            let end = nodesOnLevel[nodesOnLevel.length - 1]._sort_order!;

            // use a minimum difference
            if (end === start) end += 1e8;

            // interpolate sort order
            for (let i = 0; i < nodesOnLevel.length; i++) {
                nodesOnLevel[i]._sort_order = Math.round(start + (end - start) * i / (nodesOnLevel.length - 1));
            }
        }
    }

    // Sort nodes by order
    graph.nodes.clear(); // reset first to redo ordering
    graph.nodes.update(Array.from(levels.values())
        .flat()
        .sort((a, b) => (a._sort_order ?? 0) - (b._sort_order ?? 0)));
}
