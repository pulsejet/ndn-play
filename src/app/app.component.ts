import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GlobalService } from './global.service';
import { IEdge, INode } from './interfaces';
import { RoutingHelper } from './routing-helper';
import { loadMiniNDNConfig } from './minindn-config';
import { ndn as ndnUserTypes } from './user-types';

@Component({
  selector: 'app-root',
  templateUrl: 'app.html',
  styleUrls: ['app.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'ndn-play';

  public pendingClickEvent?: (params: any) => void;

  @ViewChild('networkContainer') networkContainer?: ElementRef;

  public loadMiniNDNConfig = loadMiniNDNConfig;

  public showCodeEditor = false;

  constructor(public gs: GlobalService)
  {}

  ngOnInit() {
    (<any>window).ndn = ndnUserTypes;
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
      this.gs.selectedNode = this.gs.nodes.get()[0];
      this.showCodeEditor = true;
    }, 500);
  }

  onNetworkClick(params: any) {
    if (this.pendingClickEvent) {
      this.pendingClickEvent?.(params);
      return;
    }

    const id = this.gs.network?.getNodeAt(params.pointer.DOM);
    this.gs.selectedNode = id ? <INode>this.gs.nodes.get(id) : undefined;

    if (!this.gs.selectedNode) {
        const edgeId = this.gs.network?.getEdgeAt(params.pointer.DOM);
        this.gs.selectedEdge = edgeId ? <IEdge>this.gs.edges.get(edgeId) : undefined;
    } else {
        this.gs.selectedEdge = undefined;
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
    const label = this.gs.selectedNode?.label;
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
    this.gs.selectedNode?.nfw.expressInterest({ name, content: 'blob' }, (data) => {
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

      if (this.label === 'cathy') {
        const endpoint = await this.nfw.getEndpoint();
        const producer = endpoint.produce('/ndn/cathy-site/cathy/test', async (interest) => {
          const data = new Data(interest.name, Data.FreshnessPeriod(500));
          data.content = toUtf8("Hello from NDNts");
          return data;
        });
      } else {
        const endpoint = await this.nfw.getEndpoint();
        const interest = new Interest('/ndn/cathy-site/cathy/test');
        const data = await endpoint.consume(interest);
        alert(fromUtf8(data.content));
      }
    `;

    code = "try { (async () => {" + code + "})() } catch (e) { console.error(e); }";
    const fun = new Function(code);
    fun.call(this.gs.selectedNode);
  }
}
