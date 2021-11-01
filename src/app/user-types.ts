import * as packet from '@ndn/packet';
import * as tlv from "@ndn/tlv";
import * as sync from '@ndn/sync';
import * as keychain from '@ndn/keychain';

export { packet, tlv, sync, keychain}

import { ICapturedPacket, INode } from './interfaces';

export namespace ext {
    export const ndnTypes = { packet, tlv, sync, keychain };
    export const node: INode = <any> null;
    export function visualize(packet: any): void {};
    export function setGlobalCaptureFilter(filter: (packet: ICapturedPacket) => boolean): void {};
}

