import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GlobalService } from './global.service';
import { IEdge, INode } from './interfaces';
import { RoutingHelper } from './routing-helper';
import { loadMiniNDNConfig } from './minindn-config';

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

  constructor(public gs: GlobalService)
  {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.gs.createNetwork(this.networkContainer?.nativeElement);
    this.gs.network?.on("click", this.onNetworkClick.bind(this));

    const computeFun = this.computeNFibs.bind(this);
    this.gs.nodes.on('add', computeFun);
    this.gs.nodes.on('remove', computeFun);
    this.gs.edges.on('add', computeFun);
    this.gs.edges.on('remove', computeFun);
    computeFun();
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
    };

    const start = performance.now();
    dest.nfw.expressInterest(interest, (data) => {
        console.log("Received = " + data.content, 'in', Math.round(performance.now() - start), 'ms');
    });
    this.pendingClickEvent = undefined;
  }

  selExpressInterest(name: string) {
    name = name.replace('$time', (new Date).getTime().toString());
    this.gs.selectedNode?.nfw.expressInterest({ name }, (data) => {
      console.log(data.content);
    });
  }
}
