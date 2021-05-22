import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GlobalService } from './global.service';
import { IEdge, INode } from './interfaces';
import { RoutingHelper } from './routing-helper';
import { loadMiniNDNConfig } from './minindn-config';
import { ndn as ndnUserTypes } from './user-types';
import { Encodable } from '@ndn/tlv';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Interest } from '@ndn/packet';

enum mainTabs { Topology, Editor };
enum lowerTabs { Console, Visualizer, Captured };

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
  public lowerTabs = lowerTabs;
  public lowerTab = lowerTabs.Console;

  /** Currently visualized packet */
  public visualizedPacket?: Encodable;

  /** Next click event */
  public pendingClickEvent?: (params: any) => void;

  /** Aliases */
  public loadMiniNDNConfig = loadMiniNDNConfig;

  /** Call on console resize */
  consoleResize: () => void = <any>undefined;

  /** Native Elements */
  @ViewChild('networkContainer') networkContainer?: ElementRef;
  @ViewChild('console') console?: ElementRef;

  constructor(public gs: GlobalService)
  {}

  ngOnInit() {
    (<any>window).ndn = ndnUserTypes;
    (<any>window).visualize = (p: any) => this.visualizedPacket = p;

    this.gs.selectedNodeChangeCallback.subscribe((node) => {
      if (!node) {
        this.mainTab = mainTabs.Topology;
      }
    });
  }

  ngAfterViewInit() {
    // Setup
    this.gs.createNetwork(this.networkContainer?.nativeElement);
    this.gs.network?.on("click", this.onNetworkClick.bind(this));

    // Routing
    const computeFun = this.computeNFibs.bind(this);
    this.gs.nodes.on('add', computeFun);
    this.gs.nodes.on('remove', computeFun);
    this.gs.edges.on('add', computeFun);
    this.gs.edges.on('remove', computeFun);
    computeFun();

    // Terminal
    var term = new Terminal({
      theme: {
        background: 'white',
        foreground: 'black',
        selection: '#ddd',
      },
      fontSize: 13,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    this.consoleResize = fitAddon.fit.bind(fitAddon);
    term.open(this.console?.nativeElement);
    this.gs.consoleLog.subscribe((e) => {
      let msg = e.msg;
      if (e.type == 'error') {
        msg = `\u001b[31m${msg}\u001b[0m`;
      } else if (e.type == 'warn') {
        msg = `\u001b[33m${msg}\u001b[0m`;
      }
      term.writeln(msg);
    });
    fitAddon.fit();

    window.addEventListener('resize', this.consoleResize);
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
    const name = `/ndn/${label}-site/${label}/ping`;
    const interest = {
        name: name,
        freshness: 3000,
        content: new Interest(name),
    };

    const start = performance.now();
    dest.nfw.expressInterest(interest, (data) => {
      console.log('Received ping reply in', Math.round(performance.now() - start), 'ms');
    });
    this.pendingClickEvent = undefined;
  }

  selExpressInterest(name: string) {
    name = name.replace('$time', (new Date).getTime().toString());
    this.gs.getSelectedNode()?.nfw.expressInterest({ name, content: new Interest(name) }, (data) => {
      console.log('Received data reply');
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
