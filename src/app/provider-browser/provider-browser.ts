import { Interest, Name } from "@ndn/packet";
import { ForwardingProvider } from "../forwarding-provider";
import { IEdge, INode } from "../interfaces";
import { NFW } from "./nfw/nfw";
import { Topology } from "../topo/topo";
import { COLOR_MAP } from "../topo/color.map";
import { RoutingHelper } from "./routing-helper";
import { downloadFile, loadFileBin } from "../helper";
import { encode as msgpackEncode, decode as msgpackDecode } from "msgpack-lite"
import { inflate as pakoInflate } from "pako";
import { ModuleKind, ScriptTarget, transpile } from "typescript";
import { modules as UserModules } from "../user-types";
import { consume } from "@ndn/endpoint";

const OFFICIAL_DUMP_PREFIX = 'https://raw.githubusercontent.com/pulsejet/ndn-play/';
const TESTBED_JSON = 'https://testbed-status.named-data.net/testbed-nodes.json';

// get a reference to the async function constructor without getting transpiled
const AsyncFunction: Function = Function('return async function(){}.constructor')();

export class ProviderBrowser implements ForwardingProvider {
  public readonly LOG_INTERESTS = false;
  public readonly BROWSER = 1;

  // Parent topology
  public topo!: Topology;

  // Animation updates
  public readonly pendingUpdatesNodes: { [id: string]: Partial<INode> } = {};
  public readonly pendingUpdatesEdges: { [id: string]: Partial<IEdge> } = {};

  // Global defaults
  public defaultLatency = 10;
  public defaultLoss = 0;
  public contentStoreSize = 500;
  public latencySlowdown = 10;

  // Event of route refresh
  private scheduledRouteRefresh: number = 0;

  constructor() {}

  public initialize = async () => {
    // Initialize new nodes
    this.topo.nodes.on('add', this.ensureInitialized.bind(this));

    // Register global functions
    window.$run = this.$run;

    // Get URL parameters
    const url = new URL(window.location.href);

    // topology
    const dumpUrl = url.searchParams.get('dump');
    if (dumpUrl) {
      // load dump from url
      await this.loadDumpUrl(dumpUrl);
    } else if (url.searchParams.get('testbed')) {
      // testbed topology
      await this.loadTestbedTopology();
    } else {
      // default topology (fallback)
      await this.loadDefaultTopology();
    }

    // execute script from URL
    const script = url.searchParams.get('script');
    if (script) {
      const script_node = url.searchParams.get('script_node');
      this.loadScriptUrl(script, script_node); // non-blocking
    }
  }

  private async loadDumpUrl(url: string) {
    if (url.startsWith(OFFICIAL_DUMP_PREFIX) || confirm(`Do you want to load the experiment at "${url}"?`)) {
      try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer()
        this.loadExperimentDumpFromBin(buf)
      } catch (e) {
        console.error(e);
        alert('Failed to load remote experiment, see console for errors')
      }
    }
  }

  private async loadTestbedTopology() {
    try {
      const res = await fetch(TESTBED_JSON);
      const json: Record<string, {
        "ws-tls": boolean;
        "fch-enabled": boolean;
        "ndn-up": boolean;
        neighbors: string[];
        name: string;
        ip_addresses: string[];
        backbone: boolean;
        site: string;
        prefix: string;
        https: string;
        position: [number, number];
        shortname: string;
      }> = await res.json();

      const nodes: Partial<INode & { prefix: string }>[] = [];
      const edges: Partial<IEdge>[] = [];

      // Prevent duplicate edges
      const seenEdges= new Set<string>();

      // Process testbed-node.json
      for (const nid in json) {
        const node = json[nid];

        // DIV to show on hover
        const tooltip = document.createElement('DIV');
        tooltip.innerHTML = `
          <b>${node.name}</b><br>
          ${node.https}<br>
          ${node.prefix}
        `;

        // Create node
        nodes.push({
          id: nid, label: nid,
          x: node.position[1] * 2,
          y: -node.position[0] * 8,
          color: node['ndn-up'] ? undefined : COLOR_MAP.NODE_RED,
          title: tooltip,
          prefix: node.prefix,
        });

        // Add all edges from this node
        for (const neighbor of json[nid].neighbors) {
          if (seenEdges.has(`${nid}-${neighbor}`) || seenEdges.has(`${neighbor}-${nid}`)) continue;
          seenEdges.add(`${nid}-${neighbor}`);
          edges.push({ from: nid, to: neighbor });
        }
      }

      // Add to topology
      this.topo.network.setOptions({
        interaction: {
          tooltipDelay: 0,
        },
        physics: {
          barnesHut: {
            gravitationalConstant: -14,
            springConstant: 0,
            centralGravity: 0,
            damping: 0.2,
          },
        },
        edges: { smooth: false },
      });
      this.topo.nodes.add(<INode[]>nodes);
      this.topo.edges.add(<IEdge[]>edges);
      this.topo.network.fit();
    } catch (e) {
      console.error(e);
      alert('Failed to load testbed topology, see console for errors')
    }
  }

  private async loadDefaultTopology() {
    // add dummy nodes
    this.topo.nodes.add(<INode[]>[
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
    this.topo.edges.add(<IEdge[]>[
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

  private async loadScriptUrl(url: string, node: string | null) {
    if (confirm(`Do you want to execute the script at "${url}"?`)) {
      try {
        const res = await fetch(url);
        const code = await res.text();

        // get a node to run the script on
        const node_ = this.topo.getNode(node ?? '') ?? this.topo.nodes.get()[0];

        // execute the script
        await this.runCode(code, node_);
      } catch (e) {
        console.error(e);
        alert('Failed to execute remote script, see console for errors')
      }
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
    node?.nfw?.nodeUpdated();
  }

  public onNetworkClick = async () => {}

  public sendPingInterest(from: INode, to: INode) {
    const label = to.label;
    const name = `/ndn/${label}/ping/${new Date().getTime()}`;
    const interest = new Interest(name, Interest.Lifetime(3000))

    const start = performance.now();
    const { fw } = from.nfw!;
    consume(interest, { fw }).then(() => {
      console.log('Received ping reply in', Math.round(performance.now() - start), 'ms');
    }).catch(console.error);

    this.topo.pendingClickEvent = undefined;
  };

  public sendInterest(name: string, node: INode) {
    name = name.replace('$time', (new Date).getTime().toString());
    const interest = new Interest(name, Interest.Lifetime(3000))
    const { fw } = node.nfw!;
    consume(interest, { fw }).then(() => {
      console.log('Received data reply');
    }).catch(console.error);
  }

  public async runCode(code: string, node: INode) {
    const js = transpile(code, {
      target: ScriptTarget.ES2020,
      module: ModuleKind.CommonJS,
    });

    return this.$run(async (node) => {
      // we provide a custom require function to resolve modules
      // only modules from UserModules are allowed
      return AsyncFunction('node', 'exports', 'require', js)(node, new Object, (module: string) => {
        // resolve exported modules
        if (module in UserModules) {
          const m = module as keyof typeof UserModules;
          return UserModules[m][1];
        }
        throw new Error(`Module not found: ${module}`)
      });
     }, node);
  }

  public $run: typeof window.$run = async (fun, node) => {
    const node_ = this.topo.getNode(node);
    if (!node_)
      throw new Error(`Node not found: ${node}`);

    try {
      return await fun.call(null, node_);
    } catch (e) {
      console.error(e);
    }
  }

  /** Schedule a refresh of static routes */
  public scheduleRouteRefresh = () => {
    if (this.scheduledRouteRefresh || !this.topo.network) return;

    this.scheduledRouteRefresh = window.setTimeout(() => {
      this.computeRoutes();
      this.scheduledRouteRefresh = 0;
    }, 500);
  }

  /** Compute static routes */
  private computeRoutes = () => {
    if (!this.topo || this.topo.imported == 'MININDN') return;

    console.warn('Computing routes');
    const fibs = new RoutingHelper(this.topo, this).calculateNPossibleRoutes();

    for (const [nodeId, fib] of Object.entries(fibs)) {
      this.topo.nodes.get(nodeId)?.nfw
        ?.setFib(fib.map((entry) => ({
          ...entry,
          prefix: new Name(entry.prefix),
        })));
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
      copy.init = undefined;
      return copy;
    });

    const edges = this.topo.edges.get().map((e) => {
      const copy = {... e};
      copy.init = undefined;
      return copy;
    });

    const dump = msgpackEncode({
      exporter: 'BROWSER',
      nodes: nodes,
      edges: edges,
      positions: this.topo.network?.getPositions(),
    });
    downloadFile(dump, 'BIN', 'experiment.bin', true);
  }

  public async loadExperimentDump(): Promise<void> {
    this.loadExperimentDumpFromBin(await loadFileBin());
  }

  public loadExperimentDumpFromBin(val: ArrayBuffer) {
    try {
      console.log('Decompressing binary dump');
      const inflated = pakoInflate(new Uint8Array(val));
      console.log('Decompressing experiment');
      const dump = msgpackDecode(inflated);
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

      this.topo.network.fit();
    } catch (err) {
      console.error('Failed to parse dump file', err);
    }
  }
}