import { Network, IdType } from 'vis-network/standalone';
import { ForwardingProvider } from '../forwarding-provider';
import { Topology } from '../topo/topo';

declare var dijkstra: any;

class _CalculateRoutes {
    private network: Network;

    constructor(
        private topo: Topology,
        private provider: ForwardingProvider,
    ) {
        this.network = <Network>this.topo.network;
    }

    dijkstra(graph: any) {
        const routes: any = {};
        for (const node in graph) {
            routes[node] = {};
            const preds = dijkstra.single_source_shortest_paths(graph, node);
            for (const dest in preds) {
                routes[node][dest] = [dijkstra.extract_shortest_path_from_predecessor_list(preds, dest)];
            }
        }
        return routes;
    }

    dijkstraAll(graph: any) {
        const routes = this.dijkstra(graph);

        for (const node in graph) {
            const newGraph = JSON.parse(JSON.stringify(graph));
            delete newGraph[node];
            for (const n in newGraph) {
                delete newGraph[n][node];
            }

            for (const hop in graph[node]) {
                const preds = dijkstra.single_source_shortest_paths(newGraph, hop);
                for (const dest in preds) {
                    if (!routes[node][dest]) {
                        routes[node][dest] = [];
                    }
                    const path = [node];
                    path.push(...dijkstra.extract_shortest_path_from_predecessor_list(preds, dest))

                    let found = false;
                    for (const ep of routes[node][dest]) {
                        if (ep[1] == path[1]) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        routes[node][dest].push(path);
                    }
                }
            }
        }
        return routes;
    }

    getLatency(n1: IdType, n2: IdType) {
        const edge = this.topo.edges.get(this.network.getConnectedEdges(n1)).find(e => e.from === n2 || e.to === n2);
        if (!edge) return 0;

        const latency = edge.latency || 0;
        return latency >= 0 ? latency : this.provider.defaultLatency;
    }

    getRouteLatency(route: string[]) {
        let latency = 0;
        for (let i = 1; i < route.length; i++) {
            latency += this.getLatency(route[i], route[i-1]);
        }
        return latency;
    }

    getRoutes(nFaces: number) {
        const graph: any = {};
        for (const node of this.topo.nodes.getIds()) {
            graph[node] = {};
            for (const cn of this.network.getConnectedNodes(node)) {
                const nid = <IdType>cn;
                graph[node][nid] = this.getLatency(node, nid);
            }
        }

        if (nFaces == 1)
            return this.dijkstra(graph)
        else
            return this.dijkstraAll(graph)
    }
}

export class RoutingHelper {
    private routeObject: _CalculateRoutes;
    private namePrefixes: any = {};
    private routes: any = {};

    constructor(
        private topo: Topology,
        provider: ForwardingProvider,
    ) {
        this.routeObject = new _CalculateRoutes(topo, provider);
    }

    addOrigin(nodes: IdType[], prefix: string) {
        for (const node of nodes) {
            if (!Object.keys(this.namePrefixes).includes(node.toString()))
                this.namePrefixes[node] = [];
            this.namePrefixes[node].push(prefix);
        }
    }

    calculateRoutes() {
        return this.calculateNPossibleRoutes(1)
    }

    calculateNPossibleRoutes(nFaces=0) {
        this.routes = this.routeObject.getRoutes(nFaces)
        const fib: any = {};

        for (const node of this.topo.nodes.getIds()) {
            fib[node] = [];

            for (const dest in this.routes[node]) {
                const destNode = this.topo.nodes.get(dest);
                if (!destNode) continue;

                const prefixes = []
                prefixes.push(...(this.namePrefixes[dest] || []));
                prefixes.push(...(destNode.extra.producedPrefixes) || []);

                const routes = [];
                for (const route of this.routes[node][dest]) {
                    routes.push({
                        hop: route[1],
                        cost: this.routeObject.getRouteLatency(route),
                    });
                }

                for (const prefix of prefixes) {
                    const entry = fib[node].find((e: any) => e.prefix == prefix);
                    if (entry) {
                        for (const route of routes) {
                            const hopEntry = entry.routes.find((e: any) => e.hop == route.hop);
                            if (hopEntry) {
                                hopEntry.cost = Math.min(hopEntry.cost, route.cost);
                            } else {
                                entry.routes.push(JSON.parse(JSON.stringify(route)));
                            }
                        }
                    } else {
                        fib[node].push({ prefix, routes: JSON.parse(JSON.stringify(routes)) });
                    }
                }
            }
        }

        return fib;
    }
}
