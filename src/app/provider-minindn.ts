import { ForwardingProvider } from "./forwarding-provider";
import { IEdge, INode } from "./interfaces";
import { Topology } from "./topo/topo";
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

const WS_FUNCTIONS = {
  GET_TOPO: 'get_topo',
  DEL_LINK: 'del_link',
  ADD_LINK: 'add_link',
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

  constructor() {}

  public initialize = async () => {
    // Initialize new nodes
    this.topo.nodes.on('add', this.ensureInitialized.bind(this));

    // Start connection
    this.ws = webSocket('ws://localhost:8765');

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
        this.topo.network.fit();

        if (!this.initialized) this.setTopoManipulationCallbacks();
        this.initialized = true;
        break;

      case WS_FUNCTIONS.ADD_LINK:
        this.topo.edges.updateOnly(msg?.res);
    }
  }

  public initializePostNetwork = async () => {
    this.wsFun(WS_FUNCTIONS.GET_TOPO);
  }

  private setTopoManipulationCallbacks() {
    // Call on removing link
    this.topo.edges.on('remove', (_, removedEdges) => {
      for (const edge of removedEdges?.oldData || []) {
        this.wsFun(WS_FUNCTIONS.DEL_LINK, edge.from, edge.to, (<any>edge).mnId);
      }
    });

    // Call on adding link
    this.topo.edges.on('add', (_, edges) => {
      for (const edgeId of edges?.items || []) {
        const edge = this.topo.edges.get(edgeId);
        this.wsFun(WS_FUNCTIONS.ADD_LINK, edge?.from, edge?.to, edge?.id, {
          latency: this.defaultLatency,
          loss: this.defaultLoss,
        });
      }
    });
  }

  public edgeUpdated = async (edge?: IEdge) => {

  }

  public nodeUpdated = async (node?: INode) => {

  }

  public onNetworkClick = async () => {

  }

  public sendPingInterest(from: INode, to: INode) {

  };

  public sendInterest(name: string, node: INode) {

  }

  public runCode(code: string, node: INode) {

  }

  /** Schedule a refresh of static routes */
  public scheduleRouteRefresh = () => {

  }

  /** Ensure all nodes and edges are initialized */
  private ensureInitialized = () => {
  }
}