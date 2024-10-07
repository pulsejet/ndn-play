import { Producer, produce } from "@ndn/endpoint";
import { Data } from "@ndn/packet";
import { NFW } from "./nfw";
import { toUtf8 } from '@ndn/util';

export class DefaultServers {
    /** Server for ping */
    private pingServer?: Producer;

    /** Server for certificates */
    private certServer?: Producer;

    constructor(
        private readonly nfw: NFW,
    ) {}

    public restart() {
        this.setupPingServer();
        this.setupCertServer();
    }

    private setupPingServer() {
        // Close existing server
        this.pingServer?.close();

        // Start new server
        const label = this.nfw.node.label;
        const { fw } = this.nfw;
        this.pingServer = produce(`/ndn/${label}/ping`, async (interest) => {
            const data = new Data(interest.name, toUtf8('Ping Reply'), Data.FreshnessPeriod(0));
            this.nfw.securityOptions?.signer.sign(data);
            return data;
        }, { fw });
    }

    private setupCertServer() {
        // Close existing server
        this.certServer?.close();

        // Start new server
        const label = this.nfw.node.label;
        const { fw } = this.nfw;
        this.certServer = produce(`/ndn/${label}/cert`, async (interest) => {
            try {
                const certName = (await this.nfw.securityOptions?.keyChain.listCerts(interest.name))?.[0];
                return certName ? (await this.nfw.securityOptions?.keyChain.getCert(certName))?.data : undefined;
            } catch {
                return undefined;
            }
        }, { fw });
    }
}