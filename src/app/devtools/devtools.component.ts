import { AfterViewInit, Component, EventEmitter, OnInit } from '@angular/core';
import { GlobalService } from '../global.service';

import { Decoder } from '@ndn/tlv';
import { LpPacket } from '@ndn/lp';
import { AltUri, Data, Interest } from '@ndn/packet';

import type { ICapturedPacket, INode, TlvType } from '../interfaces';

const PostMsg = {
  ReceivePacket: 'recv-packet',
  SendPacket: 'send-packet',
  Visualize: 'visualize',
}

@Component({
  selector: 'app-devtools',
  templateUrl: 'devtools.component.html',
  styleUrls: ['devtools.component.scss']
})
export class DevtoolsComponent implements OnInit, AfterViewInit {
  /** Currently visualized tlv */
  public visualizedTlv: TlvType;

  /** Notification of pane size change */
  public readonly paneResizeEmitter = new EventEmitter<void>;

  /** Dummy node for captures */
  public readonly node: INode;

  /** Show or hide the capture panel */
  public showCapturePanel: boolean = true;

  /** Lazy load the code editor only when a tab is opened */
  public loadMonaco: boolean = false;

  constructor(public readonly gs: GlobalService) {
    this.gs.topo.edges.clear();
    this.gs.topo.nodes.clear();

    this.gs.topo.nodes.add({
      id: 'devtools',
      label: 'Devtools',
    } as INode);

    this.node = this.gs.topo.nodes.get('devtools')!;

    // Various modes of devtools set with the query parameter
    // Default is everything (chrome extension)
    const url = new URL(window.location.href);
    switch (url.searchParams.get('devtools')) {
      case 'visualizer':
        this.showCapturePanel = false;
        break;
    }
  }

  ngOnInit() {
    // Set listener for messages from outer window
    window.addEventListener('message', (e) => {
      switch (e.data.type) {
        case PostMsg.ReceivePacket:
          this.pushPacket(e.data.packet, e.data.timestamp, false);
          break;

        case PostMsg.SendPacket:
          this.pushPacket(e.data.packet,  e.data.timestamp, true);
          break;

        case PostMsg.Visualize:
          this.visualizedTlv = e.data.packet;
          break;
      }
    }, false);
  }

  ngAfterViewInit() {
    // Resize on window resize
    window.addEventListener('resize', this.paneResized.bind(this));

    // Trigger resize after 100ms
    setTimeout(() => this.paneResized(), 100);
  }

  paneResized() {
    this.paneResizeEmitter.emit();
  }

  setVisualized(p: ICapturedPacket, node: INode) {
    this.visualizedTlv = p[8] ?? undefined;
  }

  pushPacket(base64: string, timestamp: number, outgoing: boolean) {
    const packet = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    let l3Type: "Interest" | "Data" | "Nack" | "Unknown" = "Unknown";

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
        l3Type = "Interest";
        break;
      case 6:
        l3 = Data.decodeFrom(decoder);
        l3Type = "Data";
        break;
    }

    // No L3 packet could be decoded
    if (!l3) return;

    this.node.extra.capturedPackets.push([
      0, 0, // unused flags
      timestamp || performance.now(), // timestamp
      packet.length, // length
      l3Type, // type
      AltUri.ofName(l3.name), // name
      outgoing ? '↑ OUT' : '↓ IN', // source
      undefined, // destination
      packet, // buffer
    ]);
  }

  dump() {
    this.gs.topo.provider.downloadExperimentDump?.();
  }
}
