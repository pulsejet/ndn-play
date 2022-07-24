import { IEdge, INode } from "./interfaces";
import { Topology } from "./topo/topo";

export interface ForwardingProvider {
  // Parent topology
  topo: Topology;

  // Animation updates
  pendingUpdatesNodes: { [id: string]: Partial<INode>; };
  pendingUpdatesEdges: { [id: string]: Partial<IEdge>; };

  // Global Defaults
  defaultLatency: number;
  defaultLoss: number;
  contentStoreSize?: number;
  latencySlowdown?: number;

  // Initialize the topology
  initialize: () => Promise<void>;

  // Initialize post network creation
  initializePostNetwork: () => Promise<void>;

  // Callback when edge/node is updated manually
  edgeUpdated: (edge?: IEdge) => Promise<void>;
  nodeUpdated: (node?: INode) => Promise<void>;

  // Callback when network is clicked
  onNetworkClick: () => Promise<void>;
  refreshFib?: () => Promise<void>;

  // Send test interests
  sendPingInterest: (from: INode, to: INode) => void;
  sendInterest: (name: string, node: INode) => void;

  // Packet capture
  fetchCapturedPackets?: (node: INode) => void;
  visualizeCaptured?: (packet: any) => void;

  // Dump of experiment
  downloadExperimentDump?: () => void;
  loadExperimentDump?: () => void;

  // Code execution
  runCode: (code: string, node: INode) => void;
}
