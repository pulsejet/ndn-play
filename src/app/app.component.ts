import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GlobalService } from './global.service';
import { IEdge, INode } from './interfaces';
import { ndn as ndnUserTypes } from './user-types';
import { Encodable } from '@ndn/tlv';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

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

  /** Native Elements */
  @ViewChild('networkContainer') networkContainer!: ElementRef;
  @ViewChild('console') console!: ElementRef;

  /** Global Topology */
  public topo = this.gs.topo;

  constructor(public gs: GlobalService)
  {}

  ngOnInit() {
    (<any>window).ndn = ndnUserTypes;
    (<any>window).visualize = (p: any) => this.visualizedPacket = p;

    this.topo.selectedNodeChangeCallback.subscribe((node) => {
      if (!node) {
        this.mainTab = mainTabs.Topology;
      }
    });
  }

  ngAfterViewInit() {
    // Setup
    this.topo.createNetwork(this.networkContainer?.nativeElement);
    this.topo.network?.on("click", this.onNetworkClick.bind(this));
  }

  onNetworkClick(params: any) {
    if (this.topo.pendingClickEvent) {
      this.topo.pendingClickEvent(params);
      return;
    }

    const id = this.topo.network?.getNodeAt(params.pointer.DOM);
    this.topo.selectNode(id ? <INode>this.topo.nodes.get(id) : undefined);

    if (!this.topo.getSelectedNode()) {
        const edgeId = this.topo.network?.getEdgeAt(params.pointer.DOM);
        this.topo.selectEdge(edgeId ? <IEdge>this.topo.edges.get(edgeId) : undefined);
    } else {
        this.topo.selectEdge(undefined);
    }

    for (const node of this.topo.nodes.get()) {
      node.nfw.updateColors();
    }
  }

  mlstrToArray(str: string) {
    return str.split('\n').map(v => v.trim()).filter(v => v);
  }
}
