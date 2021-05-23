import { GlobalService } from "./global.service";
import { INode } from "./interfaces";
import * as chroma from 'chroma-js';
import * as vis from 'vis-network/standalone';

import { Endpoint, Producer } from "@ndn/endpoint";
import { AltUri, Data, Interest, Name, Signer, Verifier } from "@ndn/packet";
import { Forwarder, FwFace, FwPacket, RejectInterest } from "@ndn/fw";
import { Pit } from "@ndn/fw/lib/pit";
import { Encoder, toUtf8 } from '@ndn/tlv';
import { createSigner, createVerifier, CryptoAlgorithm, RSA } from "@ndn/keychain";
import pushable from "it-pushable";

export class NFW {
    /** ID of this node */
    private readonly nodeId: vis.IdType;

    /** NDNts forwarder */
    public fw = Forwarder.create();
    private face: FwFace;
    private faceRx = pushable<FwPacket>();

    /** Security options */
    public security?: {
        /** Signer object */
        signer: Signer,
        /** Verifier object */
        verifier: Verifier,
        /** Private key */
        privKey: CryptoKey,
        /** Public key */
        pubKey: CryptoKey,
        /** Generated key pair */
        keyPair: CryptoAlgorithm.GeneratedKeyPair;
    };

    /** Forwarding table */
    public fib: any[] = [];

    /** Wireshark for this node */
    public readonly capturedPackets: any[] = []
    public capture = false;

    /** Content Store */
    private cs = new ContentStore(this.gs);

    /** Routing strategies */
    public readonly strategies = [
        { prefix: new Name('/'), strategy: 'best-route' },
        { prefix: new Name('/ndn/multicast'), strategy: 'multicast' },
    ];

    /** Packets pending to be forwarded */
    public pendingTraffic = 0;

    /** Server for ping */
    private pingServer?: Producer;

    /** Code the user is currently editing */
    public codeEdit = '';

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

    constructor(private gs: GlobalService, node: INode) {
        this.nodeId = <vis.IdType>node.id;

        this.fw.on("pktrx", (face, pkt) => {
            // Not useful stuff
            if (pkt.cancel || pkt.reject) return;

            // Wireshark
            if (this.capture || this.gs.captureAll) this.capturePacket(pkt.l3);

            // Put on NFW
            if (pkt.l3 instanceof Interest) {
                this.expressInterest(<any>pkt);
            } else if (pkt.l3 instanceof Data) {
                this.cs.push(pkt.l3);
            }
        });

        this.face = this.fw.addFace({
            rx: this.faceRx,
            tx: async () => {},
        });

        // Add routes
        this.fw.on("annadd", (prefix) => {
            const pfxs = this.node().producedPrefixes;
            pfxs.push(AltUri.ofName(prefix));
            this.gs.nodes.update({ id: this.nodeId, producedPrefixes: pfxs });
            this.gs.scheduleRouteRefresh();
        });

        // Remove routes
        this.fw.on("annrm", (prefix) => {
            const pfxs = this.node().producedPrefixes
            const i = pfxs.indexOf(AltUri.ofName(prefix));
            if (i !== -1) pfxs.splice(i, 1);
            this.gs.nodes.update({ id: this.nodeId, producedPrefixes: pfxs });
            this.gs.scheduleRouteRefresh();
        });

        // Setup security
        (async () => {
            const sKey = await RSA.cryptoGenerate({}, true);
            this.security = {
                keyPair: sKey,
                privKey: sKey.privateKey,
                pubKey: sKey.publicKey,
                signer: createSigner(RSA, sKey),
                verifier: createVerifier(RSA, sKey),
            }
            this.nodeUpdated();
        })();
    }

    public node() {
        return <INode>this.gs.nodes.get(this.nodeId);
    }

    public nodeUpdated() {
        // Not before initialization
        if (!this.security) return;

        this.setupPingServer();
    }

    public capturePacket(p: any) {
        let type;
        if (p instanceof Interest) {
            type = 'Interest';
        } else if (p instanceof Data) {
            type = 'Data';
        } else {
            return;
        }

        const encoder = new Encoder();
        encoder.encode(p);

        this.capturedPackets.push({
            t: performance.now(),
            p: p,
            length: encoder.output.length,
            type: type,
        });
    }

    private setupPingServer() {
        // Close existing server
        this.pingServer?.close();

        // Start new server
        const label = this.node().label;
        this.pingServer = this.getEndpoint().produce(`/ndn/${label}-site/ping`, async (interest) => {
            return new Data(interest.name, toUtf8('Ping Reply'));
        });
    }

    public updateColors() {
        // Check busiest node
        if (this.pendingTraffic > (this.gs.busiestNode?.nfw.pendingTraffic || 0)) {
            this.gs.busiestNode = this.node();
        }

        let color = this.gs.DEFAULT_NODE_COLOR
        if (this.pendingTraffic > 0) {
            color = chroma.scale([this.gs.ACTIVE_NODE_COLOR, 'red'])
                                (this.pendingTraffic / ((this.gs.busiestNode?.nfw.pendingTraffic || 0) + 5)).toString();
        } else if (this.gs.getSelectedNode()?.id == this.nodeId) {
            color = this.gs.SELECTED_NODE_COLOR;
        }
        this.gs.pendingUpdatesNodes[this.nodeId] = { id: this.nodeId, color: color };
    }

    /** Add traffic to link */
    private addLinkTraffic(nextHop: vis.IdType, callback: (success: boolean) => void) {
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

    private checkPrefixRegistrationMatches(interest: Interest) {
        for (const face of this.fw.faces) {
            if (face.hasRoute(interest.name)) {
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

    public expressInterest(pkt: FwPacket<Interest>) {
        const interest = pkt.l3;

        if (this.gs.LOG_INTERESTS) {
            console.log(this.node().label, AltUri.ofName(interest.name).substr(0, 20));
        }

        // Aggregate
        if ((<Pit>this.fw.pit).lookup(pkt, false)) {
            return;
        }

        // Check content store
        const csEntry = this.cs.get(interest);
        if (csEntry) {
            this.faceRx.push(FwPacket.create(csEntry));
            return;
        }

        // Get forwarding strategy
        const strategy = this.longestMatch(this.strategies, interest.name)?.strategy;

        // Check if interest has a local face
        if (strategy !== 'multicast' && this.checkPrefixRegistrationMatches(interest)) return;

        // Update colors
        this.pendingTraffic++;
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

        // Token when sending to others
        const upstreamToken = Math.round(Math.random()*1000000000);
        this.pit[upstreamToken] = {
            count: 0,
            timer: window.setTimeout(() => {
                this.faceRx.push(new RejectInterest("expire", interest))
                delete this.pit[upstreamToken]
            }, interest.lifetime || 4000),
        };

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

            // Sent one
            this.pit[upstreamToken].count++;

            // Add traffic to link
            this.addLinkTraffic(nextHop, (success) => {
                this.pendingTraffic--;
                this.updateColors();

                if (success) {
                    if (!this.connections[nextHop]?.face.running) {
                        const tx = pushable<FwPacket>();
                        const face = nextNFW.fw.addFace({
                            rx: tx,
                            tx: async (iterable) => {
                                for await (const rpkt of iterable) {
                                    // Flash nodes only for data
                                    if (rpkt.l3 instanceof Data) {
                                        nextNFW.pendingTraffic++;
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
                                                nextNFW.pendingTraffic--;
                                                nextNFW.updateColors();
                                                this.faceRx.push(rpkt);

                                                // Remove PIT entry
                                                clear();
                                            } else if (rpkt instanceof RejectInterest) {
                                                if (!this.pit[t]) return;

                                                this.pit[t].count--;

                                                if (this.pit[t].count > 0) {
                                                    this.pit[t].count--;
                                                } else {
                                                    // Reject the PIT entry
                                                    this.faceRx.push(rpkt);
                                                    clear();
                                                }
                                            }
                                        }
                                    });
                                }
                            },
                        });
                        this.connections[nextHop] = { face, tx };
                    }

                    const newPkt = FwPacket.create(pkt.l3, upstreamToken);
                    (<any>newPkt).hop = this.nodeId;
                    this.connections[nextHop].tx.push(newPkt);
                }
            });
        }
    }

    public strsFIB() {
        const text = [];

        for (const entry of this.fib) {
            const nexthops = [];
            for (const route of entry.routes) {
                nexthops.push(`face=${this.gs.nodes.get(<vis.IdType>route.hop)?.label} (cost=${route.cost})`);
            }

            text.push(`${AltUri.ofName(entry.prefix)} nexthops={${nexthops.join(', ')}}`);
        }

        return text;
    }

    public getEndpoint() {
        return new Endpoint({
            fw: this.fw,
            dataSigner: this.security?.signer,
        });
    }
}

class ContentStore {
    private cs: { recv: number; data: Data}[] = [];

    constructor(private gs: GlobalService) {}

    public push(data: Data): void {
        if (!data.freshnessPeriod) return;

        // CS object
        const obj = {
            recv: (new Date()).getTime(),
            data: data,
        };

        // Replace old object
        const i = this.cs.findIndex((e) => e.data.name.equals(data.name));
        if (i) {
            this.cs[i] = obj;
        } else {
            this.cs.unshift();
        }

        // Trim CS
        if (this.cs.length > this.gs.contentStoreSize) {
            this.cs = this.cs.slice(0, this.gs.contentStoreSize);
        }
    }

    public get(interest: Interest): Data | undefined {
        return this.cs.find(e => {
            return e.data.canSatisfy(interest) &&
                   e.recv + (e.data.freshnessPeriod || 0) > (new Date()).getTime();
        })?.data;
    }
}
