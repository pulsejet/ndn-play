import { FwFace, FwPacket } from "@ndn/fw";
import { AltUri, Data, Interest } from "@ndn/packet";
import { Topology } from "src/app/topo/topo";
import { NFW } from "./nfw";
import { ICapturedPacket, INodeExtra } from "../../interfaces";
import { Encoder } from '@ndn/tlv';
import { IdType } from 'vis-network/standalone';

export class Shark {
    private nodeId!: IdType;
    private nodeExtra!: INodeExtra;

    constructor(private nfw: NFW, private topo: Topology)
    {
        this.nodeUpdated()
    }

    public nodeUpdated() {
        this.nodeId = this.nfw.nodeId;
        this.nodeExtra = this.nfw.node().extra!;
    }

    public capturePacket(face: FwFace, pkt: FwPacket, event: "tx" | "rx") {
        // Confirm we are capturing
        if (!this.nfw.capture && !this.topo.captureAll) return;

        // Skip if this came from content store
        if (face == this.nfw.localFace) return;

        // Get type of packet
        let type;
        if (pkt.l3 instanceof Interest) {
            type = 'Interest';
        } else if (pkt.l3 instanceof Data) {
            type = 'Data';
        } else {
            return;
        }

        const encoder = new Encoder();
        encoder.encode(pkt.l3);

        // Get hops
        // If hops field doesn't exist then it is a local face (SCK)
        const thisHop = <string>this.nodeId!;
        let otherHop: string = (<any>face).hops?.[this.nodeId] || (<any>pkt).hop;
        otherHop = otherHop ? otherHop! : 'SCK';
        const fromHop = event == 'rx' ? otherHop : thisHop;
        const toHop = event == 'rx' ? thisHop : otherHop;

        // Make a copy of the buffer just to be safe
        const packBuf = new Uint8Array(new ArrayBuffer(encoder.output.byteLength));
        packBuf.set(encoder.output);

        // Create packet object
        const pack: ICapturedPacket = [
            0,
            0,
            performance.now(),
            encoder.output.length,
            type,
            AltUri.ofName(pkt.l3.name).substring(0, 48),
            fromHop,
            toHop,
            packBuf,
        ];

        // Check if we want to capture this packet
        if (!this.topo.globalCaptureFilter(pack)) {
            return;
        }
        this.nodeExtra.capturedPackets.push(pack);
    }
}