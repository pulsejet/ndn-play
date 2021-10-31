import { ICapturedPacket, INode } from './interfaces';
import * as packet from '@ndn/packet';
import * as tlv from "@ndn/tlv";
import * as sync from '@ndn/sync';
import * as keychain from '@ndn/keychain';

export const node: INode = <any>null;
export const ndn = { packet, tlv, sync, keychain };

export const visualize: (packet: any) => void = <any>null;
export const setGlobalCaptureFilter: (filter: (packet: ICapturedPacket) => boolean) => void = <any>null;
