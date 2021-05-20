import { GlobalService } from "./global.service";
import { IEdge, INode } from "./interfaces";

export function loadMiniNDNConfig(gs: GlobalService, confStr: string) {
    gs.selectedNode = undefined;
    gs.selectedEdge = undefined;

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
                if (p[0] === 'delay') {
                    obj.latency = Number(pa[1].replace('ms', ''));
                }
            }
            readLinks.push(obj);
        }
    }

    gs.nodes.clear();
    gs.edges.clear();

    gs.nodes.add(<any>readNodes);
    gs.edges.add(<any>readLinks);
}
