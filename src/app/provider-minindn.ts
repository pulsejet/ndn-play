import { ForwardingProvider } from "./forwarding-provider";
import { ICapturedPacket, IEdge, INode } from "./interfaces";
import { Topology } from "./topo/topo";
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { downloadFile } from "./helper";
import { EventEmitter } from "@angular/core";
import { encode as msgpackEncode, decode as msgpackDecode } from "msgpack-lite"

const WS_FUNCTIONS = {
  GET_TOPO: 'get_topo',
  OPEN_ALL_PTYS: 'open_all_ptys',
  DEL_LINK: 'del_link',
  ADD_LINK: 'add_link',
  UPD_LINK: 'upd_link',
  DEL_NODE: 'del_node',
  ADD_NODE: 'add_node',
  GET_FIB: 'get_fib',
  GET_PCAP: 'get_pcap',
  GET_PCAP_WIRE: 'get_pcap_wire',
  PTY_IN: 'pty_in',
  PTY_OUT: 'pty_out',
  PTY_RESIZE: 'pty_resize',
  OPEN_TERMINAL: 'open_term',
  CLOSE_TERMINAL: 'close_term',
};

const MSG_KEY_FUN = 'F'
const MSG_KEY_ID = 'I'
const MSG_KEY_RESULT = 'R'
const MSG_KEY_ARGS = 'A'

export class ProviderMiniNDN implements ForwardingProvider {
  public readonly LOG_INTERESTS = false;
  public readonly MININDN = 1;

  // Parent topology
  public topo!: Topology;
  public initialized = false;

  // Animation updates
  public pendingUpdatesNodes: { [id: string]: Partial<INode>; } = {};
  public pendingUpdatesEdges: { [id: string]: Partial<IEdge>; } = {};

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
  };

  constructor(private wsUrl: string) { }

  /** Initializer called by topo object */
  public initialize = async () => {
    // Initialize new nodes
    this.topo.nodes.on('add', this.ensureInitialized.bind(this));
  };

  /** Initializer called after topo network initialization */
  public initializePostNetwork = async () => {
    this.connect();
  };

  /** Connect to websocket */
  public connect = async () => {
    // Start connection
    this.ws = webSocket({
      url: this.wsUrl,
      binaryType: "arraybuffer",
      serializer: msgpackEncode,
      deserializer: (e) => {
        try {
          return msgpackDecode(new Uint8Array(e.data));
        } catch {
          console.error('Failed to decode msgpack. You may need to refresh the page.');
        }
        return {};
      },
      openObserver: {
        next: () => {
          console.warn('Connected to MiniNDN');
          this.wsFun(WS_FUNCTIONS.GET_TOPO);
          this.wsFun(WS_FUNCTIONS.OPEN_ALL_PTYS);
        }
      },
      closeObserver: {
        next: () => alert('WebSocket Closed. Refresh this page')
      }
    });

    // Listen for messages
    this.ws.subscribe({
      next: this.wsMessageCallback,
      error: console.error,
    });
  };

  private wsFun = (fun: string, ...args: any[]) => {
    const pack = {} as any;
    pack[MSG_KEY_FUN] = fun;
    pack[MSG_KEY_ARGS] = args;
    this.ws.next(pack);
  };

  private wsMessageCallback = async (msg: any) => {
    // console.log(msg);

    // Refresh topology
    switch (msg[MSG_KEY_FUN]) {
      case WS_FUNCTIONS.GET_TOPO:
        this.topo.nodes.clear();
        this.topo.edges.clear();
        this.topo.nodes.add(msg?.[MSG_KEY_RESULT]?.nodes);
        this.topo.edges.add(msg?.[MSG_KEY_RESULT]?.links);
        this.topo.network.stabilize();
        setTimeout(() => this.topo.network.fit(), 200);

        if (!this.initialized) this.setTopoManipulationCallbacks();
        this.initialized = true;
        console.warn(`Refreshed current topology`);
        break;

      case WS_FUNCTIONS.ADD_LINK:
        this.topo.edges.updateOnly(msg?.[MSG_KEY_RESULT]);
        break;

      case WS_FUNCTIONS.ADD_NODE:
        this.topo.nodes.updateOnly(msg?.[MSG_KEY_RESULT]);
        break;

      case WS_FUNCTIONS.GET_FIB:
        this.topo.nodes.get(<string>msg?.[MSG_KEY_RESULT].id)!.extra.fibStr = msg?.[MSG_KEY_RESULT].fib;
        break;

      case WS_FUNCTIONS.GET_PCAP:
        const newPacks = msg?.[MSG_KEY_RESULT].packets;
        const node = this.topo.nodes.get(<string>msg?.[MSG_KEY_RESULT].id)!;

        // Add new packets to node
        if (newPacks.length > 0) {
          // Captured packets list
          const cp = node.extra.capturedPackets;
          const lastKnownFrame = this._lastKnownFrame(node);
          for (const p of newPacks) {
            if (p[0] <= lastKnownFrame) {
              continue;
            }

            // Add packet to list
            // See definition of ICapturedPacket in interfaces.ts
            cp.push([
              0,
              Number(p[0]),
              Number(p[1]),
              Number(p[2]),
              p[3],
              p[4],
              p[5],
              p[6],
              p[7] || undefined,
            ]);
          }
        }

        // Creating dump
        if (this.dump) {
          console.log(`Received data for ${node.label}`);
          this.dump.nodes.push(node);

          // Did we get everything?
          if (this.dump.nodes.length == this.topo.nodes.length) {
            console.log(`Received data for all nodes -- generating dump`);
            this.dump.positions = this.topo.network.getPositions();
            downloadFile(msgpackEncode(this.dump), 'BIN', 'experiment.bin');
            this.dump = undefined;
          }
        }
        break;

      case WS_FUNCTIONS.GET_PCAP_WIRE:
        (<any>window).visualize(msg?.[MSG_KEY_RESULT]);
        break;

      case WS_FUNCTIONS.OPEN_TERMINAL:
        const res = msg?.[MSG_KEY_RESULT];
        this.openTerminalInternal(res.id, res.name, res.buf);
        break;

      case WS_FUNCTIONS.CLOSE_TERMINAL:
        this.closeTerminalInternal(msg?.[MSG_KEY_ID]);
        break;

      case WS_FUNCTIONS.PTY_OUT:
        this.writeTerminal(msg?.[MSG_KEY_ID], msg?.[MSG_KEY_RESULT])
        break;
    }
  };

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
  };

  public nodeUpdated = async (node?: INode) => {

  };

  public onNetworkClick = async () => {
    this.refreshFib();
  };

  public refreshFib = async () => {
    if (this.topo.selectedNode) {
      this.wsFun(WS_FUNCTIONS.GET_FIB, this.topo.selectedNode.label);
    }
  };

  public openTerminal(node: INode) {
    this.wsFun(WS_FUNCTIONS.OPEN_TERMINAL, node.label);
    console.log(`Requested remote shell for ${node.label}`);
  }

  private openTerminalInternal(id: string, name: string, init: Uint8Array) {
    // check if same id exists
    for (let t of this.topo.activePtys) {
      if (t.id == id) {
        return;
      }
    }

    // create new terminal
    const write = new EventEmitter<any>();
    const data = new EventEmitter<any>();
    const resized = new EventEmitter<any>();
    this.topo.activePtys.push({
      id: id,
      name: name,
      write: write,
      data: data,
      resized: resized,
      initBuf: init,
    });

    data.subscribe((msg: any) => {
      const pack = new TextEncoder().encode(msg);
      this.wsFun(WS_FUNCTIONS.PTY_IN, id, pack);
    });

    resized.subscribe((msg: any) => {
      this.wsFun(WS_FUNCTIONS.PTY_RESIZE, id, msg.rows, msg.cols);
    });

    console.log(`Connected to remote PTY ${name} [${id}]`);
  }

  private writeTerminal(id: string, buf: any) {
    const ubuf = new Uint8Array(buf);

    for (let t of this.topo.activePtys) {
      if (t.id == id) {
        if (t.initBuf !== undefined) {
          console.log('skipping write', t.initBuf)
          // not yet initialized
          // join init buffer with new data
          const merged = new Uint8Array(t.initBuf.length + ubuf.length);
          merged.set(t.initBuf);
          merged.set(ubuf, t.initBuf.length);
          t.initBuf = merged;
          return;
        }

        t.write.emit(ubuf);
        return;
      }
    }
  }

  private closeTerminalInternal(id: string) {
    // check if same id exists
    for (let t of this.topo.activePtys) {
      if (t.id == id) {
        console.warn(`Disconnected from remote PTY ${t.name} [${t.id}]`);
        this.topo.activePtys.splice(this.topo.activePtys.indexOf(t), 1);
      }
    }
  }

  private _lastKnownFrame(node: INode): number {
    const cp = node.extra.capturedPackets;
    const knownFrame = cp.length > 0 ? Number(cp[cp.length - 1]?.[1]) : 0;
    return knownFrame;
  }

  public fetchCapturedPackets(node: INode) {
    this.wsFun(WS_FUNCTIONS.GET_PCAP, node.label, this._lastKnownFrame(node));
  }

  public visualizeCaptured(packet: ICapturedPacket, node: INode) {
    (<any>window).visualize();
    this.wsFun(WS_FUNCTIONS.GET_PCAP_WIRE, node.label, packet[1]);
  }

  /** Download a dump of experiment */
  public downloadExperimentDump(): void {
    this.dump = {
      exporter: 'MININDN',
      nodes: [],
      edges: this.topo.edges.get(),
    };
    this.topo.nodes.forEach((node) => {
      if (node.isSwitch) {
        this.dump!.nodes.push(node);
      } else {
        this.wsFun(WS_FUNCTIONS.GET_PCAP, node.label, 0, true);
      }
    });
  }

  /** Ensure all nodes and edges are initialized */
  private ensureInitialized = () => {
  };
}