import type { Network, IdType } from 'vis-network/standalone';
import { ForwardingProvider } from '../forwarding-provider';
import { Topology } from '../topo/topo';
import * as dijkstra from 'dijkstrajs';
import type { IFibEntry, IFibEntryRoutes } from '../interfaces';

type Graph = Record<IdType, Record<IdType, number>>;
type Routes = Record<IdType, Record<IdType, IdType[][]>>;

class _CalculateRoutes {
    constructor(
        private readonly topo: Topology,
        private readonly provider: ForwardingProvider,
    ) {}

    /**
     * Calculate paths between all pairs of nodes
     * @param graph List of nodes and their neighbors with the cost
     * @returns List of nodes and paths to every other node
     */
    dijkstra(graph: Graph) {
        const routes: Routes = {};
        for (const node in graph) {
            routes[node] = {};
            const preds = dijkstra.single_source_shortest_paths(graph, node);
            for (const dest in preds) {
                routes[node][dest] = [dijkstra.extract_shortest_path_from_predecessor_list(preds, dest)];
            }
        }
        return routes;
    }

    dijkstraAll(graph: Graph) {
        const routes = this.dijkstra(graph);

        for (const node in graph) {
            const newGraph = structuredClone(graph);
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
        const edge = this.topo.edges.get(this.topo.network.getConnectedEdges(n1))
            .find(e => e.from === n2 || e.to === n2);
        if (!edge) return 0;

        const latency = edge.latency || 0;
        return latency >= 0 ? latency : this.provider.defaultLatency;
    }

    getRouteLatency(route: IdType[]) {
        let latency = 0;
        for (let i = 1; i < route.length; i++) {
            latency += this.getLatency(route[i], route[i-1]);
        }
        return latency;
    }

    getRoutes(nFaces: number) {
        const graph: Graph = {};
        for (const node of this.topo.nodes.getIds()) {
            graph[node] = {};
            for (const cn of this.topo.network.getConnectedNodes(node)) {
                const nid = cn as IdType;
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
    private readonly routeObject: _CalculateRoutes;
    private readonly namePrefixes: Record<IdType, string[]> = {};

    constructor(
        private readonly topo: Topology,
        readonly provider: ForwardingProvider,
    ) {
        this.routeObject = new _CalculateRoutes(topo, provider);
    }

    addOrigin(nodes: IdType[], prefix: string) {
        for (const node of nodes) {
            if (!this.namePrefixes[node])
                this.namePrefixes[node] = [];
            this.namePrefixes[node].push(prefix);
        }
    }

    calculateRoutes() {
        return this.calculateNPossibleRoutes(1)
    }

    calculateNPossibleRoutes(nFaces=0) {
        const routes = this.routeObject.getRoutes(nFaces)
        const fib: Record<IdType, IFibEntry<string>[]> = {};

        for (const node of this.topo.nodes.getIds()) {
            fib[node] = [];

            for (const dest in routes[node]) {
                const destNode = this.topo.nodes.get(dest);
                if (!destNode) continue;

                const prefixes: string[] = []
                prefixes.push(...(this.namePrefixes[dest] || []));
                prefixes.push(...(destNode.extra.producedPrefixes) || []);

                const entryRoutes: IFibEntryRoutes[] = [];
                for (const route of routes[node][dest]) {
                    entryRoutes.push({
                        hop: route[1],
                        cost: this.routeObject.getRouteLatency(route),
                    });
                }

                for (const prefix of prefixes) {
                    const entry = fib[node].find((e) => e.prefix == prefix);
                    if (entry) {
                        for (const route of entryRoutes) {
                            const hopEntry = entry.routes.find((e) => e.hop == route.hop);
                            if (hopEntry) {
                                hopEntry.cost = Math.min(hopEntry.cost, route.cost);
                            } else {
                                entry.routes.push(structuredClone(route));
                            }
                        }
                    } else {
                        fib[node].push({
                            prefix: prefix,
                            routes: structuredClone(entryRoutes),
                        });
                    }
                }
            }
        }

        return fib;
    }
}
