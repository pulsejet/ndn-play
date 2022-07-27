import { EventEmitter } from '@angular/core';
import { Node, Edge } from 'vis-network/standalone';
import { NFW } from './provider-browser/nfw/nfw';

export const CAPTURED_FLAG_REPLAYING = 1;

export type ICapturedPacket = [
    /** Internal flags */
    flags: number,
    /** Frame number */
    frame_number: number,
    /** Timestamp in ms */
    timestamp: number,
    /** Length of packet in bytes */
    length: number,
    /** Interest/Data/Nack */
    type: string,
    /** NDN name of packet */
    name: string,
    /** Originating node */
    from: string | undefined,
    /** Destination node */
    to?: string | undefined,
    /** Contents of the packet for visualization */
    p?: Uint8Array | undefined,
];

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
    /** Replay position */
    replayWindow?: number;
    /** Replay position (first) */
    replayWindowF?: number;
}

export interface INode extends Node {
    /* Not a forwarder -- definitely */
    nfw?: NFW;
    /** Extra data object */
    extra: INodeExtra;
    /** Label of this node */
    label: string;
    /** Set if this node is a passive switch */
    isSwitch?: boolean;
}

export interface ILinkExtra {
    /** Units of traffic pending on this link */
    pendingTraffic: number;
}

export interface IEdge extends Edge {
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

/** Connected Pty */
export interface IPty {
    id: string,
    name: string,
    write: EventEmitter<any>,
    data: EventEmitter<any>,
    resized: EventEmitter<any>,
    initBuf?: Uint8Array,
  }
