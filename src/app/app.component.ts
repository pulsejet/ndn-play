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
      msg = msg.replace('\n', '\r\n');

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

  sendPingClick(params: any) {
    const id = this.gs.network.getNodeAt(params.pointer.DOM);
    if (!id) return;

    const dest = <INode>this.gs.nodes.get(id);
    const label = this.gs.getSelectedNode()?.label;
    const name = `/ndn/${label}-site/ping`;
    const interest = new Interest(name, Interest.Lifetime(3000))

    const start = performance.now();
    dest.nfw.getEndpoint().consume(interest).then(() => {
      console.log('Received ping reply in', Math.round(performance.now() - start), 'ms');
    });

    this.pendingClickEvent = undefined;
  }

  selExpressInterest(name: string) {
    name = name.replace('$time', (new Date).getTime().toString());
    const interest = new Interest(name, Interest.Lifetime(3000))
    this.gs.getSelectedNode()?.nfw.getEndpoint().consume(interest).then(() => {
      console.log('Received data reply');
    });
  }

  mlstrToArray(str: string) {
    return str.split('\n').map(v => v.trim()).filter(v => v);
  }

  runCode(code: string) {
    code = "try { (async () => { const node = this; " + code + "})() } catch (e) { console.error(e); }";
    const fun = new Function(code);
    fun.call(this.gs.getSelectedNode());
  }
}
