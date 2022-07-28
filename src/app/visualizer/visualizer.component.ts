import { Component, Input, OnInit } from '@angular/core';
import { AltUri, Component as NameComponent } from "@ndn/packet";
import { Decoder, Encoder, Encodable, NNI } from '@ndn/tlv';
import { GlobalService } from '../global.service';
import { visTlv } from '../interfaces';

@Component({
  selector: 'app-visualizer',
  templateUrl: 'visualizer.component.html',
  styleUrls: ['visualizer.component.css']
})
export class VisualizerComponent implements OnInit {
  @Input() public tlv?: any;
  public visualizedTlv?: visTlv[];
  public attemptUnknownDecode: boolean = false;

  private tlvTypes?: {[key: string]: any};
  private compiledTlvCode: string = '';

  constructor(private gs: GlobalService) { }

  ngOnInit(): void {
    fetch('/assets/tlv-types.ts').then((res) => res.text()).then((code) => {
      this.gs.topo.tlvTypesCode = code.trim();

      // Load custom TLV types from local storage
      const customTlvTypes = localStorage.getItem('customTlvTypes');
      if (customTlvTypes) {
        this.gs.topo.tlvTypesCode += customTlvTypes;
      }

      // Compile TLV types
      this.compileTlvTypes();
    }).catch((err) => {
      console.error(err);
    });
  }

  ngOnChanges() {
    if (this.tlv) {
      this.visualizedTlv = this.visualize(this.tlv);
    } else {
      this.visualizedTlv = undefined;
    }
  }

  compileTlvTypes() {
    if (this.compiledTlvCode === this.gs.topo.tlvTypesCode) return;
    this.compiledTlvCode = this.gs.topo.tlvTypesCode;

    // Transpile as module and get exports
    let code = (<any>window).ts.transpileModule(this.gs.topo.tlvTypesCode, {
      target: (<any>window).ts.ScriptTarget.ES2015,
    });
    code = `
      const exports = {};
      ${code.outputText};
      return exports;`;

    try {
      const fun = new Function(code);
      this.tlvTypes = fun.call(null);
      console.warn('Compiled TLV types');
    } catch (e) {
      console.error('Failed to compile TLV types');
      console.error(e);
      return;
    }

    // Persist custom TLV types
    const i = this.compiledTlvCode.lastIndexOf('+==+==+');
    const customTlvTypes = this.compiledTlvCode.substring(i + 7);
    localStorage.setItem('customTlvTypes', customTlvTypes);
  }

  getTlvTypeText(type: number, parent: number): string | undefined {
    /** Check if constrained parent is valid */
    const isValidParent = (text: string) => {
      const inClause = this.tlvTypes?.[`T_IN_${text}`];
      if (!inClause) return true;
      return inClause.includes(parent);
    }

    /** Try to find the type */
    for (const key in this.tlvTypes) {
      if (key.startsWith('TLV_') && this.tlvTypes[key][type]) {
        const text = this.tlvTypes[key][type] as string;
        return isValidParent(text) ? text : undefined;
      }
    }
    return undefined;
  }

  visualize(tlv: string | Uint8Array | Encodable): visTlv[] {
    if (!tlv) return [];
    this.compileTlvTypes();

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

    return this.decodeRecursive(buffer, 0);
  }

  decodeRecursive(input: Uint8Array, parent: number): visTlv[] {
    let t: Decoder.Tlv;
    let decoder = new Decoder(input);
    const arr: visTlv[] = [];

    // Read all elements as array
    while (true) {
      try {
        t = decoder.read()
        const typeText = this.getTlvTypeText(t.type, parent);
        const isUnknown = !this.attemptUnknownDecode && !typeText;
        const isCritical = (t.type & 1);
        if (t.type == 0 || (isUnknown && isCritical)) return [];

        const children = isUnknown ? [] : this.decodeRecursive(t.value, t.type);
        const obj: visTlv = {
          t: t.type,
          tts: typeText || `T=${t.type}`,
          l: t.length,
          v: children,
          vl: t.value,
          tl: t.tlv.length,
        };

        // Binary hex
        obj.vs = [...obj.vl].map((b) => b.toString(16).padStart(2, '0')).join('');

        // Creative visualization
        switch (obj.t) {
          case (0x08): { // GenericNameComponent
            obj.hs = AltUri.ofComponent(new Decoder(t.tlv).decode(NameComponent));
            obj.human = true;
            break;
          }

          default:
            // ASCII value with . for unknown
            obj.hs = [...obj.vl].map((b) => b >= 32 && b <= 126 ? String.fromCharCode(b) : '.').join('');
        }

        // NNI Decoding
        const nniEnum = this.tlvTypes?.[`NNI_${typeText}`];
        if (nniEnum) {
          try {
            obj.hs = NNI.decode(t.value);
            if (typeof nniEnum === 'object') {
              obj.hs = nniEnum[obj.hs] || obj.hs;
            }
          } catch {}
          obj.human = true;
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
