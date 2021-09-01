import { Component, Input, OnInit } from '@angular/core';
import { AltUri, Component as NameComponent } from "@ndn/packet";
import { Decoder, Encoder, Encodable } from '@ndn/tlv';
import { visTlv } from '../interfaces';
import { getTlvTypeText, TlvV3 } from '../tlv-types';

@Component({
  selector: 'app-visualizer',
  templateUrl: 'visualizer.component.html',
  styleUrls: ['visualizer.component.css']
})
export class VisualizerComponent implements OnInit {

  public getTlvTypeText = getTlvTypeText;

  @Input() public packet?: Encodable;
  public visualizedPacket?: visTlv[];
  public attemptUnknownDecode: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    if (this.packet) {
      this.visualizedPacket = this.visualize(this.packet);
    }
  }

  visualize(packet: Encodable): visTlv[] {
    const encoder = new Encoder();
    encoder.encode(packet);
    return this.decodeRecursive(encoder.output);
  }

  decodeRecursive(input: Uint8Array): visTlv[] {
    let t: Decoder.Tlv;
    let decoder = new Decoder(input);
    const arr: visTlv[] = [];

    // Read all elements as array
    while (true) {
      try {
        t = decoder.read()
        const obj: visTlv = {
          t: t.type,
          l: t.length,
          v: this.decodeRecursive(t.value),
          vl: t.value,
          tl: t.tlv.length,
        };
        if (t.type == 0 || (!this.attemptUnknownDecode && getTlvTypeText(t.type).startsWith('T='))) return [];

        // Creative visualization
        switch (obj.t) {
          // Don't show the entire name
          case (TlvV3.GenericNameComponent): {
            obj.vs = AltUri.ofComponent(new Decoder(t.tlv).decode(NameComponent));
            break;
          }

          default:
            obj.vs = '0x' + [...obj.vl].map((b) => b.toString(16).padStart(2, '0')).join('');
        }

        if (obj.vs) {
          const maxlen = 32;
          obj.vs =  obj.vs.substr(0, maxlen) + (obj.vs.length > maxlen ? ' ...' : '');
        }

        arr.push(obj);
      } catch {
        break;
      }
    }

    if (input.length !== arr.map((t) => t.tl).reduce((a, b) => a + b, 0)) {
      return [];
    }

    return arr;
  }
}
