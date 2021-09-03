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
  initialize: () => void;

  // Initialize post network creation
  initializePostNetwork: () => void;

  // Callback when edge/node is updated manually
  edgeUpdated: (edge?: IEdge) => void;
  nodeUpdated: (node?: INode) => void;

  // Callback when network is clicked
  onNetworkClick: () => void;
}
