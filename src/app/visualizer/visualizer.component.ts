import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AltUri, Name, Component as NameComponent } from "@ndn/packet";
import { Decoder, Encoder, NNI } from '@ndn/tlv';
import { GlobalService } from '../global.service';
import { postToParent } from '../helper';
import { transpileModule } from 'typescript';
import localforage from 'localforage';

import type { TlvType, visTlv } from '../interfaces';

const LF_KEYS = {
  CUSTOM_TLV: 'customTlvTypes',
  TLV_TYPES_TS: 'tlvTypesTs',
  TLV_TYPES: 'tlvTypes',
}

@Component({
  selector: 'app-visualizer',
  templateUrl: 'visualizer.component.html',
  styleUrls: ['visualizer.component.scss']
})
export class VisualizerComponent implements OnInit {
  @Input() public tlv?: TlvType;
  @Input() public guessBox?: boolean = true;
  @Input() public warnEmpty?: boolean = true;
  @Output() public readonly change = new EventEmitter<TlvType>();

  @ViewChild('outer') public outer?: ElementRef;
  private resizeObserver?: ResizeObserver;

  public visualizedTlv?: visTlv[];
  public attemptUnknownDecode: boolean = false;

  private tlvTypes?: Record<string, any>;
  private compiledTlvCode: string = String();

  private _initialized: boolean = false;

  constructor(private readonly gs: GlobalService) { }

  async ngOnInit() {
    const res = await fetch('assets/tlv-types.ts')
    const code = await res.text();
    this.gs.topo.tlvTypesCode = code.trim() + '\n';

    // Load cached values from local storage
    const [customTypes, compiledCode, compiledTypes] = await Promise.all([
      localforage.getItem<string>(LF_KEYS.CUSTOM_TLV),
      localforage.getItem<string>(LF_KEYS.TLV_TYPES_TS),
      localforage.getItem<string>(LF_KEYS.TLV_TYPES),
    ]);

    this.gs.topo.tlvTypesCode += globalThis._externalConfig?.customTlvTypes ?? customTypes ?? String();
    this.compiledTlvCode = compiledCode ?? String();
    this.tlvTypes = compiledTypes ? JSON.parse(compiledTypes) : undefined;

    // Compile TLV types
    this.compileTlvTypes();

    // Check if TLV types specified
    this.refresh();
    this._initialized = true;
  }

  ngOnChanges() {
    if (this._initialized) {
      // Prevent a refresh before the TLV types are loaded
      // This is especially important for devtools because
      // an incorrect custom types value may be posted to the
      // parent and persisted
      this.refresh();
    }
  }

  refresh() {
    if (this.tlv) {
      this.visualizedTlv = this.visualize(this.tlv);
    } else {
      this.visualizedTlv = undefined;
    }
  }

  checkTypes() {
    if (!this._initialized) return;

    // Refresh if the input TLV TS has changed
    if (this.compiledTlvCode !== this.gs.topo.tlvTypesCode) {
      this.refresh();
    }
  }

  ngAfterViewInit() {
    if (this.outer?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => {
        window.parent?.postMessage({
          visHeight: this.outer?.nativeElement.offsetHeight,
        }, '*');
      });
      this.resizeObserver.observe(this.outer.nativeElement);
    }
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  compileTlvTypes() {
    if (this.compiledTlvCode === this.gs.topo.tlvTypesCode) return;
    this.compiledTlvCode = this.gs.topo.tlvTypesCode;

    // Transpile as module and get exports
    const code = [
      'const exports = {};',
      transpileModule(this.gs.topo.tlvTypesCode, {}).outputText,
      'return exports;',
    ].join(';\n');

    try {
      this.tlvTypes = new Function(code).call(null);
      console.warn('Compiled TLV types');

      // Cache the compiled types
      localforage.setItem(LF_KEYS.TLV_TYPES_TS, this.compiledTlvCode);
      localforage.setItem(LF_KEYS.TLV_TYPES, JSON.stringify(this.tlvTypes));
    } catch (e) {
      console.error('Failed to compile TLV types');
      console.error(e);
      return;
    }

    // Persist custom TLV types
    const delimiter = '+==+==+';
    const i = this.compiledTlvCode.lastIndexOf(delimiter);
    const customTlvTypes = this.compiledTlvCode.substring(i + delimiter.length).trim();
    localforage.setItem(LF_KEYS.CUSTOM_TLV, customTlvTypes);

    // Post to parent for devtools
    postToParent({
      type: LF_KEYS.CUSTOM_TLV,
      data: customTlvTypes,
    })
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
        if (isValidParent(text)) return text;
      }
    }
    return undefined;
  }

  visualize(tlv: TlvType): visTlv[] {
    if (!tlv) return [];
    this.compileTlvTypes();

    let buffer: Uint8Array;

    if (typeof tlv == 'string') {
      const tlvStr = tlv.replace(/\s/g, '');

      // Guess if hex or base64
      if (tlvStr.match(/^[0-9a-fA-F]+$/)) {
        // Everything matches hex, so assume hex
        buffer = new Uint8Array((tlv.match(/.{1,2}/ig) ?? []).map(c => parseInt(c, 16)));
      } else if (tlvStr.match(/^[0-9a-zA-Z+/]+={0,2}$/)) {
        // Assume base64
        buffer = Uint8Array.from(atob(tlvStr), c => c.charCodeAt(0));
      } else {
        console.error('Invalid TLV string (not hex or base64)');
        return [];
      }
    } else if (tlv instanceof Uint8Array) {
      buffer = tlv;
    } else if (tlv instanceof ArrayBuffer) {
      buffer = new Uint8Array(tlv);
    } else {
      const encoder = new Encoder();
      encoder.encode(tlv);
      buffer = encoder.output;
    }

    this.change.emit(tlv);

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
        const isBlob = this.tlvTypes?.[`BLOB_${typeText}`];
        if (t.type == 0 || (isUnknown && isCritical)) return [];

        const children = (isUnknown || isBlob) ? [] : this.decodeRecursive(t.value, t.type);
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
          case (0x07): { // Name
            obj.hs = AltUri.ofName(new Decoder(t.tlv).decode(Name));
            break;
          }

          case (0x08): { // GenericNameComponent
            obj.hs = AltUri.ofComponent(new Decoder(t.tlv).decode(NameComponent));
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

        // Treat as text by default
        if (this.tlvTypes?.[`TEXT_${typeText}`]) {
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

  public onClick(tlv: visTlv) {
    // Special handling if the TLV has children
    if (tlv.v.length > 0) {
      // If the TLV has a human representation,
      // then toggle children view mode
      if (tlv.human) {
        tlv.nonest = !tlv.nonest;
      }

      return;
    }

    // Toggle human-readable view
    tlv.human = !tlv.human
  }
}
