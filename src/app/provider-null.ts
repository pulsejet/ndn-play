import { ForwardingProvider } from "./forwarding-provider";
import { Topology } from "./topo/topo";

const anoop = async () => {};

export class ProviderNull implements ForwardingProvider {
    topo!: Topology;
    pendingUpdatesNodes = {};
    pendingUpdatesEdges = {};
    defaultLatency = 0;
    defaultLoss = 0;

    initialize = anoop;
    initializePostNetwork = anoop;
    edgeUpdated = anoop;
    nodeUpdated = anoop;
    onNetworkClick = anoop;

}