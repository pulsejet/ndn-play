import * as packet from '@ndn/packet';
import * as tlv from "@ndn/tlv";
import * as sync from '@ndn/sync';
import * as keychain from '@ndn/keychain';
import * as util from '@ndn/util';
import * as ws_transport from '@ndn/ws-transport';
import * as endpoint from '@ndn/endpoint';

export { packet, tlv, sync, keychain, util, ws_transport, endpoint }

import { ICapturedPacket, INode } from './interfaces';

export namespace ext {
    export const ndnTypes = { packet, tlv, sync, keychain, util, ws_transport, endpoint };
    export const node: INode = <any> null;

    /**
     * Visualize a packet
     * @param packet can be hex string, binary buffer or an encodable e.g. Interest
     */
    export function visualize(packet: string | Uint8Array | ArrayBuffer | tlv.Encodable | undefined): void {};

    /**
     * Filter packets to be captured
     * @param filter filter: function to check if captured packet should be stored
     */
    export function setGlobalCaptureFilter(filter: (packet: ICapturedPacket) => boolean): void {};

    /**
     * Load a local file from the user's computer
     */
    export function loadfile(): Promise<ArrayBuffer> { return null as any; }

    /**
     * Download a file to user's computer
     * @param bin Buffer to be downloaded
     * @param type MIME type of the file to be downloaded
     * @param name Name of the file to be downloaded
     * @param deflate Compress the buffer using pako DEFLATE
     */
    export function downloadfile(bin: Uint8Array, type: string, name: string, deflate?: boolean): void {};
}

// These types are visible at NDN-Play compile time on the Window object
declare global {
    interface Window {
        ndn: typeof ext.ndnTypes;
        visualize: typeof ext.visualize;
        setGlobalCaptureFilter: typeof ext.setGlobalCaptureFilter;
        loadfile: typeof ext.loadfile;
        downloadfile: typeof ext.downloadfile;

        monaco: any; // editor
        ts: any; // typescript compiler
    }
}
