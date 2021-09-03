import { IEdge, INode, INodeExtra } from "../interfaces";
import { SecurityController } from "../provider-browser/security-controller";
import { ForwardingProvider } from "../forwarding-provider";
import { ProviderBrowser } from "../provider-browser/provider-browser";
import chroma from "chroma-js";
import * as vis from 'vis-network/standalone';

export class Topology {
  // Constants
  public readonly DEFAULT_LINK_COLOR = "#3583ea";
  public readonly DEFAULT_NODE_COLOR = '#a4b7fc';
  public readonly SELECTED_NODE_COLOR = '#4ee44e';
  public readonly ACTIVE_NODE_COLOR = '#ffcccb';

  // Global Dataset
  public readonly nodes: vis.DataSet<INode, "id">;
  public readonly edges: vis.DataSet<IEdge, "id">;

  // Global network
  public network!: vis.Network;

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

  constructor(public provider: ForwardingProvider) {
    // Pass back to provider
    this.provider.topo = this;

    // Initialize empty graph
    this.nodes = new vis.DataSet<INode, "id">();
    this.edges = new vis.DataSet<IEdge, "id">();

    // Initialize the graph
    this.ensureInitialized();

    // Initialize always
    this.nodes.on('add', this.ensureInitialized.bind(this));
    this.edges.on('add', this.ensureInitialized.bind(this));

    // Initialize security for browser provider
    if (this.provider instanceof ProviderBrowser) {
      this.provider.security = new SecurityController(this);
    }

    // Initialize provider
    this.provider.initialize();
  }

  /** Initialize the network */
  public createNetwork = async (container: HTMLElement) => {
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

    // Bind functions
    this.network?.on("click", this.onNetworkClick.bind(this));

    await this.provider.initializePostNetwork();
  }

  /** Update objects every animation frame */
  public runAnimationFrame() {
    if (Object.keys(this.provider.pendingUpdatesNodes).length > 0) {
        this.nodes.update(Object.values(this.provider.pendingUpdatesNodes));
        this.provider.pendingUpdatesNodes = {};
    }

    if (Object.keys(this.provider.pendingUpdatesEdges).length > 0) {
        this.edges.update(Object.values(this.provider.pendingUpdatesEdges));
        this.provider.pendingUpdatesEdges = {};
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

    this.provider.onNetworkClick();
  }

  /** Ensure all nodes and edges are initialized */
  private ensureInitialized() {
    // Initilize edges
    for (const edge of this.edges.get()) {
      if (!edge.extra) {
        this.edges.update({
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
      if (!node.extra) {
        this.nodes.update({
          id: node.id,
          color: this.DEFAULT_NODE_COLOR,
          extra: {
            producedPrefixes: [],
            pendingTraffic: 0,
            codeEdit: '',
          },
        });
      }
    }
  }

  public updateNodeColor(nodeId: vis.IdType, nodeExtra?: INodeExtra) {
    // Get object if not passed
    if (!nodeExtra) {
      nodeExtra = this.nodes.get(nodeId)!.extra;
    }

    // Check busiest node
    if (nodeExtra.pendingTraffic > (this.busiestNode?.extra.pendingTraffic || 0)) {
      this.busiestNode = <any>this.nodes.get(nodeId);
    }

    let color = this.DEFAULT_NODE_COLOR
    if (nodeExtra.pendingTraffic > 0) {
        color = chroma.scale([this.ACTIVE_NODE_COLOR, 'red'])
                            (nodeExtra.pendingTraffic / ((this.busiestNode?.extra.pendingTraffic || 0) + 5)).toString();
    } else if (this.selectedNode?.id == nodeId) {
        color = this.SELECTED_NODE_COLOR;
    }
    this.provider.pendingUpdatesNodes[nodeId] = { id: nodeId, color: color };
  }

  public updateEdgeColor(edge: IEdge) {
    // No traffic
    if (edge.extra.pendingTraffic === 0) {
      this.provider.pendingUpdatesEdges[<vis.IdType>edge.id] = { id: edge.id, color: this.DEFAULT_LINK_COLOR };
      return;
    }

    // Check busiest link
    if (edge.extra.pendingTraffic > (this.busiestLink?.extra.pendingTraffic || 0)) {
      this.busiestLink = edge;
    }
    const color = chroma.scale([this.ACTIVE_NODE_COLOR, 'red'])
                              (edge.extra.pendingTraffic / (this.busiestLink?.extra.pendingTraffic || 0) + 5).toString();
    this.provider.pendingUpdatesEdges[<vis.IdType>edge.id] = { id: edge.id, color: color };
  }
}