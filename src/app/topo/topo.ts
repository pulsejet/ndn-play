import { ICapturedPacket, IEdge, INode, INodeExtra, IPty } from "../interfaces";
import { ForwardingProvider } from "../forwarding-provider";
import { DataSet, Network, IdType } from 'vis-network/standalone';
import { COLOR_MAP } from "./color.map";
import chroma from "chroma-js";

export class Topology {
  // Global Dataset
  public readonly nodes: DataSet<INode, "id">;
  public readonly edges: DataSet<IEdge, "id">;

  // Global network
  public network!: Network;

  // If imported from an experiment
  public imported?: 'MININDN' | 'BROWSER';

  // Animation color busiest
  public busiestNode?: INode | null;
  public busiestLink?: IEdge | null;

  // Selected objects
  public selectedNode?: INode;
  public selectedEdge?: IEdge;
  public selectedPacket?: ICapturedPacket;

  // Capture packets on all nodes
  public captureAll = false;

  // Next click event
  public pendingClickEvent?: (params: any) => void;

  // Captured packet filter
  public globalCaptureFilter: (packet: ICapturedPacket) => boolean = () => true;

  // Active terminals
  public readonly activePtys: IPty[] = [];

  // TLV types code
  public tlvTypesCode: string = '';

  constructor(public readonly provider: ForwardingProvider) {
    // Pass back to provider
    this.provider.topo = this;

    // Initialize empty graph
    this.nodes = new DataSet<INode, "id">();
    this.edges = new DataSet<IEdge, "id">();

    // Initialize the graph
    this.ensureInitialized();

    // Initialize always
    this.nodes.on('add', this.ensureInitialized.bind(this));
    this.edges.on('add', this.ensureInitialized.bind(this));

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
      interaction: {
        hover: true,
      },
      manipulation: {
        enabled: true,
      },
      layout: {
        randomSeed: 2,
      },
    };

    this.network = new Network(container, data, options);

    // Bind functions
    this.network?.on("click", this.onNetworkClick.bind(this));
    this.network?.on("doubleClick", () => {
      if (this.selectedNode) {
        // Open existing terminal
        for (const pty of this.activePtys) {
          if (pty.name.endsWith(`[${this.selectedNode.label}]`)) {
            pty.focus?.emit();
            return
          }
        }

        // Open new terminal
        this.provider?.openTerminal?.(this.selectedNode);
      }
    });

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

    for (const node of this.nodes.get()) {
      this.updateNodeColor(node.id, node.extra);
    }

    this.provider.onNetworkClick();
  }

  /** Ensure all nodes and edges are initialized */
  private ensureInitialized() {
    // Initilize edges
    for (const edge of this.edges.get()) {
      if (!edge.init) {
        this.edges.update({
          id: edge.id,
          init: true,
          color: this.getEdgeColor(edge),
          width: 2,
        });
      }

      if (!edge.extra) {
        this.edges.update({
          id: edge.id,
          latency: edge.latency ?? -1,
          loss: edge.loss ?? -1,
          extra: {
              pendingTraffic: 0,
          },
        });
      }
    }

    // Initialize nodes
    for (const node of this.nodes.get()) {
      let color = node.color?.toString();
      color = color ? (COLOR_MAP[color] || color) : COLOR_MAP.DEFAULT_NODE_COLOR;
      let updated = false;

      if (!node.init) {
        updated = true;
        this.nodes.update({
          id: node.id,
          init: true,
          shape: node.isSwitch ? 'box' : 'ellipse',
          color: color,
          font: {
            size: 15,
            color: COLOR_MAP.NODE_FONT,
          },
        });
      }

      if (!node.extra) {
        updated = true;
        this.nodes.update({
          id: node.id,
          extra: {
            producedPrefixes: [],
            pendingTraffic: 0,
            codeEdit: '',
            capturedPackets: [],
            color: color,
          }
        });
      }

      if (updated) {
        this.updateNodeColor(node.id);
      }
    }
  }

  public updateNodeColor(nodeId: IdType, nodeExtra?: INodeExtra) {
    // Get object if not passed
    if (!nodeExtra) {
      nodeExtra = this.nodes.get(nodeId)!.extra;
    }

    // Check busiest node
    if (nodeExtra.pendingTraffic > (this.busiestNode?.extra.pendingTraffic || 0)) {
      this.busiestNode = this.nodes.get(nodeId);
    }

    let color = nodeExtra.color || COLOR_MAP.DEFAULT_NODE_COLOR
    if (nodeExtra.pendingTraffic > 0) {
        color = chroma.scale([COLOR_MAP.ACTIVE_NODE_COLOR, 'red'])
                            (nodeExtra.pendingTraffic / ((this.busiestNode?.extra.pendingTraffic || 0) + 5)).toString();
    } else if (this.selectedNode?.id == nodeId) {
        color = COLOR_MAP.SELECTED_NODE_COLOR;
    }
    this.provider.pendingUpdatesNodes[nodeId] = { id: nodeId, color: color };
  }

  public updateEdgeColor(edge: IEdge) {
    this.provider.pendingUpdatesEdges[edge.id!] = {
      id: edge.id,
      color: this.getEdgeColor(edge),
    };
  }

  private getEdgeColor(edge: IEdge) {
    // Link is broken
    if (edge.loss >= 100) return COLOR_MAP.BROKEN_LINK_COLOR;

    // No traffic
    if ((edge.extra?.pendingTraffic ?? 0) === 0) return COLOR_MAP.DEFAULT_LINK_COLOR;

    // Check busiest link
    if (edge.extra.pendingTraffic > (this.busiestLink?.extra.pendingTraffic || 0)) {
      this.busiestLink = edge;
    }

    // Linear scale
    return chroma.scale([COLOR_MAP.ACTIVE_NODE_COLOR, 'red'])
                        (edge.extra.pendingTraffic / (this.busiestLink?.extra.pendingTraffic || 0) + 5).toString();
  }

  /** Get a node by ID or label */
  getNode(id: string | INode): INode | null {
    if (typeof id !== 'string') return id;

    // try to find the node by ID or label
    return this.nodes.get(id)
        ?? (this.nodes.get().find((n) => n.label === id) || null);
  }
}