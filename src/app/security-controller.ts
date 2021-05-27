import { EventEmitter } from "@angular/core";
import { Endpoint } from "@ndn/endpoint";
import { Certificate, generateSigningKey, KeyChain, ValidityPeriod } from "@ndn/keychain";
import { Component } from "@ndn/packet";
import { TrustSchema, TrustSchemaSigner, TrustSchemaVerifier, versec2019 } from "@ndn/trust-schema";
import { INode } from "./interfaces";

export class SecurityController {
    // Need a refresh of security
    public refreshEvent = new EventEmitter<void>();

    // Global keychain
    private rootKeychain!: KeyChain;
    private rootCertificate!: Certificate;

    // Already initialized
    public init = false;

    constructor() {
        this.refresh();
    }

    public refresh = async () => {
        this.rootKeychain = KeyChain.createTemp();
        const [rootPvt, rootPub] = await generateSigningKey(this.rootKeychain, "/ndn");
        this.rootCertificate = await Certificate.selfSign({ publicKey: rootPub, privateKey: rootPvt });
        await this.rootKeychain.insertCert(this.rootCertificate);
        this.refreshEvent.emit();
        this.init = true;
    }

    public getNodeOptions = async (node: INode) => {
        const policy = versec2019.load(`
            site = ndn
            root = <site>/<_KEY>

            node = <site>/<_label>-site/<_KEY>
            ping = <site>/<_label>-site/ping

            ping <= node <= root
        `);

        const keyChain = KeyChain.createTemp();

        const schema = new TrustSchema(policy, [this.rootCertificate]);
        const signer = new TrustSchemaSigner({ keyChain, schema });

        const [pingPvt, pingPub] = await generateSigningKey(keyChain, `/ndn/${node.label}-site`);
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
                fw: node.nfw.fw,
            }),
        });

        return { signer, verifier, keyChain, };
    }
}