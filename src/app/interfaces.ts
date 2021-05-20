import * as vis from 'vis-network';

export interface INode extends vis.Node {
    init?: boolean;
    producedPrefixes?: string[];
}

export interface IEdge extends vis.Edge {
    init?: boolean;
    latency?: number;
    loss?: number;
    controller?: {
        pendingTraffic: number;
    },
}
