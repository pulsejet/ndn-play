import { Endpoint, Producer } from "@ndn/endpoint";
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
        this.pingServer = new Endpoint({ fw: this.nfw.fw }).produce(`/ndn/${label}/ping`, async (interest) => {
            const data = new Data(interest.name, toUtf8('Ping Reply'), Data.FreshnessPeriod(0));
            this.nfw.securityOptions?.signer.sign(data);
            return data;
        });
    }

    private setupCertServer() {
        // Close existing server
        this.certServer?.close();

        // Start new server
        const label = this.nfw.node.label;
        this.certServer = new Endpoint({ fw: this.nfw.fw }).produce(`/ndn/${label}/cert`, async (interest) => {
            try {
                const certName = (await this.nfw.securityOptions?.keyChain.listCerts(interest.name))?.[0];
                return certName ? (await this.nfw.securityOptions?.keyChain.getCert(certName))?.data : undefined;
            } catch {
                return undefined;
            }
        });
    }
}