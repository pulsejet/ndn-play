import { Endpoint } from "@ndn/endpoint";
import { Certificate, generateSigningKey, KeyChain, NamedSigner, NamedVerifier, ValidityPeriod } from "@ndn/keychain";
import { AltUri, Component, Name } from "@ndn/packet";
import { TrustSchema, TrustSchemaPolicy, TrustSchemaSigner, TrustSchemaVerifier, versec2019 } from "@ndn/trust-schema";
import { Topology } from "../topo/topo";
import * as vis from 'vis-network/standalone';

export class SecurityController {
    // Global keychain
    private rootKeychain!: KeyChain;
    private rootKeys: {[id: string]: [NamedSigner.PrivateKey, NamedVerifier.PublicKey, Certificate]} = {};
    private issuerKeys: {[id: string]: [NamedSigner.PrivateKey, NamedVerifier.PublicKey, Certificate][]} = {};

    // Don't refresh too often
    private refreshTimer = 0

    // Network
    public readonly nodes: vis.DataSet<vis.Node, "id">;
    public readonly edges: vis.DataSet<vis.Edge, "id">;
    public network!: vis.Network;

    // Schema text
    public schemaText = `
        site = ndn
        root = <site>/<_KEY>
        node = <site>/<_node>/cert/node/<_KEY>
        ping = <site>/<_node>/ping/<_time>
        ping <= node <= root`
    .trim().split('\n').map((l) => l.trimStart()).join('\n'); // Remove space at start

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
            color: issuer ? '#64dd17' : 'pink',
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
        let policy!: TrustSchemaPolicy;
        try {
            policy = versec2019.load(this.schemaText);
        } catch (e) {
            console.error(e);
            return;
        }

        this.nodes.clear();
        this.edges.clear();
        this.rootKeychain = KeyChain.createTemp();
        this.issuerKeys = {};
        this.rootKeys = {};

        // Clear security options
        for (const node of this.topo.nodes.get()) {
            node.nfw!.securityOptions = <any>{
                keyChain: KeyChain.createTemp(),
            };
        }

        const signers: {[c: string]: string} = {};
        for (const r of policy.listRules()) {
            signers[r[0]] = r[1];
        }

        const certs: {[id: string]: Certificate} = {};

        for (const p of policy.listPatterns()) {
            if (p[0].startsWith('root')) {
                let name: Name;

                const pt = (<any>p[1])?.parts?.[0];
                if (pt?.name) {
                    name = pt.name;
                } else {
                    console.error('Only const pattern supported for root certificate, got', pt);
                    break;
                }

                const [rootPvt, rootPub] = await generateSigningKey(this.rootKeychain, name);
                const rootCert = await Certificate.selfSign({ publicKey: rootPub, privateKey: rootPvt });
                this.issuerKeys[p[0]] = [[rootPvt, rootPub, rootCert]];
                this.rootKeys[p[0]] = [rootPvt, rootPub, rootCert];
                certs[p[0]] = rootCert;
                await this.rootKeychain.insertCert(rootCert);
                this.addCertNode(rootCert, undefined, { label: p[0] });
            } else {
                // Check if it's a certificate
                let pts = (<any>p[1])?.parts;
                if (!pts) continue;
                pts = [...pts];

                const ptl = pts.pop();
                if (ptl.name || ptl.id) {
                    // Guess it's not a certificate :-/
                    continue;
                }

                // Get all name components
                let nameTempl: Name | undefined = new Name();
                let labelled = [];
                for (const pt of pts) {
                    if (pt.name) {
                        nameTempl = nameTempl.append(... (<Name>pt.name).comps);
                        continue;
                    }

                    if (pt.id.startsWith('node')) {
                        labelled.push(nameTempl.length);
                        nameTempl = nameTempl.append('_node');
                        continue;
                    }

                    // Unknown variable? - can't issue this
                    nameTempl = undefined;
                    break;
                }

                // Create certificate for all nodes
                if (nameTempl) {
                    for (const node of this.topo.nodes.get()) {
                        if (!node?.label) continue;

                        let certName = nameTempl;
                        for (const li of labelled) {
                            certName = nameTempl.replaceAt(li, node.label);
                        }

                        const servePrefix = new Name(`/ndn/${node.label}/cert`);
                        if (servePrefix.isPrefixOf(certName)) {
                            // Issue certificate
                            const keyChain = <KeyChain>node.nfw!.securityOptions?.keyChain;
                            const issuers = this.issuerKeys[signers[p[0]]];

                            if (!issuers || issuers.length == 0) continue;

                            for (const issuer of issuers) {
                                const [pvtKey, pubKey] = await generateSigningKey(keyChain, certName);
                                const cert = await Certificate.issue({
                                    publicKey: pubKey,
                                    validity: ValidityPeriod.daysFromNow(30),
                                    issuerId: Component.from(signers[p[0]]),
                                    issuerPrivateKey: issuer[0],
                                });

                                await keyChain.insertCert(cert);
                                this.addCertNode(cert, issuer[2], { label: node.label });

                                if (!this.issuerKeys[p[0]]) this.issuerKeys[p[0]] = [];
                                this.issuerKeys[p[0]].push([pvtKey, pubKey, cert]);
                            }
                        }
                    }
                }
            }
        }

        // Setup security options in NFW
        for (const node of this.topo.nodes.get()) {
            const keyChain = <KeyChain>node.nfw!.securityOptions?.keyChain;
            const rootCerts = Object.values(this.rootKeys).map((c) => c[2]);
            const schema = new TrustSchema(policy, rootCerts);
            const signer = new TrustSchemaSigner({ keyChain, schema });

            const verifier = new TrustSchemaVerifier({
                schema,
                offline: false,
                endpoint: new Endpoint({
                    fw: node.nfw!.fw,
                }),
            });

            // Put into NFW
            node.nfw!.securityOptions = { signer, verifier, keyChain };
        }
    }

    /** Compute static routes */
    public computeSecurity = async () => {
        if (this.topo.imported == 'MININDN') return;
        if (this.refreshTimer) return;

        this.refreshTimer = window.setTimeout(async () => {
            // Reset
            this.refreshTimer = 0;

            // Keep this log for the user
            console.warn('Computing trust');

            // Recalculate
            await this.refresh();

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