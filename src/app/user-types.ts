import { INode } from './interfaces';
import * as packet from '@ndn/packet';
import * as tlv from "@ndn/tlv";
import * as sync from '@ndn/sync';

export const node: INode = <any>null;
export const ndn = { packet, tlv, sync }
