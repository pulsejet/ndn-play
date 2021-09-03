import { IEdge, INode, visTlv } from "./interfaces";
import { Topology } from "./topo/topo";

export interface ForwardingProvider {
  // Parent topology
  topo: Topology;

  // Animation updates
  pendingUpdatesNodes: { [id: string]: Partial<INode> };
  pendingUpdatesEdges: { [id: string]: Partial<IEdge> };

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

  // Send test interests
  sendPingInterest: (from: INode, to: INode) => void;
  sendInterest: (name: string, node: INode) => void;
}
