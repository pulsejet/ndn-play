import { IEdge, INode } from "./interfaces";
import { Topology } from "./topo/topo";

export function load(topo: Topology, confStr: string): boolean {
    if (!confirm("Are you sure you want to load the configuration?")) {
        return false;
    }

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
        if (line.match(/\[.*\]/)) {
            if (line.match(/\[nodes\]/i)) {
                mode = 1;
                continue;
            } else if (line.match(/\[links\]/i)) {
                mode = 2;
                continue;
            } else if (line.match(/\[switches\]/i)) {
                mode = 3;
                continue;
            } else {
                console.error(`Unknown mode: ${line}`);
                mode = null;
                continue;
            }
        }

        // Unknown mode
        if (!mode) {
            console.warn(`Skipping line in unknown mode: ${line}`);
        }

        // Add nodes
        if (mode == 1 || mode == 3) {
            const nodeId = line.split(':')[0];
            readNodes.push({
                id: nodeId,
                label: nodeId,
                isSwitch: (<number>mode == 3) || undefined,
            });
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

    topo.nodes.add(readNodes as INode[]);
    topo.edges.add(readLinks as IEdge[]);

    topo.network.stabilize();
    topo.network.fit();

    return true;
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
    const switches: string[] = [];
    out.push('[nodes]');
    for (const node of nodes) {
        const name = nodeNames[node.id];
        if (node.isSwitch) {
            switches.push(name);
        } else {
            const pos = topo.network.getPosition(node.id);
            const posStr = `${pos.x / 10},${pos.y / 10},0`;
            out.push(`${name}: _ network=/world router=/${name}.Router/ position=${posStr}`);
        }
    }

    // Switches
    out.push('[switches]');
    for (const nodeName of switches) {
        out.push(`${nodeName}: _`);
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
