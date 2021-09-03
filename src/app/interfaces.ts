import * as vis from 'vis-network';
import { NFW } from './provider-browser/nfw';

export interface INodeExtra {
    pendingTraffic: number;
    codeEdit: string;
    producedPrefixes: string[];
}

export interface INode extends vis.Node {
    nfw: NFW;
    extra: INodeExtra;
}

export interface ILinkExtra {
    pendingTraffic: number;
}

export interface IEdge extends vis.Edge {
    latency: number;
    loss: number;
    extra: ILinkExtra,
}

export interface visTlv {
    t: number;
    l: number;
    v: visTlv[];
    vl: Uint8Array;
    vs?: string
    tl: number;
};
