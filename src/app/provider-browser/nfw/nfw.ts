import { INode, INodeExtra } from "../../interfaces";
import * as vis from 'vis-network/standalone';

import { Endpoint } from "@ndn/endpoint";
import { AltUri, Data, Interest, Name, Signer, Verifier } from "@ndn/packet";
import { Forwarder, FwFace, FwPacket, RejectInterest } from "@ndn/fw";

import { KeyChain } from "@ndn/keychain";

import { ContentStore } from "./cs";
import { Topology } from "../../topo/topo";
import { ProviderBrowser } from "../provider-browser";

import { ForwarderImpl } from "@ndn/fw/lib/forwarder";
import pushable from "it-pushable";
import { Shark } from "./shark";
import { DefaultServers } from "./servers";

export class NFW {
    /** NDNts forwarder */
    public fw = Forwarder.create();
    /** Local face for content store etc */
    public localFace: FwFace;
    /** Push channel to local face */
    private localFaceTx = pushable<FwPacket>();

    /** Browser Forwarding Provider */
    public provider: ProviderBrowser;

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
    public fib: any[] = [];

    /** Enable packet capture */
    public capture = false;

    /** Content Store */
    private cs: ContentStore;

    /** Dead Nonce List */
    private dnl: number[] = [];

    /** Routing strategies */
    public readonly strategies = [
        { prefix: new Name('/'), strategy: 'best-route' },
        { prefix: new Name('/ndn/multicast'), strategy: 'multicast' },
    ];

    /** Default servers */
    public defualtServers = new DefaultServers(this);

    /** Connections to other NFWs */
    private connections: { [nodeId: string]: {
        face: FwFace,
        tx: pushable.Pushable<FwPacket>,
    }} = {};

    /** Aggregate of sent interests */
    private pit: {[token: string]: {
        count: number;
        timer: number;
    }} = {};

    /** Announcements current */
    private announcements: Name[] = [];

    /** Extra parameters of node */
    private nodeExtra: INodeExtra;

    /** Packet capture */
    private shark: Shark;

    constructor(
        private readonly topo: Topology,
        public readonly nodeId: vis.IdType,
    ) {
        this.provider = <ProviderBrowser>topo.provider;
        this.cs = new ContentStore(this.provider);
        this.shark = new Shark(this, this.topo);

        // Set extra
        this.nodeExtra = this.node().extra;

        this.fw.on("pktrx", (face, pkt) => {
            // Not useful stuff
            if (pkt.cancel || pkt.reject) return;

            // Wireshark
            this.shark.capturePacket(face, pkt, "rx");

            // Put on NFW
            if (pkt.l3 instanceof Interest) {
                this.expressInterest(<any>pkt);
            } else if (pkt.l3 instanceof Data) {
                this.cs.push(pkt.l3);
            }
        });

        this.fw.on("pkttx", (face, pkt) => {
            if (pkt.cancel || pkt.reject) return;
            this.shark.capturePacket(face, pkt, "tx");
        });

        this.localFace = this.fw.addFace({
            rx: this.localFaceTx,
            tx: async () => {}, // Nothing should ever be received here
        });

        // Add routes
        this.fw.on("annadd", (prefix) => {
            this.nodeExtra.producedPrefixes.push(AltUri.ofName(prefix));
            this.provider.scheduleRouteRefresh();
            this.announcements.push(prefix);
        });

        // Remove routes
        this.fw.on("annrm", (prefix) => {
            const pfxs = this.nodeExtra.producedPrefixes;
            let i = pfxs.indexOf(AltUri.ofName(prefix));
            if (i !== -1) pfxs.splice(i, 1);
            this.provider.scheduleRouteRefresh();

            i = this.announcements.findIndex((a) => a.equals(prefix));
            if (i !== -1) this.announcements.splice(i, 1);
        });

        // Initial server setup
        this.nodeUpdated();
    }

    public node() {
        return <INode>this.topo.nodes.get(this.nodeId);
    }

    public nodeUpdated() {
        this.defualtServers.restart();
        this.shark.nodeUpdated();
    }

    /** Update color of current node */
    public updateColors() {
        this.topo.updateNodeColor(this.nodeId, this.nodeExtra);
    }

    /** Add traffic to link */
    private addLinkTraffic(nextHop: vis.IdType, callback: (success: boolean) => void) {
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

    private longestMatch(table: any[], name: Name, identifier='prefix') {
        let match = undefined;

        for (const entry of table) {
            if (entry[identifier].isPrefixOf(name)) {
                if ((match?.[identifier].length || -1) < entry[identifier].length) {
                    match = entry;
                }
            }
        }

        return match;
    }

    private allMatches(table: any[], name: Name, identifier='prefix') {
        let matches: any[] = [];

        for (const entry of table) {
            if (entry[identifier].isPrefixOf(name)) {
                matches.push(entry);
            }
        }

        return matches;
    }

    private expressInterest(pkt: FwPacket<Interest>) {
        const interest = pkt.l3;

        if (this.provider.LOG_INTERESTS) {
            console.log(this.node().label, AltUri.ofName(interest.name).substr(0, 20));
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
        const strategy = this.longestMatch(this.strategies, interest.name)?.strategy;

        // Check if interest has a local face
        if (strategy !== 'multicast' && this.checkPrefixRegistrationMatches(interest)) return;

        // Update colors
        this.nodeExtra.pendingTraffic++;
        this.updateColors();

        // Get longest prefix match
        const fibMatches = (strategy == 'multicast' ?
            this.allMatches(this.fib, interest.name) : [this.longestMatch(this.fib, interest.name)]).filter(m => m);

        // Make sure the next hop is not the previous one
        const prevHop = (<any>pkt).hop;
        const allNextHops = fibMatches.map(m => m.routes?.filter((r: any) => r.hop !== prevHop)).flat(1);

        // Drop packet if not matching
        // TODO: NACK
        if (!allNextHops?.length) {
            this.nodeExtra.pendingTraffic--;
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
        this.nodeExtra.pendingTraffic--;

        // Which hops sent to (prevent dupulicate sending)
        const sentHops: vis.IdType[] = [];

        // Token when sending to others
        const upstreamToken = Math.round(Math.random()*1000000000);
        this.pit[upstreamToken] = {
            count: 0,
            timer: window.setTimeout(() => {
                this.localFaceTx.push(new RejectInterest("expire", interest))
                delete this.pit[upstreamToken]
            }, interest.lifetime || 4000),
        };

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
            const nextNFW = this.topo.nodes.get(<vis.IdType>nextHop)?.nfw;
            if (!nextNFW) continue;

            // Sent one
            this.pit[upstreamToken].count++;

            // Add traffic to link
            this.addLinkTraffic(nextHop, (success) => {
                this.nodeExtra.pendingTraffic--;
                this.updateColors();

                if (success) {
                    // Cheat cause we're not really a network
                    // Put the nonce in the DNL of the _next_ NFW,
                    // so it refuses any duplicate interests later
                    if (nextNFW.dnl.includes(<number>interest.nonce)) {
                        return;
                    } else {
                        nextNFW.dnl.push(<number>interest.nonce);
                        if (this.dnl.length > 1500) {
                            this.dnl.splice(0, 500);
                        }
                    }

                    const newPkt = FwPacket.create(interest, upstreamToken);
                    (<any>newPkt).hop = this.nodeId;

                    const connection = this.getConnection(nextNFW);
                    connection.tx.push(newPkt);
                    this.shark.capturePacket(connection.face, newPkt, "tx");
                }
            });
        }
    }

    private getConnection(nextNFW: NFW) {
        const nextHop = nextNFW.nodeId;

        if (!this.connections[nextHop]?.face.running) {
            const tx = pushable<FwPacket>();
            const face = nextNFW.fw.addFace({
                rx: tx,
                tx: async (iterable) => {
                    for await (const rpkt of iterable) {
                        // Flash nodes only for data
                        if (rpkt.l3 instanceof Data) {
                            nextNFW.nodeExtra.pendingTraffic++;
                            nextNFW.updateColors();
                        }

                        nextNFW.addLinkTraffic(this.nodeId, (revSuccess) => {
                            if (revSuccess) {
                                // Get and get rid of token
                                const t = <any>rpkt.token;
                                rpkt.token = undefined;

                                // Remove PIT entry
                                const clear = () => {
                                    if (!this.pit[t]) return;
                                    clearTimeout(this.pit[t].timer);
                                    delete this.pit[t];
                                };

                                if (rpkt.l3 instanceof Data) {
                                    nextNFW.nodeExtra.pendingTraffic--;
                                    nextNFW.updateColors();
                                    (<any>rpkt).hop = nextNFW.nodeId;
                                    nextNFW.getConnection(this).tx.push(rpkt);

                                    // Remove PIT entry
                                    clear();
                                } else if (rpkt instanceof RejectInterest) {
                                    if (!this.pit[t]) return;

                                    this.pit[t].count--;

                                    if (this.pit[t].count > 0) {
                                        this.pit[t].count--;
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
            (<any>face).hops = {};
            (<any>face).hops[this.nodeId] = nextHop,
            (<any>face).hops[nextHop] = this.nodeId,
            this.connections[nextHop] = { face, tx };
        }

        return this.connections[nextHop];
    }

    public strsFIB() {
        const text = [];

        for (const entry of this.fib) {
            const nexthops = [];
            for (const route of entry.routes) {
                nexthops.push(`face=${this.topo.nodes.get(<vis.IdType>route.hop)?.label} (cost=${route.cost})`);
            }

            text.push(`${AltUri.ofName(entry.prefix)} nexthops={${nexthops.join(', ')}}`);
        }

        return text;
    }

    public getEndpoint(opts?: { secure?: boolean }) {
        return new Endpoint({
            fw: this.fw,
            dataSigner: opts?.secure ? this.securityOptions?.signer : undefined,
            verifier: opts?.secure ? this.securityOptions?.verifier : undefined,
        });
    }
}


