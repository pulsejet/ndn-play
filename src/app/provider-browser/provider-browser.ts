import { Interest, Name } from "@ndn/packet";
import { ForwardingProvider } from "../forwarding-provider";
import { IEdge, INode } from "../interfaces";
import { NFW } from "./nfw";
import { SecurityController } from "./security-controller";
import { Topology } from "../topo/topo";
import { RoutingHelper } from "./routing-helper";
import { downloadString, loadFileString } from "../helper";

export class ProviderBrowser implements ForwardingProvider {
  public readonly LOG_INTERESTS = false;
  public readonly BROWSER = 1;

  // Parent topology
  public topo!: Topology;

  // Animation updates
  public pendingUpdatesNodes: { [id: string]: Partial<INode> } = {};
  public pendingUpdatesEdges: { [id: string]: Partial<IEdge> } = {};

  // Global defaults
  public defaultLatency = 10;
  public defaultLoss = 0;
  public contentStoreSize = 500;
  public latencySlowdown = 10;

  // Event of route refresh
  private scheduledRouteRefresh: number = 0;

  // Security
  public security!: SecurityController;

  constructor() {}

  public initialize = async () => {
    // Initialize new nodes
    this.topo.nodes.on('add', this.ensureInitialized.bind(this));

    // load dump from url
    const url = new URL(window.location.href);
    const dump = url.searchParams.get('dump');
    if (dump) {
      setTimeout(() => {
        if (confirm(`Do you want to load the experiment at ${dump}`)) {
          fetch(dump).then(e => {
            e.text().then(this.loadExperimentDumpFromStr.bind(this)).catch(console.error);
          }).catch(e => {
            console.error(e);
            alert('Failed to load remote experiment')
          });
        }
      }, 1000);
    } else {
      // add dummy nodes
      this.topo.nodes.add(<any>[
        { id: "A", label: "A" },
        { id: "M", label: "M" },
        { id: "E", label: "E" },
        { id: "B", label: "B" },
        { id: "C", label: "C" },

        { id: "d1", label: "D" },
        { id: "d2", label: "D" },
        { id: "d3", label: "D" },
        { id: "d4", label: "D" },
      ]);

      // add dummy edges
      this.topo.edges.add(<any>[
        { from: "A", to: "E" },
        { from: "A", to: "M" },
        { from: "M", to: "B" },
        { from: "M", to: "C" },

        { from: "E", to: "d3" },
        { from: "d3", to: "d2" },
        { from: "d3", to: "d1" },
        { from: "d1", to: "d4" },
        { from: "d4", to: "A" },
      ]);
    }
  }

  public initializePostNetwork = async () => {
    // Routing
    const computeFun = this.scheduleRouteRefresh.bind(this);
    this.topo.nodes.on('add', computeFun);
    this.topo.nodes.on('remove', computeFun);
    this.topo.edges.on('add', computeFun);
    this.topo.edges.on('remove', computeFun);
  }

  public edgeUpdated = async (edge?: IEdge) => {
    this.scheduleRouteRefresh();
  }

  public nodeUpdated = async (node?: INode) => {
    this.security.computeSecurity();

    if (node) {
      node.nfw!.nodeUpdated();
    }
  }

  public onNetworkClick = async () => {

  }

  public sendPingInterest(from: INode, to: INode) {
    const label = to?.label;
    const name = `/ndn/${label}/ping/${new Date().getTime()}`;
    const interest = new Interest(name, Interest.Lifetime(3000))

    const start = performance.now();
    from.nfw!.getEndpoint({ secure: true }).consume(interest).then(() => {
      console.log('Received ping reply in', Math.round(performance.now() - start), 'ms');
    }).catch(console.error);

    this.topo.pendingClickEvent = undefined;
  };

  public sendInterest(name: string, node: INode) {
    name = name.replace('$time', (new Date).getTime().toString());
    const interest = new Interest(name, Interest.Lifetime(3000))
    node.nfw!.getEndpoint({ secure: false }).consume(interest).then(() => {
      console.log('Received data reply');
    }).catch(console.error);
  }

  public runCode(code: string, node: INode) {
    code = (<any>window).ts.transpile(code, {
      target: (<any>window).ts.ScriptTarget.ES2015
    });
    code = "try { (async () => { const node = this; " + code + "})() } catch (e) { console.error(e); }";
    const fun = new Function(code);
    fun.call(node);
  }

  /** Schedule a refresh of static routes */
  public scheduleRouteRefresh = () => {
    if (this.scheduledRouteRefresh) return;

    this.scheduledRouteRefresh = window.setTimeout(() => {
      this.computeRoutes();
      this.scheduledRouteRefresh = 0;
    }, 500);
  }

  /** Compute static routes */
  private computeRoutes = () => {
    if (!this.topo || this.topo.imported == 'MININDN') return;

    console.warn('Computing routes');
    const rh = new RoutingHelper(this.topo, this);
    const fibs = rh.calculateNPossibleRoutes();
    for (const nodeId in fibs) {
      const node = this.topo.nodes.get(nodeId);
      if (!node) continue;

      node.nfw!.fib = fibs[nodeId].map((e: any) => {
        return {
          ...e,
          prefix: new Name(e.prefix),
        };
      });

      node.extra.fibStr = node.nfw!.strsFIB().join('\n');
    }
  }

  /** Ensure all nodes and edges are initialized */
  private ensureInitialized = () => {
    // Start NFW
    for (const node of this.topo.nodes.get()) {
      if (!node.nfw) {
        node.extra.producedPrefixes = ['/ndn/multicast/test'];

        this.topo.nodes.update({
          id: node.id,
          nfw: new NFW(this.topo, node.id),
        });
      }
    }
  }

  public downloadExperimentDump() {
    const nodes = this.topo.nodes.get().map((n) => {
      const copy = {... n};
      copy.nfw = undefined;
      return copy;
    });

    const dump = JSON.stringify({
      exporter: 'BROWSER',
      nodes: nodes,
      edges: this.topo.edges.get(),
      positions: this.topo.network.getPositions(),
    });
    downloadString(dump, 'JSON', 'experiment.json');
  }

  public loadExperimentDump() {
    loadFileString().then((val) => {
      this.loadExperimentDumpFromStr(val);
    }).catch(() => {
      console.error('Failed to read dump file');
    });
  }

  public loadExperimentDumpFromStr(val: string) {
    try {
      const dump = JSON.parse(val);
      this.topo.edges.clear();
      this.topo.nodes.clear();

      if (dump.positions) {
        dump.nodes.forEach((n: INode) => {
          n.x = dump.positions[n.id!].x;
          n.y = dump.positions[n.id!].y;
        });
      }

      this.topo.imported = dump.exporter;

      this.topo.nodes.add(dump.nodes);
      this.topo.edges.add(dump.edges);

      this.topo.network.stabilize();
      setTimeout(() => this.topo.network.fit(), 200);
    } catch (err) {
      console.error('Failed to parse dump file', err);
    }
  }
}