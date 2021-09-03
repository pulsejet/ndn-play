import { IEdge, INode } from "./interfaces";
import { Topology } from "./topo/topo";

export function load(topo: Topology, confStr: string) {
    topo.selectedEdge = undefined;
    topo.selectedNode = undefined;

    const config = confStr.split('\n');
    let mode = null;

    const readNodes: Partial<INode>[] = [];
    const readLinks: Partial<IEdge>[] = [];

    for (let line of config) {
        // Comments
        line = line.trim();
        if (line.length == 0 || line.startsWith('#')) continue;

        // Modes
        if (line.includes('[nodes]')) {
            mode = 1;
            continue;
        } else if (line.includes('[links]')) {
            mode = 2;
            continue;
        }

        // Add nodes
        if (mode == 1) {
            const nodeId = line.split(':')[0];
            readNodes.push({ id: nodeId, label: nodeId });
        }

        // Add links
        if (mode == 2) {
            const params = line.split(' ');
            const linkNodes = params.splice(0, 1)[0].split(':');
            const obj: Partial<IEdge> = { from: linkNodes[0], to: linkNodes[1] };
            for (const p of params) {
                const pa = p.split('=');
                if (pa[0] === 'delay') {
                    obj.latency = Number(pa[1].replace('ms', ''));
                }
            }
            readLinks.push(obj);
        }
    }

    topo.nodes.clear();
    topo.edges.clear();

    topo.nodes.add(<any>readNodes);
    topo.edges.add(<any>readLinks);
}

export function generate(topo: Topology): string {
    const out: string[] = [];

    const nodes = topo.nodes.get();

    // Construct node names
    const nodeNames: {[id: string]: string} = {};
    for (const node of nodes) {
        const nid = node.id.toString();
        const sameLabelNodes = nodes.filter((n) => n.label == node.label);

        // Check if duplicates present
        if (node.label && sameLabelNodes.length > 1) {
            nodeNames[nid] = `${node.label}_${(sameLabelNodes.indexOf(node) + 1)}`
        } else {
            nodeNames[nid] = node.label || nid;
        }
    }

    // Nodes
    out.push('[nodes]');
    for (const node of nodes) {
        const name = nodeNames[node.id];
        out.push(`${name}: _ network=/world router=/${name}.Router/`);
    }

    // Edges
    out.push('[links]');
    for (const edge of topo.edges.get()) {
        const params: string[] = [];

        // Nodes
        params.push(`${nodeNames[edge.from || '']}:${nodeNames[edge.to || '']}`)

        // Latency
        params.push(`delay=${edge.latency >= 0 ? edge.latency : topo.provider.defaultLatency}ms`)

        // Loss
        const loss = edge.loss >= 0 ? edge.loss : topo.provider.defaultLoss;
        if (loss > 0) params.push(`loss=${loss}`);

        out.push(params.join(' '));
    }

    return out.join('\n');
}
