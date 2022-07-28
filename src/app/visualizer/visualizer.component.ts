import { Component, Input, OnInit } from '@angular/core';
import { AltUri, Component as NameComponent } from "@ndn/packet";
import { Decoder, Encoder, Encodable, NNI } from '@ndn/tlv';
import { visTlv } from '../interfaces';
import { getTlvTypeText, TlvContentInfo, TlvSign, TlvV3 } from '../tlv-types';
import abnf from "../../abnf";

class ABNFNode {
  multiplier?: boolean;
  multiplier_min?: number;
  multiplier_max?: number;

  rules?: string;
  value?: string | number | ABNFNode[][];
  next?: any;
}
class ABNF {
  public readonly rules: any;
  private elements: any = {};

  constructor(abnfRules: string) {
    const tree: any[] = abnf.parse(abnfRules, {}) as any;
    const rules: any = {};

    for (const rule of tree) {
      if (typeof rule[0] !== "string") {
        continue;
      }
      const name = rule[0];
      const frule = rule[2][0];
      rules[name] = this.parseAlts(frule);
    }

    this.rules = rules;
  }

  /** Create one node element */
  parseOne(arr: any[]) {
    const elem = new ABNFNode();
    if (Array.isArray(arr[0]) && arr[0][1] == '*') {
      elem.multiplier = true;
      elem.multiplier_min = Number((<string>arr[0][0]).trim() || 0) || undefined;
      elem.multiplier_max = Number((<string>arr[0][2]).trim() || 0) || undefined;
    } else if (typeof arr[0] == 'string') {
      elem.multiplier = true;
      elem.multiplier_min = Number((<string>arr[0]).trim());
      elem.multiplier_max = Number((<string>arr[0]).trim());
    }

    if (typeof arr[1] == 'string') {
      elem.value = arr[1];
    } else if (Array.isArray(arr[1])) {
      if (arr[1][0] == '%') { // Number
        let radix = 10;
        if (arr[1][1][0] == 'd') { // Decimal
          radix = 10;
        } else if (arr[1][1][0] == 'b') {  // Binary
          radix = 2;
        } else if (arr[1][1][0] == 'x') { // Hex
          radix = 16;
        }

        elem.value = parseInt(arr[1][1][1].join(''), radix);
      }

      else if (arr[1][0] == '[') { // optional
        elem.value = this.parseAlts(arr[1][2]);
      }
    }

    return elem
  }

  /** Parse elements for one continuous rule */
  parseCont(root: any[]) {
    const list = [this.parseOne(root[0])];

    for (const node of root[1]) {
      list.push(this.parseOne(node[1]));
    }

    return list;
  }

  /** Parse all alternatives */
  parseAlts(root: any[]) {
    const list = [this.parseCont(root[0])];

    for (const node of root[1]) {
      if (node[1] === '/') {
        list.push(this.parseCont(node[3]));
      }
    }

    return list;
  }
}

const abnfdef = `
NDN-PACKET = Interest / Data

Name=NAME-TYPE TLV-LENGTH *NameComponent
NameComponent = GenericNameComponent /
                    ImplicitSha256DigestComponent /
                    ParametersSha256DigestComponent /
                    OtherTypeComponent

GenericNameComponent = GENERIC-NAME-COMPONENT-TYPE TLV-LENGTH *OCTET

ImplicitSha256DigestComponent = IMPLICIT-SHA256-DIGEST-COMPONENT-TYPE
                                    TLV-LENGTH ; == 32
                                    32OCTET

ParametersSha256DigestComponent = PARAMETERS-SHA256-DIGEST-COMPONENT-TYPE
                                      TLV-LENGTH ; == 32
                                      32OCTET
OtherTypeComponent = OTHER-TYPE-COMPONENT-TYPE TLV-LENGTH *OCTET

Interest = INTEREST-TYPE TLV-LENGTH
             Name
             [CanBePrefix]
             [MustBeFresh]
             [ForwardingHint]
             [Nonce]
             [InterestLifetime]
             [HopLimit]
             [ApplicationParameters [InterestSignature]]

CanBePrefix = CAN-BE-PREFIX-TYPE
             TLV-LENGTH ; == 0
MustBeFresh = MUST-BE-FRESH-TYPE
             TLV-LENGTH ; == 0
ForwardingHint = FORWARDING-HINT-TYPE TLV-LENGTH 1*Name
Nonce = NONCE-TYPE
        TLV-LENGTH ; == 4
        4OCTET

GENERIC-NAME-COMPONENT-TYPE = %d8
NONCE-TYPE = %d10
FORWARDING-HINT-TYPE = %d30
CAN-BE-PREFIX-TYPE = %d33
MUST-BE-FRESH-TYPE = %d18
INTEREST-TYPE = %d5
NAME-TYPE = %d7

`;
const mydef = new ABNF(abnfdef);

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

  private context: any = {}

  getNum(elem: ABNFNode): number {
    if (typeof elem.value === 'number') {
      return elem.value;
    }

    const rule = mydef.rules[elem.value as string];
    return rule ? this.getNum(rule[0][0]) : 0;
  }

  getContextRecursive(rule: string, rootRule=rule, altNodes?: ABNFNode[][]) {
    altNodes = altNodes || mydef.rules[rule] || [];
    if (!this.context[rootRule]) {
      this.context[rootRule] = {};
    }

    for (const alt of altNodes!) {
      // Add rest to current
      let addRest = true;

      // Identify TLVs
      if (alt.length > 1 && alt[1].value === 'TLV-LENGTH') {
        this.context[rootRule][this.getNum(alt[0])] = rule;
        if (rule !== rootRule) {
          addRest = false;
        }
      }

      // Other elements, upto a max depth of 1
      for (const elem of alt) {
        let rec: any = {};
        if (typeof elem.value === 'string') {
          rec = this.getContextRecursive(elem.value, addRest ? rootRule : rule);
        } else if (Array.isArray(elem.value)) {
          rec = this.getContextRecursive(rule, addRest ? rootRule : rule, elem.value);
        }
      }
    }

    return this.context;
  }

  ngOnInit(): void {
    console.log(mydef.rules);
    console.log(this.getContextRecursive('NDN-PACKET'));
    this.visualizedTlv = this.visualize('052d07230805616c696365080470696e670814313637373336363636383331333334343534373712000a04c1259fe5');
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

    return this.decodeRecursive(buffer, 'NDN-PACKET');
  }

  decodeRecursive(input: Uint8Array, outer: string): visTlv[] {
    let t: Decoder.Tlv;
    let decoder = new Decoder(input);
    const arr: visTlv[] = [];

    // Read all elements as array
    while (true) {
      try {
        t = decoder.read()
        const text = this.context[outer]?.[t.type];
        if (t.type == 0 || (!this.attemptUnknownDecode && !text)) continue;

        const obj: visTlv = {
          t: t.type,
          l: t.length,
          v: this.decodeRecursive(t.value, text),
          vl: t.value,
          tl: t.tlv.length,
        };

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

    // if (input.length !== arr.map((t) => t.tl).reduce((a, b) => a + b, 0)) {
    //   return [];
    // }
    return arr;
  }
}
