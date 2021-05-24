import { Data, Interest } from '@ndn/packet';
import * as vis from 'vis-network';
import { NFW } from './nfw';

export interface INode extends vis.Node {
    init?: boolean;
    producedPrefixes: string[];
    nfw: NFW;
    extra: {
        codeEdit: string;
    };
}

export interface IEdge extends vis.Edge {
    init?: boolean;
    latency: number;
    loss: number;
    extra: {
        pendingTraffic: number;
    },
}

export interface visTlv {
    t: number;
    l: number;
    v: visTlv[];
    vl: Uint8Array;
    vs?: string
};
