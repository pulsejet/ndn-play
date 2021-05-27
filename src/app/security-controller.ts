import { Endpoint } from "@ndn/endpoint";
import { Certificate, generateSigningKey, KeyChain, ValidityPeriod } from "@ndn/keychain";
import { Component } from "@ndn/packet";
import { TrustSchema, TrustSchemaSigner, TrustSchemaVerifier, versec2019 } from "@ndn/trust-schema";
import { NFW } from "./nfw";
import { Topology } from "./topo/topo";

export class SecurityController {
    // Global keychain
    private rootKeychain!: KeyChain;
    private rootCertificate!: Certificate;

    // Don't refresh too often
    private refreshTimer = 0

    constructor(
        private topo: Topology,
    ) {
        topo.nodes.on('add', this.computeSecurity.bind(this));
        topo.nodes.on('remove', this.computeSecurity.bind(this));
        this.computeSecurity();
    }

    private refresh = async () => {
        this.rootKeychain = KeyChain.createTemp();
        const [rootPvt, rootPub] = await generateSigningKey(this.rootKeychain, "/ndn");
        this.rootCertificate = await Certificate.selfSign({ publicKey: rootPub, privateKey: rootPvt });
        await this.rootKeychain.insertCert(this.rootCertificate);
    }

    private getNodeOptions = async (nfw: NFW) => {
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

        const [pingPvt, pingPub] = await generateSigningKey(keyChain, `/ndn/${nfw.node().label}/cert/node`);
        const pingCert = await Certificate.issue({
            publicKey: pingPub,
            validity: ValidityPeriod.daysFromNow(30),
            issuerId: Component.from("root"),
            issuerPrivateKey: new TrustSchemaSigner({ keyChain: this.rootKeychain, schema }),
        });

        await keyChain.insertCert(pingCert);

        const verifier = new TrustSchemaVerifier({
            schema,
            offline: false,
            endpoint: new Endpoint({
                fw: nfw.fw,
            }),
        });

        return { signer, verifier, keyChain, };
    }

    /** Compute static routes */
    public computeSecurity = async () => {
        if (this.refreshTimer) return;

        this.refreshTimer = window.setTimeout(async () => {
            // Reset
            this.refreshTimer = 0;

            // Keep this log for the user
            console.warn('Computing security');

            // Recalculate
            await this.refresh();

            // Set for all nodes
            for (const node of this.topo.nodes.get()) {
                this.getNodeOptions(node.nfw).then((opts) => {
                    node.nfw.securityOptions = opts;
                });
            }
        }, 500);
    }
}