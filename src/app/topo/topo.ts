import { IEdge, INode } from "../interfaces";
import { RoutingHelper } from "../routing-helper";
import { Name } from "@ndn/packet";
import { NFW } from "../nfw";
import { SecurityController } from "../security-controller";
import * as vis from 'vis-network/standalone';

export class Topology {
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
  public network!: vis.Network;

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

  // Capture packets on all nodes
  public captureAll = false;

  // Next click event
  public pendingClickEvent?: (params: any) => void;

  // Event of route refresh
  private scheduledRouteRefresh: number = 0;

  // Security
  public security: SecurityController;

  constructor() {
    // create an array with nodes
    this.nodes = new vis.DataSet<INode, "id">(<any>[
      { id: "1", label: "A" },
      { id: "2", label: "M" },
      { id: "3", label: "E" },
      { id: "4", label: "B" },
      { id: "5", label: "C" },

      { id: "d1", label: "D" },
      { id: "d2", label: "D" },
      { id: "d3", label: "D" },
      { id: "d4", label: "D" },
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

    // Initialize always
    this.nodes.on('add', this.ensureInitialized.bind(this));
    this.edges.on('add', this.ensureInitialized.bind(this));

    // Initialize security
    this.security = new SecurityController(this);
  }

  /** Initialize the network */
  public createNetwork(container: HTMLElement) {
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

    // Routing
    const computeFun = this.scheduleRouteRefresh.bind(this);
    this.nodes.on('add', computeFun);
    this.nodes.on('remove', computeFun);
    this.edges.on('add', computeFun);
    this.edges.on('remove', computeFun);

    // Bind functions
    this.network?.on("click", this.onNetworkClick.bind(this));
  }

  /** Update objects every animation frame */
  public runAnimationFrame() {
    if (Object.keys(this.pendingUpdatesNodes).length > 0) {
        this.nodes.update(Object.values(this.pendingUpdatesNodes));
        this.pendingUpdatesNodes = {};
    }

    if (Object.keys(this.pendingUpdatesEdges).length > 0) {
        this.edges.update(Object.values(this.pendingUpdatesEdges));
        this.pendingUpdatesEdges = {};
    }
  }

  /** Handler */
  private onNetworkClick(params: any) {
    if (this.pendingClickEvent) {
      this.pendingClickEvent(params);
      return;
    }

    const id = this.network?.getNodeAt(params.pointer.DOM);
    this.selectedNode = id ? <INode>this.nodes.get(id) : undefined;

    if (!this.selectedNode) {
        const edgeId = this.network?.getEdgeAt(params.pointer.DOM);
        this.selectedEdge = edgeId ? <IEdge>this.edges.get(edgeId) : undefined;
    } else {
        this.selectedEdge = undefined;
    }

    for (const node of this.nodes.get()) {
      node.nfw.updateColors();
    }
  }

  /** Compute static routes */
  private computeRoutes() {
    console.warn('Computing routes');
    const rh = new RoutingHelper(this);
    const fibs = rh.calculateNPossibleRoutes();
    for (const nodeId in fibs) {
        const node = this.nodes.get(nodeId);
        if (!node) continue;

        node.nfw.fib = fibs[nodeId].map((e: any) => {
          return {
            ...e,
            prefix: new Name(e.prefix),
          };
        });
    }
  }

  /** Schedule a refresh of static routes */
  public scheduleRouteRefresh() {
    if (this.scheduledRouteRefresh) return;

    this.scheduledRouteRefresh = window.setTimeout(() => {
      this.computeRoutes();
      this.scheduledRouteRefresh = 0;
    }, 500);
  }

  /** Ensure all nodes and edges are initialized */
  private ensureInitialized() {
    // Initilize edges
    for (const edge of this.edges.get()) {
      if (!edge.init) {
        this.edges.update({
          init: true,
          id: edge.id,
          color: this.DEFAULT_LINK_COLOR,
          latency: edge.latency || -1,
          loss: edge.loss || -1,
          extra: {
              pendingTraffic: 0,
          },
        });
      }
    }

    // Initialize nodes
    for (const node of this.nodes.get()) {
      if (!node.init) {
        this.nodes.update({
          init: true,
          id: node.id,
          color: this.DEFAULT_NODE_COLOR,
          producedPrefixes: ['/ndn/multicast/test'],
          nfw: new NFW(this, node),
          extra: {
            codeEdit: '',
          },
        });
      }
    }
  }
}