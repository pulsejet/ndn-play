import * as vis from 'vis-network';
import { NFW } from './provider-browser/nfw';

export interface ICapturedPacket {
    /** Node for which this packet is captured */
    node?: string;
    /** Frame number */
    fn?: number | string;
    /** Timestamp in ms */
    t: number;
    /** Length of packet in bytes */
    l: number;
    /** Interest/Data/Nack */
    type: string;
    /** NDN name of packet */
    name: string;
    /** Originating node */
    from?: string;
    /** Destination node */
    to?: string;
    /** Contents of the packet for visualization */
    p?: any;
}

export interface INodeExtra {
    /** Units of traffic pending on this node */
    pendingTraffic: number;
    /** Currently written code on this node */
    codeEdit: string;
    /** Prefixes prodcued by this node */
    producedPrefixes: string[];
    /** FIB or status information of the node */
    fibStr: string;
    /** Wireshark */
    capturedPackets: ICapturedPacket[];
}

export interface INode extends vis.Node {
    /* Not a forwarder -- definitely */
    nfw?: NFW;
    /** Extra data object */
    extra: INodeExtra;
}

export interface ILinkExtra {
    /** Units of traffic pending on this link */
    pendingTraffic: number;
}

export interface IEdge extends vis.Edge {
    /** Latency in milliseconds */
    latency: number;
    /** Loss in percentage */
    loss: number;
    /** Extra data object */
    extra: ILinkExtra,
}

export interface visTlv {
    /** Type */
    t: number;
    /** Length of value */
    l: number;
    /** Nested TLV objects */
    v: visTlv[];
    /** Value array */
    vl: Uint8Array;
    /** String representation of value */
    vs?: string
    /** Total length of the TLV block */
    tl: number;
};
