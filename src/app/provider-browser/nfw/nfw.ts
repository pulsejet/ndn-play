import { AltUri, Data, Interest, Name, Signer, Verifier } from "@ndn/packet";
import { Forwarder, FwFace, FwPacket, RejectInterest } from "@ndn/fw";
import { KeyChain } from "@ndn/keychain";
import { ForwarderImpl } from "@ndn/fw/lib/forwarder";
import { pushable, Pushable } from "it-pushable";

import { ContentStore } from "./cs";
import { Topology } from "../../topo/topo";
import { ProviderBrowser } from "../provider-browser";

import { Shark } from "./shark";
import { DefaultServers } from "./servers";

import type { IdType } from 'vis-network/standalone';
import type { IFibEntry, INodeExtra, IFwPacket, IFwFace } from "../../interfaces";

export class NFW {
    /** NDNts forwarder */
    public readonly fw = Forwarder.create();
    /** Local face for content store etc */
    public readonly localFace: FwFace;
    /** Push channel to local face */
    private localFaceTx = pushable<FwPacket>({objectMode: true});

    /** Browser Forwarding Provider */
    public readonly provider: ProviderBrowser;

    /** Security options */
    public securityOptions?: {
        /** Signer object */
        signer: Signer,
        /** Verifier object */
        verifier: Verifier,
        /** Keychain */
        keyChain: KeyChain;
    };

    /** Forwarding table */
    public readonly fib: IFibEntry[] = [];

    /** Content Store */
    private readonly cs: ContentStore;

    /** Dead Nonce List */
    private readonly dnl: number[] = [];

    /** Routing strategies */
    public readonly strategies: {
        prefix: Name,
        strategy: 'best-route' | 'multicast',
    }[] = [
        { prefix: new Name('/'), strategy: 'best-route' },
        { prefix: new Name('/ndn/multicast'), strategy: 'multicast' },
    ];

    /** Default servers */
    public readonly defualtServers = new DefaultServers(this);

    /** Connections to other NFWs; node => data */
    private readonly connections = new Map<IdType, {
        face: FwFace,
        tx: Pushable<FwPacket>,
    }>();

    /** Aggregate of sent interests; token => entry */
    private readonly pit = new Map<number, {
        count: number,
        timer: number,
    }>();

    /** Announcements current */
    private readonly announcements: Name[] = [];

    /** Extra parameters of node */
    private readonly nodeExtra: INodeExtra;

    /** Packet capture */
    private readonly shark: Shark;

    /** Enable packet capture */
    public capture = false;

    constructor(
        public readonly topo: Topology,
        public readonly nodeId: IdType,
    ) {
        this.provider = <ProviderBrowser>topo.provider;
        this.cs = new ContentStore(this.provider);
        this.shark = new Shark(this, this.topo);

        // Set extra
        this.nodeExtra = this.node.extra;

        this.fw.addEventListener("pktrx", ({face, packet}) => {
            // Not useful stuff
            if (packet.cancel || packet.reject) return;

            // Wireshark
            this.shark.capturePacket(face, packet, "rx");

            // Put on NFW
            if (packet.l3 instanceof Interest) {
                this.expressInterest(packet as FwPacket<Interest>);
            } else if (packet.l3 instanceof Data) {
                this.cs.push(packet.l3);
            }
        });

        this.fw.addEventListener("pkttx", ({face, packet}) => {
            if (packet.cancel || packet.reject) return;
            this.shark.capturePacket(face, packet, "tx");
        });

        this.localFace = this.fw.addFace({
            rx: this.localFaceTx,
            tx: async () => {}, // Nothing should ever be received here
        });

        // Add routes
        this.fw.addEventListener("annadd", ({ name }) => {
            this.nodeExtra.producedPrefixes.push(AltUri.ofName(name));
            this.provider.scheduleRouteRefresh();
            this.announcements.push(name);
        });

        // Remove routes
        this.fw.addEventListener("annrm", ({ name }) => {
            const pfxs = this.nodeExtra.producedPrefixes;
            let i = pfxs.indexOf(AltUri.ofName(name));
            if (i !== -1) pfxs.splice(i, 1);
            this.provider.scheduleRouteRefresh();

            i = this.announcements.findIndex((a) => a.equals(name));
            if (i !== -1) this.announcements.splice(i, 1);
        });

        // Initial server setup
        this.nodeUpdated();
    }

    get node() {
        return this.topo.nodes.get(this.nodeId)!;
    }

    /** Callback whenever the node is updated */
    public nodeUpdated() {
        this.defualtServers.restart();
        this.shark.nodeUpdated();
    }

    /** Update color of current node */
    public updateColors() {
        this.topo.updateNodeColor(this.nodeId, this.nodeExtra);
    }

    /** Update the forwarding table */
    public setFib(fib: IFibEntry[]) {
        this.fib.splice(0, this.fib.length, ...fib);
        this.node.extra.fibStr = this.strsFIB().join('\n');
    }

    /** Add traffic to link */
    private addLinkTraffic(nextHop: IdType, callback: (success: boolean) => void) {
        // Get link to next hop
        const myEdges = this.topo.network.getConnectedEdges(this.nodeId);
        let link = this.topo.edges.get(myEdges).find(l => l.to == nextHop || l.from == nextHop);
        if (!link) return;

        let latency = link.latency >= 0 ? link.latency : this.provider.defaultLatency;
        latency *= this.provider.latencySlowdown;

        // Flash link
        link.extra.pendingTraffic++;
        this.topo.updateEdgeColor(link);

        // Forward after latency
        setTimeout(() => {
            if (!link) return;

            if (--link.extra.pendingTraffic === 0) {
                this.topo.updateEdgeColor(link);
            }

            const loss = link.loss >= 0 ? link.loss : this.provider.defaultLoss;
            callback(Math.random() >= loss / 100);
        }, latency)
    }

    private checkPrefixRegistrationMatches(interest: Interest) {
        for (const ann of this.announcements) {
            if (ann.isPrefixOf(interest.name)) {
                return true;
            }
        }
        return false;
    }

    private longestMatch<T, K extends keyof T>(table: T[], name: Name, identifier: K) {
        let match: T | undefined;
        let matchName: Name | undefined;

        for (const entry of table) {
            const entryName = entry[identifier];
            if (!(entryName instanceof Name)) {
                console.error("[BUG] longestMatch(): entryName is not a name", entryName);
                continue;
            }

            if (entryName.isPrefixOf(name)) {
                if ((matchName?.length || -1) < entryName.length) {
                    match = entry;
                    matchName = entryName;
                }
            }
        }

        return match;
    }

    private allMatches<T, K extends keyof T>(table: T[], name: Name, identifier: K)
    {
        let matches: T[] = [];

        for (const entry of table) {
            const entryName = entry[identifier];
            if (!(entryName instanceof Name)) {
                console.error("[BUG] allMatches(): entryName is not a name", entryName);
                continue;
            }

            if (entryName.isPrefixOf(name))
                matches.push(entry);
        }

        return matches;
    }

    private expressInterest(pkt: FwPacket<Interest>) {
        const interest = pkt.l3;

        if (this.provider.LOG_INTERESTS) {
            console.log(this.node.label, AltUri.ofName(interest.name).substr(0, 20));
        }

        // Aggregate
        const fwImpl = <ForwarderImpl>this.fw;
        if ((fwImpl.pit).lookup(pkt, false)) {
            return;
        }

        // Check content store
        const csEntry = this.cs.get(interest);
        if (csEntry) {
            const pkt = FwPacket.create(csEntry);
            this.localFaceTx.push(pkt);
            return;
        }

        // Get forwarding strategy
        const strategy = this.longestMatch(this.strategies, interest.name, 'prefix')?.strategy;

        // Check if interest has a local face
        if (strategy !== 'multicast' && this.checkPrefixRegistrationMatches(interest)) return;

        // Update colors
        this.nodeExtra.pendingTraffic++;
        this.updateColors();

        // Get longest prefix match
        const fibMatches =
            (strategy == 'multicast'
                ? this.allMatches(this.fib, interest.name, 'prefix')
                : [this.longestMatch(this.fib, interest.name, 'prefix')]
            ).filter(<T>(m?: T): m is T => !!m);

        // Make sure the next hop is not the previous one
        const prevHop = (<IFwPacket>pkt).hop;
        const allNextHops = fibMatches.map(m => m.routes?.filter((r) => r.hop !== prevHop)).flat(1);

        // Drop packet if not matching
        // TODO: NACK
        if (!allNextHops?.length) {
            this.nodeExtra.pendingTraffic--;
            setTimeout(() => this.updateColors(), 100);
            return;
        }

        // Where to forward the interest
        let nextHops: IdType[] = [];

        // Strategies
        if (strategy == 'best-route') {
            const nextHop = allNextHops.reduce((res, obj) => (obj.cost < res.cost) ? obj : res).hop;
            nextHops.push(nextHop);
        } else if (strategy == 'multicast') {
            nextHops.push(...allNextHops.map((h) => h.hop));
        } else {
            throw new Error('Unknown strategy ' + strategy);
        }

        // This will be added in the first iteration
        this.nodeExtra.pendingTraffic--;

        // Which hops sent to (prevent dupulicate sending)
        const sentHops: IdType[] = [];

        // Token when sending to others
        const upstreamToken = Math.round(Math.random() * 1000000000);
        this.pit.set(upstreamToken, {
            count: 0,
            timer: window.setTimeout(() => {
                this.localFaceTx.push(new RejectInterest("expire", interest));
                this.pit.delete(upstreamToken);
            }, interest.lifetime || 4000),
        });

        // Make sure nonce exists (huh)
        interest.nonce ||= Interest.generateNonce();

        // Add all hops
        for (const nextHop of nextHops) {
            // Prevent duplicates
            if (sentHops.includes(nextHop)) continue;
            sentHops.push(nextHop);

            // Add overhead signal
            this.nodeExtra.pendingTraffic++;

            // Forward to next NFW
            const nextNFW = this.topo.nodes.get(nextHop)?.nfw;
            if (!nextNFW) continue;

            // Sent one
            this.pit.get(upstreamToken)!.count++;

            // Add traffic to link
            this.addLinkTraffic(nextHop, (success) => {
                this.nodeExtra.pendingTraffic--;
                this.updateColors();

                if (success) {
                    // Cheat cause we're not really a network
                    // Put the nonce in the DNL of the _next_ NFW,
                    // so it refuses any duplicate interests later
                    if (nextNFW.dnl.includes(interest.nonce ?? NaN)) {
                        return;
                    } else {
                        nextNFW.dnl.push(interest.nonce ?? NaN);
                        if (this.dnl.length > 1500)
                            this.dnl.splice(0, 500);
                    }

                    const newPkt = FwPacket.create(interest, upstreamToken) as IFwPacket;
                    newPkt.hop = this.nodeId;

                    const connection = this.getConnection(nextNFW);
                    connection.tx.push(newPkt);
                    this.shark.capturePacket(connection.face, newPkt, "tx");
                }
            });
        }
    }

    private getConnection(nextNFW: NFW) {
        const nextHop = nextNFW.nodeId;

        if (!this.connections.get(nextHop)?.face.running) {
            const tx = pushable<FwPacket>({
                objectMode: true,
            });
            const face: IFwFace = nextNFW.fw.addFace({
                rx: tx,
                tx: async (iterable) => {
                    for await (const rpkt of iterable) {
                        // Flash nodes only for data
                        if (rpkt.l3 instanceof Data) {
                            nextNFW.nodeExtra.pendingTraffic++;
                            nextNFW.updateColors();
                        }

                        nextNFW.addLinkTraffic(this.nodeId, (revSuccess) => {
                            // Clear pending traffic even if lost packet
                            if (rpkt.l3 instanceof Data) {
                                nextNFW.nodeExtra.pendingTraffic--;
                                nextNFW.updateColors();
                            }

                            if (revSuccess) {
                                // Get and get rid of token
                                const t = (<IFwPacket>rpkt).token;
                                rpkt.token = undefined;

                                // Remove PIT entry
                                const clear = () => {
                                    const entry = this.pit.get(t ?? NaN);
                                    if (!entry) return;
                                    clearTimeout(entry.timer);
                                    this.pit.delete(t!);
                                };

                                if (rpkt.l3 instanceof Data) {
                                    (<IFwPacket>rpkt).hop = nextNFW.nodeId;
                                    nextNFW.getConnection(this).tx.push(rpkt);

                                    // Remove PIT entry
                                    clear();
                                } else if (rpkt instanceof RejectInterest) {
                                    const entry = this.pit.get(t ?? NaN);
                                    if (!entry) return;

                                    entry.count--;

                                    if (entry.count > 0) {
                                        entry.count--;
                                    } else {
                                        // Reject the PIT entry
                                        nextNFW.getConnection(this).tx.push(rpkt);
                                        clear();
                                    }
                                }
                            }
                        });
                    }
                },
            });

            face.hops = {
                [this.nodeId]: nextHop,
                [nextHop]: this.nodeId,
            };

            this.connections.set(nextHop, { face, tx });
        }

        return this.connections.get(nextHop)!;
    }

    public strsFIB() {
        return this.fib.map((entry) => {
            const nexthops = entry.routes.map((route) =>
                `face=${this.topo.nodes.get(route.hop)?.label} (cost=${route.cost})`);

            return `${AltUri.ofName(entry.prefix)} nexthops={${nexthops.join(', ')}}`;
        });
    }
}


