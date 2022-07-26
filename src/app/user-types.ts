import * as packet from '@ndn/packet';
import * as tlv from "@ndn/tlv";
import * as sync from '@ndn/sync';
import * as keychain from '@ndn/keychain';
import * as util from '@ndn/util';

export { packet, tlv, sync, keychain, util }

import { ICapturedPacket, INode } from './interfaces';

export namespace ext {
    export const ndnTypes = { packet, tlv, sync, keychain, util };
    export const node: INode = <any> null;
    export function visualize(packet: any): void {};
    export function setGlobalCaptureFilter(filter: (packet: ICapturedPacket) => boolean): void {};
}

