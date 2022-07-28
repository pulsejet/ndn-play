import { Component, Input, OnInit } from '@angular/core';
import { AltUri, Component as NameComponent } from "@ndn/packet";
import { Decoder, Encoder, Encodable, NNI } from '@ndn/tlv';
import { visTlv } from '../interfaces';
import { getTlvTypeText, TlvContentInfo, TlvSign, TlvV3 } from '../tlv-types';

@Component({
  selector: 'app-visualizer',
  templateUrl: 'visualizer.component.html',
  styleUrls: ['visualizer.component.css']
})
export class VisualizerComponent implements OnInit {

  public getTlvTypeText = getTlvTypeText;

  @Input() public tlv?: any;
  public visualizedTlv?: visTlv[];
  public attemptUnknownDecode: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    if (this.tlv) {
      this.visualizedTlv = this.visualize(this.tlv);
    } else {
      this.visualizedTlv = undefined;
    }
  }

  visualize(tlv: string | Uint8Array | Encodable): visTlv[] {
    if (!tlv) return [];

    let buffer: Uint8Array;

    if (typeof tlv == 'string') {
      const matches = tlv.replace(/\s/g, '').match(/.{1,2}/ig);
      buffer = new Uint8Array((matches || []).map(byte => parseInt(byte, 16)));
    } else if (tlv instanceof Uint8Array) {
      buffer = tlv;
    } else {
      const encoder = new Encoder();
      encoder.encode(tlv);
      buffer = encoder.output;
    }

    return this.decodeRecursive(buffer);
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

        // Binary hex
        obj.vs = [...obj.vl].map((b) => b.toString(16).padStart(2, '0')).join('');

        // Creative visualization
        switch (obj.t) {
          case (TlvV3.GenericNameComponent): {
            obj.hs = AltUri.ofComponent(new Decoder(t.tlv).decode(NameComponent));
            obj.human = true;
            break;
          }

          default:
            // ASCII value with . for unknown
            obj.hs = [...obj.vl].map((b) => b >= 32 && b <= 126 ? String.fromCharCode(b) : '.').join('');
        }

        // Non negative integers
        const NNI_TYPES = [
          TlvV3.InterestLifetime,
          TlvV3.FreshnessPeriod,
          TlvV3.ContentType,
          TlvV3.SignatureType,
          TlvV3.SignatureTime,
          TlvV3.SignatureSeqNum,
        ]
        if (NNI_TYPES.includes(obj.t)) {
          try {
            obj.hs = NNI.decode(t.value);
          } catch {}
          obj.human = true;
        }

        // NNI special types
        if (typeof obj.hs === 'number') {
          switch(obj.t) {
            case TlvV3.ContentType:
              obj.hs = TlvContentInfo[obj.hs] || obj.hs;
              break;
            case TlvV3.SignatureType:
              obj.hs = TlvSign[obj.hs] || obj.hs;
              break;
          }
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
