import { AfterViewInit, Component, EventEmitter } from '@angular/core';
import { GlobalService } from '../global.service';

import { Decoder } from '@ndn/tlv';
import { LpPacket } from '@ndn/lp';
import { AltUri, Data, Interest } from '@ndn/packet';

import type { ICapturedPacket, INode, TlvType } from '../interfaces';

@Component({
  selector: 'app-devtools',
  templateUrl: 'devtools.component.html',
  styleUrls: ['devtools.component.scss']
})
export class DevtoolsComponent implements AfterViewInit {
  /** Currently visualized tlv */
  public visualizedTlv: TlvType;

  /** Notification of pane size change */
  public readonly paneResizeEmitter = new EventEmitter<void>;

  /** Dummy node for captures */
  public readonly node: INode;

  constructor(public readonly gs: GlobalService) {
    this.gs.topo.edges.clear();
    this.gs.topo.nodes.clear();

    this.gs.topo.nodes.add({
      id: 'devtools',
      label: 'Devtools',
    } as INode);

    this.node = this.gs.topo.nodes.get('devtools')!;
  }

  ngAfterViewInit() {
    window.addEventListener('resize', this.paneResized.bind(this));

    // Set listener for packets from outer window
    window.addEventListener('message', (e) => {
      if (e.data.type === 'recv-packet') {
        this.pushPacket(e.data.packet, false);
      } else if (e.data.type === 'send-packet') {
        this.pushPacket(e.data.packet, true);
      }
    }, false);

    // Trigger resize after 100ms
    setTimeout(() => this.paneResized(), 100);
  }

  paneResized() {
    this.paneResizeEmitter.emit();
  }

  setVisualized(p: ICapturedPacket, node: INode) {
    this.visualizedTlv = p[8] ?? undefined;
  }

  pushPacket(base64: string, outgoing: boolean) {
    const packet = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const src = outgoing ? '↑ OUT' : '↓ IN';
    let type = String(), name = String();

    // Decode L2 or L3 packet
    let wire = packet;
    let decoder = new Decoder(wire);

    // Decode if this is an LpPacket
    if (wire[0] === 100) {
      const lp = LpPacket.decodeFrom(decoder);
      wire = lp.payload ?? packet;
      decoder = new Decoder(wire);
    }

    // Decode L3 packet
    let l3: Data | Interest | null = null;
    switch (wire[0]) {
      case 5:
        l3 = Interest.decodeFrom(decoder);
        break;
      case 6:
        l3 = Data.decodeFrom(decoder);
        break;
    }

    // No L3 packet could be decoded
    if (!l3) return;

    // get attributes
    type = l3.constructor.name;
    name = AltUri.ofName(l3.name);

    this.node.extra.capturedPackets.push([
      0, 0, performance.now(),
      packet.length, type, name,
      src, undefined, packet,
    ]);
  }

  dump() {
    this.gs.topo.provider.downloadExperimentDump?.();
  }
}
