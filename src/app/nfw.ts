import { GlobalService } from "./global.service";
import { IData, IInterest, INode } from "./interfaces";
import * as chroma from 'chroma-js';
import * as vis from 'vis-network/standalone';

import { ConsumerContext, ConsumerOptions, Producer, ProducerHandler, ProducerOptions } from "@ndn/endpoint";
import { AltUri, Data, Interest, Name, NameLike } from "@ndn/packet";

export class NFW {
    fib: any[] = [];
    pit: {
        interest: IInterest;
        removeTimer: number;
        faceCallback: (data: IData) => void;
    }[] = [];
    cs: { recv: number; data: IData}[] = [];

    strategies = [
        { prefix: '/', strategy: 'best-route' },
        { prefix: '/ndn/multicast', strategy: 'multicast' },
    ];

    pendingTraffic = 0;
    prefixRegistrations: { prefix: string; callback: (interest: IInterest) => void }[] = [];

    private readonly nodeId: vis.IdType;

    constructor(private gs: GlobalService, node: INode) {
        this.nodeId = <vis.IdType>node.id;
        this.nodeUpdated();
    }

    node() {
        return <INode>this.gs.nodes.get(this.nodeId);
    }

    nodeUpdated() {
        this.setupPingServer();
    }

    setupPingServer() {
        if (this.prefixRegistrations.length == 0) {
            this.prefixRegistrations.push(<any>{});
        }

        const label = this.node().label;
        this.prefixRegistrations[0] = {
            prefix: `/ndn/${label}-site/${label}/ping`,
            callback: (interest) => {
                this.putData({
                    name: interest.name,
                    content: `Reply to ${interest.name} from ${label}`,
                });
            }
        };
    }

    updateColors() {
        // Check busiest node
        if (this.pendingTraffic > (this.gs.busiestNode?.nfw.pendingTraffic || 0)) {
            this.gs.busiestNode = this.node();
        }

        let color = this.gs.DEFAULT_NODE_COLOR
        if (this.pendingTraffic > 0) {
            color = chroma.scale([this.gs.ACTIVE_NODE_COLOR, 'red'])
                                (this.pendingTraffic / ((this.gs.busiestNode?.nfw.pendingTraffic || 0) + 5)).toString();
        } else if (this.gs.selectedNode?.id == this.nodeId) {
            color = this.gs.SELECTED_NODE_COLOR;
        }
        this.gs.pendingUpdatesNodes[this.nodeId] = { id: this.nodeId, color: color };
    }

    /** Add traffic to link */
    addLinkTraffic(nextHop: vis.IdType, callback: (success: boolean) => void) {
        // Get link to next hop
        const myEdges = this.gs.network.getConnectedEdges(this.nodeId);
        let link = this.gs.edges.get(myEdges).find(l => l.to == nextHop || l.from == nextHop);
        if (!link) return;

        let latency = link.latency >= 0 ? link.latency : this.gs.defaultLatency;
        latency *= this.gs.latencySlowdown;

        // Flash link
        link.controller.pendingTraffic++;

        // Check busiest link
        if (link.controller.pendingTraffic > (this.gs.busiestLink?.controller.pendingTraffic || 0)) {
            this.gs.busiestLink = link;
        }
        const color = chroma.scale([this.gs.ACTIVE_NODE_COLOR, 'red'])
                                  (link.controller.pendingTraffic / (this.gs.busiestLink?.controller.pendingTraffic || 0) + 5).toString();
        this.gs.pendingUpdatesEdges[link.id] = { id: link.id, color: color };

        // Forward after latency
        setTimeout(() => {
            if (!link) return;

            if (--link.controller.pendingTraffic === 0) {
                this.gs.pendingUpdatesEdges[link.id] = { id: link.id, color: this.gs.DEFAULT_LINK_COLOR };
            }

            const loss = link.loss >= 0 ? link.loss : this.gs.defaultLoss;
            callback(Math.random() >= loss / 100);
        }, latency)
    }

    checkPrefixRegistrationMatches(interest: IInterest) {
        let matched = false;

        for (const entry of this.allMatches(this.prefixRegistrations, interest.name)) {
            entry.callback(interest);
            matched = true;
        }

        return matched;
    }

    longestMatch(table: any[], name: string, identifier='prefix') {
        // Count number of components
        const numComponents = ((s: string) => ((s || '').match(/\//g)||[]).length);

        let matchName = name;
        if (!matchName.endsWith('/')) matchName += '/';

        let match = undefined;
        for (const entry of table) {
            if (matchName.startsWith(entry[identifier] + (entry[identifier].endsWith('/') ? '' : '/'))) {
                if (numComponents(match?.[identifier]) < numComponents(entry?.[identifier])) {
                    match = entry;
                }
            }
        }

        return match;
    }

    allMatches(table: any[], name: string, identifier='prefix') {
        let matchName = name;
        if (!matchName.endsWith('/')) matchName += '/';

        let matches: any[] = [];
        for (const entry of table) {
            if (matchName.startsWith(entry[identifier] + (entry[identifier].endsWith('/') ? '' : '/'))) {
                matches.push(entry);
            }
        }

        return matches;
    }

    expressInterest = (interest: IInterest, faceCallback: (data: IData) => void, fromFace?: vis.IdType) => {
        if (this.gs.LOG_INTERESTS) {
            console.log(this.node().label, interest.name);
        }

        // Check content store
        const csEntry = this.cs.find(e => e.data.name == interest.name && e.recv + (e.data.freshness || 0) > (new Date()).getTime());
        if (csEntry) return faceCallback(csEntry.data);

        // Do we already have this entry?
        const aggregate = this.pit.find(e => e.interest.name == interest.name);

        // Add to PIT
        const pitEntry = {
            interest,
            faceCallback: faceCallback,
            removeTimer: window.setTimeout(() => {
                // Interest expired
                const i = this.pit.indexOf(pitEntry);
                this.pit.splice(i, 1);
            }, interest.freshness || 5000),
        };
        this.pit.push(pitEntry);

        // Get forwarding strategy
        const strategy = this.longestMatch(this.strategies, interest.name)?.strategy;

        // Check if interest has a local face
        if (this.checkPrefixRegistrationMatches(interest) && strategy !== 'multicast') return;

        // Aggregate if we had it already
        if (aggregate) return;

        // Update colors
        this.pendingTraffic++;
        this.updateColors();

        // Get longest prefix match
        const fibMatches = (strategy == 'multicast' ?
            this.allMatches(this.fib, interest.name) : [this.longestMatch(this.fib, interest.name)]).filter(m => m);

        // Make sure the next hop is not the previous one
        const allNextHops = fibMatches.map(m => m.routes?.filter((r: any) => r.hop !== fromFace)).flat(1);

        // Drop packet if not matching
        // TODO: NACK
        if (!allNextHops?.length) {
            this.pendingTraffic--;
            setTimeout(() => this.updateColors(), 100);
            return;
        }

        // Where to forward the interest
        let nextHops: vis.IdType[] = [];

        // Strategies
        if (strategy == 'best-route') {
            const nextHop = allNextHops.reduce(function(res: any, obj: any) {
                return (obj.cost < res.cost) ? obj : res;
            }).hop;
            nextHops.push(nextHop);
        } else if (strategy == 'multicast') {
            nextHops.push(...allNextHops.map((h: any) => h.hop));
        } else {
            throw new Error('Unknown strategy ' + strategy);
        }

        // This will be added in the first iteration
        this.pendingTraffic--;

        // Which hops sent to (prevent dupulicate sending)
        const sentHops: vis.IdType[] = [];

        // Add all hops
        for (const nextHop of nextHops) {
            // Prevent duplicates
            if (sentHops.includes(nextHop)) continue;
            sentHops.push(nextHop);

            // Add overhead signal
            this.pendingTraffic++;

            // Forward to next NFW
            const nextNFW = this.gs.nodes.get(<vis.IdType>nextHop)?.nfw;
            if (!nextNFW) continue;

            // Add traffic to link
            this.addLinkTraffic(nextHop, (success) => {
                if (success) {
                    nextNFW.expressInterest(interest, (data) => {
                        nextNFW.pendingTraffic++;
                        nextNFW.updateColors();
                        nextNFW.addLinkTraffic(this.nodeId, (revSuccess) => {
                            nextNFW.pendingTraffic--;
                            nextNFW.updateColors();

                            if (revSuccess) {
                                this.putData(data);
                            }
                        });
                    }, this.nodeId);
                }

                this.pendingTraffic--;
                this.updateColors();
            });
        }
    }

    putData(data: IData) {
        const satisfy = this.pit.filter(e => e.interest.name == data.name);
        this.pit = this.pit.filter(e => e.interest.name !== data.name);

        if (data.freshness) {
            this.cs.unshift({
                recv: (new Date()).getTime(),
                data: data,
            });
            this.cs = this.cs.slice(0, this.gs.contentStoreSize);
        }

        for (const entry of satisfy) {
            entry.faceCallback(data);
            clearTimeout(entry.removeTimer);
        }
    }

    strsFIB() {
        const text = [];

        for (const entry of this.fib) {
            const nexthops = [];
            for (const route of entry.routes) {
                nexthops.push(`face=${this.gs.nodes.get(<vis.IdType>route.hop)?.label} (cost=${route.cost})`);
            }

            text.push(`${entry.prefix} nexthops={${nexthops.join(', ')}}`);
        }

        return text;
    }

    getEndpoint = async () => {
        return {
            consume: (interestInput: Interest | NameLike, opts?: ConsumerOptions): ConsumerContext => {
                const interest = interestInput instanceof Interest ? interestInput : new Interest(interestInput);

                let nRetx = -1;
                const promise = new Promise<Data>((resolve, reject) => {
                    const timer = setTimeout(() => {
                        reject(new Error(`Interest timed out`))
                    }, interest.lifetime);

                    this.expressInterest({
                        name: AltUri.ofName(interest.name),
                        content: interest,
                        freshness: interest.lifetime,
                    }, (data) => {
                        resolve(data.content)
                        clearTimeout(timer);
                    });
                });
                return Object.defineProperties(promise, {
                    interest: { value: interest },
                    nRetx: { get() { return nRetx; } },
                });
            },
            produce: (prefixInput: undefined | NameLike, handler: ProducerHandler, opts?: ProducerOptions): Producer => {
                const prefix = typeof prefixInput === "undefined" ? undefined : new Name(prefixInput);

                let producer: Producer;

                const processInterestUnbuffered = async (interest: Interest) => {
                    const data = await handler(interest, producer);
                    if (!(data instanceof Data)) {
                      return undefined;
                    }
                    return data;
                };

                const reg = {
                    prefix: AltUri.ofName(<Name>prefix),
                    callback: (ii: IInterest) => {
                        processInterestUnbuffered(ii.content).then((data) => {
                            if (data) {
                                this.putData({
                                    name: AltUri.ofName(data.name),
                                    content: data,
                                    freshness: data.freshnessPeriod,
                                });
                            }
                        })
                    }
                };
                this.prefixRegistrations.push(reg);

                producer = {
                    prefix,
                    face: <any>null,
                    dataBuffer: <any>null,
                    processInterest: processInterestUnbuffered,
                    close: () => {
                        this.prefixRegistrations.splice(this.prefixRegistrations.indexOf(reg), 1);
                    },
                };

                return producer;
            },
        }
    }
}