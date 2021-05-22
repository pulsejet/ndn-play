import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GlobalService } from './global.service';
import { IEdge, INode } from './interfaces';
import { RoutingHelper } from './routing-helper';
import { loadMiniNDNConfig } from './minindn-config';
import { ndn as ndnUserTypes } from './user-types';

import { AltUri, Component as NameComponent } from "@ndn/packet";
import { Encoder, Decoder } from "@ndn/tlv";
import { getTlvTypeText, TlvV3 } from './tlv-types';

interface visTlv { t: number; l: number; v: visTlv[]; vl: Uint8Array; vs?: string };

enum mainTabs { Topology, Editor };

@Component({
  selector: 'app-root',
  templateUrl: 'app.html',
  styleUrls: ['app.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'ndn-play';

  /** Which tabs are selected */
  public mainTabs = mainTabs;
  public mainTab = mainTabs.Topology;

  public pendingClickEvent?: (params: any) => void;

  @ViewChild('networkContainer') networkContainer?: ElementRef;

  public loadMiniNDNConfig = loadMiniNDNConfig;

  public visualizedPacket?: visTlv[];
  public getTlvTypeText = getTlvTypeText;

  constructor(public gs: GlobalService)
  {}

  ngOnInit() {
    (<any>window).ndn = ndnUserTypes;

    this.gs.selectedNodeChangeCallback.subscribe((node) => {
      if (!node) {
        this.mainTab = mainTabs.Topology;
      }
    });
  }

  ngAfterViewInit() {
    this.gs.createNetwork(this.networkContainer?.nativeElement);
    this.gs.network?.on("click", this.onNetworkClick.bind(this));

    const computeFun = this.computeNFibs.bind(this);
    this.gs.nodes.on('add', computeFun);
    this.gs.nodes.on('remove', computeFun);
    this.gs.edges.on('add', computeFun);
    this.gs.edges.on('remove', computeFun);
    computeFun();

    setTimeout(() => {
      this.gs.selectNode(<INode>this.gs.nodes.get('5'));
      (<any>window).visualize = (p: any) => {
        const decodeRecursive = (input: Uint8Array) => {
          let t: Decoder.Tlv;
          let decoder = new Decoder(input);
          const arr: visTlv[] = [];

          // Read all elements as array
          while (true) {
            try {
              t = decoder.read()
              const obj: visTlv = { t: t.type, l: t.length, v: decodeRecursive(t.value), vl: t.value };

              // Creative visualization
              switch (obj.t) {
                // Don't show the entire name
                case (TlvV3.GenericNameComponent): {
                  obj.vs = AltUri.ofComponent(new Decoder(t.tlv).decode(NameComponent));
                  break;
                }

                default:
                  const maxlen = 16;
                  const str = [...obj.vl].map((b) => b.toString(16).padStart(2, '0')).join('');
                  obj.vs = '0x' + str.substr(0, maxlen) + (str.length > maxlen ? '...' : '');
              }

              arr.push(obj);
            } catch { break; }
          }

          return arr;
        }

        const encoder = new Encoder();
        encoder.encode(p);
        this.visualizedPacket = decodeRecursive(encoder.output);
        console.log(this.visualizedPacket);
      }
      this.runCode(`
        const { Interest } = ndn.packet;
        const interest = new Interest('/ndn/cathy-site/cathy/test', Interest.MustBeFresh);
        visualize(interest);
      `);
    }, 300);
  }

  onNetworkClick(params: any) {
    if (this.pendingClickEvent) {
      this.pendingClickEvent?.(params);
      return;
    }

    const id = this.gs.network?.getNodeAt(params.pointer.DOM);
    this.gs.selectNode(id ? <INode>this.gs.nodes.get(id) : undefined);

    if (!this.gs.getSelectedNode()) {
        const edgeId = this.gs.network?.getEdgeAt(params.pointer.DOM);
        this.gs.selectEdge(edgeId ? <IEdge>this.gs.edges.get(edgeId) : undefined);
    } else {
        this.gs.selectEdge(undefined);
    }

    for (const node of this.gs.nodes.get()) {
      node.nfw.updateColors();
    }
  }

  computeNFibs() {
    console.warn('Computing routes');
    const rh = new RoutingHelper(this.gs);
    const fibs = rh.calculateNPossibleRoutes();
    for (const nodeId in fibs) {
        const node = this.gs.nodes.get(nodeId);
        if (!node) continue;
        node.nfw.fib = fibs[nodeId];
        node.nfw.nodeUpdated();
    }
  }

  sendPingClick(params: any) {
    const id = this.gs.network.getNodeAt(params.pointer.DOM);
    if (!id) return;

    const dest = <INode>this.gs.nodes.get(id);
    const label = this.gs.getSelectedNode()?.label;
    const interest = {
        name: `/ndn/${label}-site/${label}/ping`,
        freshness: 3000,
        content: 'blob',
    };

    const start = performance.now();
    dest.nfw.expressInterest(interest, (data) => {
        console.log("Received = " + data.content, 'in', Math.round(performance.now() - start), 'ms');
    });
    this.pendingClickEvent = undefined;
  }

  selExpressInterest(name: string) {
    name = name.replace('$time', (new Date).getTime().toString());
    this.gs.getSelectedNode()?.nfw.expressInterest({ name, content: 'blob' }, (data) => {
      console.log(data.content);
    });
  }

  mlstrToArray(str: string) {
    return str.split('\n').map(v => v.trim()).filter(v => v);
  }

  runCode(code: string) {
    const testcode = `
      const { Data, Interest } = ndn.packet;
      const { fromUtf8, toUtf8 } = ndn.tlv;

      if (node.label === 'cathy') {
        const endpoint = node.nfw.getEndpoint();
        const producer = endpoint.produce('/ndn/cathy-site/cathy/test', async (interest) => {
          const data = new Data(interest.name, Data.FreshnessPeriod(500));
          data.content = toUtf8("Hello from NDNts");
          return data;
        });
      } else {
        const endpoint = node.nfw.getEndpoint();
        const interest = new Interest('/ndn/cathy-site/cathy/test');
        const data = await endpoint.consume(interest);
        alert(fromUtf8(data.content));
      }
    `;

    code = "try { (async () => { const node = this; " + code + "})() } catch (e) { console.error(e); }";
    const fun = new Function(code);
    fun.call(this.gs.getSelectedNode());
  }
}
