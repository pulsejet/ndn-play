import { Injectable } from '@angular/core';
import { IEdge, INode } from './interfaces';
import * as vis from 'vis-network/standalone';
import { NFW } from './nfw';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  // Constants
  public readonly DEFAULT_LINK_COLOR = "#3583ea";
  public readonly DEFAULT_NODE_COLOR = '#a4b7fc';
  public readonly SELECTED_NODE_COLOR = '#4ee44e';
  public readonly ACTIVE_NODE_COLOR = '#ffcccb';
  public readonly LOG_INTERESTS = false;

  // Animation updates
  public pendingUpdatesNodes: { [id: string]: Partial<INode> } = {};
  public pendingUpdatesEdges: { [id: string]: Partial<IEdge> } = {};

  // Global Dataset
  public readonly nodes: vis.DataSet<INode, "id">;
  public readonly edges: vis.DataSet<IEdge, "id">;

  // Global network
  public network: vis.Network;

  // Global defaults
  public defaultLatency = 10;
  public defaultLoss = 0;
  public contentStoreSize = 500;
  public latencySlowdown = 10;

  // Animation color busiest
  public busiestNode?: INode;
  public busiestLink?: IEdge;

  // Selected objects
  public selectedNode?: INode;
  public selectedEdge?: IEdge;

  constructor() {
    // create an array with nodes
    this.nodes = new vis.DataSet<INode, "id">(<any>[
      { id: "1", label: "alice" },
      { id: "2", label: "mallory" },
      { id: "3", label: "eve" },
      { id: "4", label: "bob" },
      { id: "5", label: "cathy" },

      { id: "d1", label: "dup" },
      { id: "d2", label: "dup" },
      { id: "d3", label: "dup" },
      { id: "d4", label: "dup" },
    ]);

    // create an array with edges
    this.edges = new vis.DataSet<IEdge, "id">(<any>[
      { from: "1", to: "3" },
      { from: "1", to: "2" },
      { from: "2", to: "4" },
      { from: "2", to: "5" },

      { from: "3", to: "d3" },
      { from: "d3", to: "d2" },
      { from: "d3", to: "d1" },
      { from: "d1", to: "d4" },
      { from: "d4", to: "1" },
    ]);

    // Initialize
    this.ensureInitialized();

    // Start animating
    requestAnimationFrame(this.runAnimationFrame.bind(this));

    // Initialize always
    this.nodes.on('add', this.ensureInitialized.bind(this));
    this.edges.on('add', this.ensureInitialized.bind(this));

    // Temporary init
    this.network = <any>null;
  }

  /** Update objects every animation frame */
  runAnimationFrame() {
    if (Object.keys(this.pendingUpdatesNodes).length > 0) {
        this.nodes.update(Object.values(this.pendingUpdatesNodes));
        this.pendingUpdatesNodes = {};
    }

    if (Object.keys(this.pendingUpdatesEdges).length > 0) {
        this.edges.update(Object.values(this.pendingUpdatesEdges));
        this.pendingUpdatesEdges = {};
    }

    requestAnimationFrame(this.runAnimationFrame.bind(this));
  }

  createNetwork(container: HTMLElement) {
    const data = {
      nodes: this.nodes,
      edges: this.edges,
    };

    const options = {
      interaction: { hover: true },
      manipulation: {
        enabled: true,
      },
      layout: {
        randomSeed: 2,
      }
    };

    this.network = new vis.Network(container, data, options);
  }

  ensureInitialized() {
    for (const edge of this.edges.get()) {
      if (!edge.init) {
        this.edges.update({
          init: true,
          id: edge.id,
          color: this.DEFAULT_LINK_COLOR,
          latency: edge.latency || -1,
          loss: edge.loss || -1,
          controller: {
              pendingTraffic: 0,
          },
        });
      }
    }

    for (const node of this.nodes.get()) {
      if (!node.init) {
        this.nodes.update({
          init: true,
          id: node.id,
          color: this.DEFAULT_NODE_COLOR,
          producedPrefixes: ['/ndn/multicast'],
          nfw: new NFW(this, node),
        });
      }
    }
  }
}
