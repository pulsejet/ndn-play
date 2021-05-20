import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GlobalService } from './global.service';
import { IEdge, INode } from './interfaces';
import { RoutingHelper } from './routing-helper';

@Component({
  selector: 'app-root',
  templateUrl: 'app.html',
  styleUrls: ['app.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'ndn-play';

  public pendingClickEvent?: (params: any) => void;

  public selectedNode?: INode;
  public selectedEdge?: IEdge;

  @ViewChild('networkContainer') networkContainer?: ElementRef;

  constructor(public gs: GlobalService)
  {}

  ngOnInit() {

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
  }

  onNetworkClick(params: any) {
    if (this.pendingClickEvent) {
      this.pendingClickEvent?.(params);
      return;
    }

    const id = this.gs.network?.getNodeAt(params.pointer.DOM);
    this.selectedNode = id ? <INode>this.gs.nodes.get(id) : undefined;

    if (!this.selectedNode) {
        const edgeId = this.gs.network?.getEdgeAt(params.pointer.DOM);
        this.selectedEdge = edgeId ? <IEdge>this.gs.edges.get(edgeId) : undefined;
    } else {
        this.selectedEdge = undefined;
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
    const interest = {
        name: `/ndn/${this.selectedNode?.label}-site/${this.selectedNode?.label}/ping`,
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
    this.selectedNode?.nfw.expressInterest({ name }, (data) => {
      console.log(data.content);
    });
  }
}
