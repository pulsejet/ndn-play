import { FwFace, FwPacket } from "@ndn/fw";
import { AltUri, Data, Interest } from "@ndn/packet";
import { Topology } from "src/app/topo/topo";
import { NFW } from "./nfw";
import { ICapturedPacket, INodeExtra } from "../../interfaces";
import { Encoder } from '@ndn/tlv';
import * as vis from 'vis-network/standalone';

export class Shark {
    private nodeId!: vis.IdType;
    private nodeLabel!: string;
    private nodeExtra!: INodeExtra;

    constructor(private nfw: NFW, private topo: Topology)
    {
        this.nodeUpdated()
    }

    public nodeUpdated() {
        this.nodeId = this.nfw.nodeId;
        this.nodeLabel = this.nfw.node().label!;
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

        // Store hex so we can dump later
        const hex = [...encoder.output].map((b) => (b.toString(16).padStart(2, "0"))).join("");

        // Get hops
        // If hops field doesn't exist then it is a local face (SCK)
        const thisHop: string = this.nodeLabel!;
        let otherHop: string = (<any>face).hops?.[this.nodeId] || (<any>pkt).hop;
        otherHop = otherHop ? this.topo.nodes.get(otherHop)?.label! : 'SCK';
        const fromHop = event == 'rx' ? otherHop : thisHop;
        const toHop = event == 'rx' ? thisHop : otherHop;

        // Create packet object
        const pack: ICapturedPacket = {
            t: performance.now(),
            p: hex,
            l: encoder.output.length,
            type: type,
            name: AltUri.ofName(pkt.l3.name).substr(0, 48),
            from: fromHop,
            to: toHop,
        };

        // Check if we want to capture this packet
        if (!this.topo.globalCaptureFilter(pack)) {
            return;
        }
        this.nodeExtra.capturedPackets.push(pack);
    }
}