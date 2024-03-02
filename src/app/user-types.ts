import * as packet from '@ndn/packet';
import * as tlv from "@ndn/tlv";
import * as sync from '@ndn/sync';
import * as keychain from '@ndn/keychain';
import * as util from '@ndn/util';
import * as ws_transport from '@ndn/ws-transport';
import * as endpoint from '@ndn/endpoint';
import * as autoconfig from '@ndn/autoconfig';
import * as fw from '@ndn/fw';

import type { ICapturedPacket, INode, TlvType } from './interfaces';
import type { DCT as DCT_t } from './dct/dct.interface';
import type { WasmFS } from './wasm.service';

// Re-export all types here. The names in the modules object
// are used to declare the modules in the monaco editor, and
// must match the library name and export name exactly.
export type {
    packet, tlv, sync, keychain, util,
    ws_transport, endpoint, autoconfig, fw,
};

// the names in modul
export const modules = {
    '@ndn/packet': ['packet', packet],
    '@ndn/tlv': ['tlv', tlv],
    '@ndn/sync': ['sync', sync],
    '@ndn/keychain': ['keychain', keychain],
    '@ndn/util': ['util', util],
    '@ndn/ws-transport': ['ws_transport', ws_transport],
    '@ndn/endpoint': ['endpoint', endpoint],
    '@ndn/autoconfig': ['autoconfig', autoconfig],
    '@ndn/fw': ['fw', fw],
};

export namespace globals {
    /**
     * The current node on which the code runs
     */
    export const node: INode = <any> null;

    /**
     * Run a function in the context of a specified node
     * @param callback Function to be run
     * @param node Node on which the function will be run
     */
    export function $run(callback: (node: INode) => Promise<void>, node: string | INode): Promise<void> { return <any>null };

    /**
     * Visualize a NDN TLV block or packet
     * @param packet can be hex or base64 string, binary buffer or an encodable e.g. Interest
     */
    export function visualize(packet: TlvType): void {};

    /**
     * Filter packets to be captured
     * @param filter filter: function to check if captured packet should be stored
     */
    export function setGlobalCaptureFilter(filter: (packet: ICapturedPacket) => boolean): void {};

    /**
     * Load a local file from the user's computer
     */
    export function loadfile(): Promise<ArrayBuffer> { return <any>null; }

    /**
     * Download a file to user's computer
     * @param bin Buffer to be downloaded
     * @param type MIME type of the file to be downloaded
     * @param name Name of the file to be downloaded
     * @param deflate Compress the buffer using pako DEFLATE
     */
    export function downloadfile(bin: Uint8Array, type: string, name: string, deflate?: boolean): void {};

    /**
     * The WebAssembly filesystem.
     * @details Allows access to the virtual filesystem.
     * Note: this module exists only after the first call
     * to a WASM module has been done and the filesystem has been
     * initialized. The /data directory is the working directory
     * and is the only directory that is shared across all modules.
     */
    export const FS: WasmFS = <any>null;

    /**
     * The DCT tools module.
     */
    export const DCT: DCT_t = <any>null;
}

// These types are visible at NDN-Play compile time on the Window object
declare global {
    interface Window {
        // NDN-Play extensions
        $run: typeof globals.$run;
        visualize: typeof globals.visualize;
        setGlobalCaptureFilter: typeof globals.setGlobalCaptureFilter;
        loadfile: typeof globals.loadfile;
        downloadfile: typeof globals.downloadfile;

        // Augment console methods
        console: Console & {
            log_play: (...args: any[]) => void;
            info_play: (...args: any[]) => void;
            warn_play: (...args: any[]) => void;
            error_play: (...args: any[]) => void;
            clear_play: () => void;
        };

        // Other modules
        FS: typeof globals.FS;
        DCT: typeof globals.DCT;
    }
}
