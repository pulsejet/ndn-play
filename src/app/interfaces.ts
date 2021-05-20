import * as vis from 'vis-network';
import { NFW } from './nfw';

export interface INode extends vis.Node {
    init?: boolean;
    producedPrefixes: string[];
    nfw: NFW;
}

export interface IEdge extends vis.Edge {
    init?: boolean;
    latency: number;
    loss: number;
    controller: {
        pendingTraffic: number;
    },
}

export interface IInterest {
    name: string;
    freshness?: number;
}

export interface IData {
    name: string;
    freshness?: number;
    content: any;
}
