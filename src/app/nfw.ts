import { GlobalService } from "./global.service";
import { IData, IInterest, INode } from "./interfaces";
import * as chroma from 'chroma-js';
import * as vis from 'vis-network/standalone';

import { Endpoint, Producer } from "@ndn/endpoint";
import { AltUri, Data, Interest, Signer, Verifier } from "@ndn/packet";
import { Forwarder, FwFace, FwPacket } from "@ndn/fw";
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

    /** Pending interest table */
    private pit: {
        interest: IInterest;
        removeTimer: number;
        faceCallback: ((data: IData) => void)[];
    }[] = [];

    /** Wireshark for this node */
    public readonly capturedPackets: any[] = []
    public capture = false;

    /** Content Store */
    private cs: { recv: number; data: IData}[] = [];

    /** Routing strategies */
    public readonly strategies = [
        { prefix: '/', strategy: 'best-route' },
        { prefix: '/ndn/multicast', strategy: 'multicast' },
    ];

    /** Packets pending to be forwarded */
    public pendingTraffic = 0;

    /** Registered producer prefixes */
    public prefixRegistrations: { prefix: string; callback: (interest: IInterest) => void }[] = [];

    /** Server for ping */
    private pingServer?: Producer;

    /** Code the user is currently editing */
    public codeEdit = '';

    constructor(private gs: GlobalService, node: INode) {
        this.nodeId = <vis.IdType>node.id;

        this.fw.on("pktrx", (face, pkt) => {
            // Do not go into loops
            if (face == this.face) {
                if (this.capture || this.gs.captureAll) this.capturePacket(pkt.l3);
                return;
            }

            // Put on NFW
            if (pkt.l3 instanceof Interest) {
                this.expressInterest({
                    name: AltUri.ofName(pkt.l3.name),
                    freshness: pkt.l3.lifetime,
                    content: pkt.l3,
                }, () => {});
                return;
            } else if (pkt.l3 instanceof Data) {
                this.putData({
                    name: AltUri.ofName(pkt.l3.name),
                    freshness: pkt.l3.freshnessPeriod,
                    content: pkt.l3,
                });
                return;
            }
            console.error("unknown pktrx", pkt);
        });

        this.face = this.fw.addFace({
            rx: this.faceRx,
            tx: async () => {},
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
        this.pingServer = this.getEndpoint().produce(`/ndn/${label}-site/${label}/ping`, async (interest) => {
            return new Data(interest.name, toUtf8('Ping Reply'));
        })
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

    private checkPrefixRegistrationMatches(interest: IInterest) {
        let matched = false;

        for (const entry of this.allMatches(this.prefixRegistrations, interest.name)) {
            entry.callback(interest);
            matched = true;
        }

        return matched;
    }

    private longestMatch(table: any[], name: string, identifier='prefix') {
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

    private allMatches(table: any[], name: string, identifier='prefix') {
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

    public expressInterest = (interest: IInterest, faceCallback: (data: IData) => void, fromFace?: vis.IdType) => {
        if (this.gs.LOG_INTERESTS) {
            console.log(this.node().label, interest.name.substr(0, 20), interest.freshness);
        }

        // Put to NDNts forwarder
        this.faceRx.push(FwPacket.create(interest.content));

        // Do we already have this entry?
        const aggregate = this.pit.find(e => e.interest.name == interest.name);
        if (aggregate) {
            // Add callback to existing entry
            aggregate.faceCallback.push(faceCallback);
        } else {
            // Add to PIT
            const pitEntry = {
                interest,
                faceCallback: [faceCallback],
                removeTimer: window.setTimeout(() => {
                    // Interest expired
                    const i = this.pit.indexOf(pitEntry);
                    this.pit.splice(i, 1);
                }, interest.freshness || 5000),
            };
            this.pit.push(pitEntry);
        }

        // Check content store
        const csEntry = this.cs.find(e => e.data.name == interest.name && e.recv + (e.data.freshness || 0) > (new Date()).getTime());
        if (csEntry) return this.putData(csEntry.data);

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

    public putData(data: IData) {
        const satisfy = this.pit.filter(e => data.name.startsWith(e.interest.name));
        this.pit = this.pit.filter(e => !data.name.startsWith(e.interest.name));

        // Put to NDNts forwarder
        this.faceRx.push(FwPacket.create(data.content));

        if (data.freshness) {
            this.cs.unshift({
                recv: (new Date()).getTime(),
                data: data,
            });
            this.cs = this.cs.slice(0, this.gs.contentStoreSize);
        }

        for (const entry of satisfy) {
            entry.faceCallback.forEach((cb) => cb(data));
            clearTimeout(entry.removeTimer);
        }
    }

    public strsFIB() {
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

    public getEndpoint() {
        return new Endpoint({
            fw: this.fw,
            dataSigner: this.security?.signer,
        });
    }
}
