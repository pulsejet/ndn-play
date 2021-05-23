import * as vis from 'vis-network/standalone';
import { GlobalService } from './global.service';

declare var dijkstra: any;

class _CalculateRoutes {
    private network: vis.Network;

    constructor(
        private gs: GlobalService,
    ) {
        this.network = <vis.Network>this.gs.network;
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

    getLatency(n1: vis.IdType, n2: vis.IdType) {
        const edge = this.gs.edges.get(this.network.getConnectedEdges(n1)).find(e => e.from === n2 || e.to === n2);
        if (!edge) return 0;

        const latency = edge.latency || 0;
        return latency >= 0 ? latency : this.gs.defaultLatency;
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
        for (const node of this.gs.nodes.getIds()) {
            graph[node] = {};
            for (const cn of this.network.getConnectedNodes(node)) {
                const nid = <vis.IdType>cn;
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
        private gs: GlobalService,
    ) {
        this.routeObject = new _CalculateRoutes(gs);
    }

    addOrigin(nodes: vis.IdType[], prefix: string) {
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

        for (const node of this.gs.nodes.getIds()) {
            fib[node] = [];

            for (const dest in this.routes[node]) {
                const destNode = this.gs.nodes.get(dest);
                if (!destNode) continue;

                const prefixes = []
                prefixes.push(...(this.namePrefixes[dest] || []));
                prefixes.push(...(destNode.producedPrefixes) || []);

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
                                entry.routes.push(route);
                            }
                        }
                    } else {
                        fib[node].push({ prefix, routes });
                    }
                }
            }
        }

        return fib;
    }
}
