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
import { ScriptTarget, transpile } from "typescript";

const OFFICIAL_DUMP_PREFIX = 'https://raw.githubusercontent.com/pulsejet/ndn-play/';
const TESTBED_JSON = 'https://wundngw.wustl.edu/ndnstatus/testbed-nodes.json';

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

  constructor() {}

  public initialize = async () => {
    // Initialize new nodes
    this.topo.nodes.on('add', this.ensureInitialized.bind(this));

    // load dump from url
    const url = new URL(window.location.href);
    const dumpUrl = url.searchParams.get('dump');
    if (dumpUrl) {
      return await this.loadDumpUrl(dumpUrl);
    }

    // load testbed topology
    if (url.searchParams.get('testbed')) {
      return await this.loadTestbedTopology();
    }

    // load default topology (fallback)
    await this.loadDefaultTopology();
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
      const json = await res.json();

      // No typing because these are incomplete as of now
      const nodes: any[] = [];
      const edges: any[] = [];

      // Prevent duplicate edges
      const seenEdges: { [key: string]: boolean } = {};

      // Process testbed-node.json
      for (const nid of Object.keys(json)) {
        const node = json[nid];

        nodes.push({
          id: nid, label: nid,
          x: node.position[1] * 2,
          y: -node.position[0] * 8,
          color: node['ndn-up'] ? undefined : COLOR_MAP['orange'],
        });

        for (const neighbor of json[nid].neighbors) {
          if (seenEdges[`${nid}-${neighbor}`] || seenEdges[`${neighbor}-${nid}`]) continue;
          seenEdges[`${nid}-${neighbor}`] = true;
          edges.push({ from: nid, to: neighbor });
        }
      }

      // Add to topology
      this.topo.network.setOptions({
        physics: { enabled: false },
        edges: { smooth: false },
      });
      this.topo.nodes.add(nodes);
      this.topo.edges.add(edges);
      this.topo.network.fit();
    } catch (e) {
      console.error(e);
      alert('Failed to load testbed topology, see console for errors')
    }
  }

  private async loadDefaultTopology() {
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
    from.nfw!.getEndpoint().consume(interest).then(() => {
      console.log('Received ping reply in', Math.round(performance.now() - start), 'ms');
    }).catch(console.error);

    this.topo.pendingClickEvent = undefined;
  };

  public sendInterest(name: string, node: INode) {
    name = name.replace('$time', (new Date).getTime().toString());
    const interest = new Interest(name, Interest.Lifetime(3000))
    node.nfw!.getEndpoint().consume(interest).then(() => {
      console.log('Received data reply');
    }).catch(console.error);
  }

  public async runCode(code: string, node: INode) {
    const target = ScriptTarget.ES2015;
    code = `const node = this; return (async () => {
      ${code}
    })()`;
    code = transpile(code, { target });

    try {
      await new Function(code).call(node);
    } catch (e) {
      console.error(e);
    }
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

    const dump = msgpackEncode({
      exporter: 'BROWSER',
      nodes: nodes,
      edges: this.topo.edges.get(),
      positions: this.topo.network.getPositions(),
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