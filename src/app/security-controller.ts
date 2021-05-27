import { Endpoint } from "@ndn/endpoint";
import { Certificate, generateSigningKey, KeyChain, ValidityPeriod } from "@ndn/keychain";
import { AltUri, Component } from "@ndn/packet";
import { TrustSchema, TrustSchemaSigner, TrustSchemaVerifier, versec2019 } from "@ndn/trust-schema";
import { NFW } from "./nfw";
import { Topology } from "./topo/topo";
import * as vis from 'vis-network/standalone';

export class SecurityController {
    // Global keychain
    private rootKeychain!: KeyChain;
    private rootCertificate!: Certificate;

    // Don't refresh too often
    private refreshTimer = 0

    // Network
    public readonly nodes: vis.DataSet<vis.Node, "id">;
    public readonly edges: vis.DataSet<vis.Edge, "id">;
    public network!: vis.Network;

    constructor(
        private topo: Topology,
    ) {
        this.nodes = new vis.DataSet<vis.Node, "id">([]);
        this.edges = new vis.DataSet<vis.Edge, "id">([]);

        topo.nodes.on('add', this.computeSecurity.bind(this));
        topo.nodes.on('remove', this.computeSecurity.bind(this));
        this.computeSecurity();
    }

    private addCertNode(cert: Certificate, issuer?: Certificate, args?: any) {
        this.nodes.add({
            id: cert.name.toString(),
            color: issuer ? '#64dd17' : '#ff5252',
            title: AltUri.ofName(cert.name),
            font: {
                color: 'black',
            },
            ... args,
        });

        if (issuer) {
            this.edges.add({
                from: issuer.name.toString(),
                to: cert.name.toString(),
                color: '#64dd17',
            });
        }
    }

    private refresh = async () => {
        this.rootKeychain = KeyChain.createTemp();
        const [rootPvt, rootPub] = await generateSigningKey(this.rootKeychain, "/ndn");
        this.rootCertificate = await Certificate.selfSign({ publicKey: rootPub, privateKey: rootPvt });
        await this.rootKeychain.insertCert(this.rootCertificate);
        this.addCertNode(this.rootCertificate);
    }

    private setNodeOpts = async (nfw: NFW) => {
        const policy = versec2019.load(`
            site = ndn
            root = <site>/<_KEY>

            node = <site>/<_label>/cert/node/<_KEY>
            ping = <site>/<_label>/ping/<_time>

            ping <= node <= root
        `);

        const keyChain = KeyChain.createTemp();
        const schema = new TrustSchema(policy, [this.rootCertificate]);
        const signer = new TrustSchemaSigner({ keyChain, schema });

        const label = nfw.node().label;
        const [pingPvt, pingPub] = await generateSigningKey(keyChain, `/ndn/${label}/cert/node`);
        const pingCert = await Certificate.issue({
            publicKey: pingPub,
            validity: ValidityPeriod.daysFromNow(30),
            issuerId: Component.from("root"),
            issuerPrivateKey: new TrustSchemaSigner({ keyChain: this.rootKeychain, schema }),
        });

        await keyChain.insertCert(pingCert);

        // Add to visualizer
        this.addCertNode(pingCert, this.rootCertificate, { label });

        const verifier = new TrustSchemaVerifier({
            schema,
            offline: false,
            endpoint: new Endpoint({
                fw: nfw.fw,
            }),
        });

        // Put into NFW
        nfw.securityOptions = { signer, verifier, keyChain };
    }

    /** Compute static routes */
    public computeSecurity = async () => {
        if (this.refreshTimer) return;

        this.refreshTimer = window.setTimeout(async () => {
            // Reset
            this.refreshTimer = 0;
            this.nodes.clear();
            this.edges.clear();

            // Keep this log for the user
            console.warn('Computing security');

            // Recalculate
            await this.refresh();

            // Set for all nodes
            await Promise.all(this.topo.nodes.get().map((n) => this.setNodeOpts(n.nfw)));

            // Fit network
            this.fitLazy();
        }, 500);
    }

    /** Initialize the network */
    public createNetwork(container: HTMLElement) {
        const data = {
            nodes: this.nodes,
            edges: this.edges,
        };

        const options = {
            interaction: { hover: false },
            layout: {
                randomSeed: 2,
            },
            edges:{
                arrows: {
                  to: {
                    enabled: true,
                    type: "arrow"
                  },
                }
            },
        };

        this.network = new vis.Network(container, data, options);
    }

    public fitLazy() {
        this.network.stabilize();
        setTimeout(() => this.network.fit(), 200);
    }
}