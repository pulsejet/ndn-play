import { ForwardingProvider } from "./forwarding-provider";
import { ICapturedPacket, IEdge, INode } from "./interfaces";
import { Topology } from "./topo/topo";
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { downloadString } from "./helper";

const WS_FUNCTIONS = {
  GET_TOPO: 'get_topo',
  DEL_LINK: 'del_link',
  ADD_LINK: 'add_link',
  UPD_LINK: 'upd_link',
  DEL_NODE: 'del_node',
  ADD_NODE: 'add_node',
  GET_FIB: 'get_fib',
  GET_PCAP: 'get_pcap',
  GET_PCAP_WIRE: 'get_pcap_wire',
}

export class ProviderMiniNDN implements ForwardingProvider {
  public readonly LOG_INTERESTS = false;
  public readonly MININDN = 1;

  // Parent topology
  public topo!: Topology;
  public initialized = false;

  // Animation updates
  public pendingUpdatesNodes: { [id: string]: Partial<INode> } = {};
  public pendingUpdatesEdges: { [id: string]: Partial<IEdge> } = {};

  // Global defaults
  public defaultLatency = 10;
  public defaultLoss = 0;

  // Websocket connection
  public ws!: WebSocketSubject<any>;

  // Dump of data
  public dump?: {
    exporter: 'MININDN',
    nodes: INode[]; edges: IEdge[];
    positions?: any;
  }

  constructor(private wsUrl: string) {}

  public initialize = async () => {
    // Initialize new nodes
    this.topo.nodes.on('add', this.ensureInitialized.bind(this));

    // Start connection
    this.ws = webSocket(this.wsUrl);

    this.ws.subscribe(
      this.wsMessageCallback,
      err => console.log(err),
      () => console.error('WebSocket Closed. Refresh this page'),
    );
  }

  private wsFun = (fun: string, ...args: any[]) => {
    this.ws.next({ fun, args });
  }

  private wsMessageCallback = async (msg: any) => {
    console.log(msg);

    // Refresh topology
    switch (msg?.fun) {
      case WS_FUNCTIONS.GET_TOPO:
        this.topo.nodes.clear();
        this.topo.edges.clear();
        this.topo.nodes.add(msg?.res?.nodes);
        this.topo.edges.add(msg?.res?.links);
        this.topo.network.stabilize();
        setTimeout(() => this.topo.network.fit(), 200);

        if (!this.initialized) this.setTopoManipulationCallbacks();
        this.initialized = true;
        break;

      case WS_FUNCTIONS.ADD_LINK:
        this.topo.edges.updateOnly(msg?.res);
        break;

      case WS_FUNCTIONS.ADD_NODE:
        this.topo.nodes.updateOnly(msg?.res);
        break;

      case WS_FUNCTIONS.GET_FIB:
        this.topo.nodes.get(<string>msg?.res.id)!.extra.fibStr = msg?.res.fib;
        break;

      case WS_FUNCTIONS.GET_PCAP:
        this.topo.nodes.get(<string>msg?.res.id)!.extra.capturedPackets =
          msg?.res.packets.map((p: any) => {
            return {
              node: msg?.res.id,
              fn: Number(p[0]),
              t: Number(p[1]),
              l: Number(p[2]),
              type: p[3],
              name: p[4],
              from: p[5],
              to: p[6],
              p: p[7] || undefined,
            } as ICapturedPacket });

        // Creating dump
        if (this.dump) {
          this.dump.nodes.push(this.topo.nodes.get(<string>msg?.res.id)!);
          this.dump.positions = this.topo.network.getPositions();

          // Did we get everything?
          if (this.dump.nodes.length == this.topo.nodes.length) {
            downloadString(JSON.stringify(this.dump), 'JSON', 'experiment.json');
            this.dump = undefined;
          }
        }

        break;

      case WS_FUNCTIONS.GET_PCAP_WIRE:
        (<any>window).visualize(msg?.res);
        break;
    }
  }

  public initializePostNetwork = async () => {
    this.wsFun(WS_FUNCTIONS.GET_TOPO);
  }

  private getEdgeEnds(edge: IEdge) {
    return {
      from: this.topo.nodes.get(<string>edge.from)!.label,
      to: this.topo.nodes.get(<string>edge.to)!.label,
    };
  }

  private setTopoManipulationCallbacks() {
    // Call on removing link
    this.topo.edges.on('remove', (_, removedEdges) => {
      for (const edge of removedEdges?.oldData || []) {
        const e = this.getEdgeEnds(edge);
        this.wsFun(WS_FUNCTIONS.DEL_LINK, e.from, e.to, (<any>edge).mnId);
      }
    });

    // Call on adding link
    this.topo.edges.on('add', (_, edges) => {
      for (const edgeId of edges?.items || []) {
        const edge = this.topo.edges.get(edgeId);
        if (!edge) continue;
        const e = this.getEdgeEnds(edge);

        this.wsFun(WS_FUNCTIONS.ADD_LINK, e.from, e.to, edge.id, {
          latency: this.defaultLatency,
          loss: this.defaultLoss,
        });
      }
    });

    // Call on removing node
    this.topo.nodes.on('remove', (_, removedNodes) => {
      for (const node of removedNodes?.oldData || []) {
        this.wsFun(WS_FUNCTIONS.DEL_NODE, node.label);
      }
    });

    // Call on adding node
    this.topo.nodes.on('add', (_, nodes) => {
      for (const nodeId of nodes?.items || []) {
        const label = window.prompt('Enter name for new node');
        this.wsFun(WS_FUNCTIONS.ADD_NODE, nodeId, label);
      }
    });
  }

  public edgeUpdated = async (edge?: IEdge) => {
    if (!edge) return;

    const e = this.getEdgeEnds(edge);
    this.wsFun(WS_FUNCTIONS.UPD_LINK, e.from, e.to, (<any>edge).mnId, {
      latency: edge?.latency,
      loss: edge?.loss,
    });
  }

  public nodeUpdated = async (node?: INode) => {

  }

  public onNetworkClick = async () => {
    if (this.topo.selectedNode) {
      this.wsFun(WS_FUNCTIONS.GET_FIB, this.topo.selectedNode?.label);
    }
  }

  public sendPingInterest(from: INode, to: INode) {

  };

  public sendInterest(name: string, node: INode) {

  }

  public runCode(code: string, node: INode) {

  }

  public fetchCapturedPackets(node: INode) {
    this.wsFun(WS_FUNCTIONS.GET_PCAP, node.label);
  }

  public visualizeCaptured(packet: any) {
    this.wsFun(WS_FUNCTIONS.GET_PCAP_WIRE, packet.node, packet.fn);
  }

  /** Download a dump of experiment */
  public downloadExperimentDump(): void {
    this.dump = {
      exporter: 'MININDN',
      nodes: [],
      edges: this.topo.edges.get(),
    };
    this.topo.nodes.forEach((node) => {
      this.wsFun(WS_FUNCTIONS.GET_PCAP, node.label, true);
    });
  }

  /** Ensure all nodes and edges are initialized */
  private ensureInitialized = () => {
  }
}