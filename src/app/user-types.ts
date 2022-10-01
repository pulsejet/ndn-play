import * as packet from '@ndn/packet';
import * as tlv from "@ndn/tlv";
import * as sync from '@ndn/sync';
import * as keychain from '@ndn/keychain';
import * as util from '@ndn/util';
import * as ws_transport from '@ndn/ws-transport';

export { packet, tlv, sync, keychain, util, ws_transport }

import { ICapturedPacket, INode } from './interfaces';

export namespace ext {
    export const ndnTypes = { packet, tlv, sync, keychain, util, ws_transport };
    export const node: INode = <any> null;

    /**
     * Visualize a packet
     * @param packet can be hex string, binary buffer or an encodable e.g. Interest
     */
    export function visualize(packet: string | Uint8Array | tlv.Encodable): void {};

    /**
     * Filter packets to be captured
     * @param filter filter: function to check if captured packet should be stored
     */
    export function setGlobalCaptureFilter(filter: (packet: ICapturedPacket) => boolean): void {};
}

