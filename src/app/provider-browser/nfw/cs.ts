import { Data, Interest } from "@ndn/packet";
import { ProviderBrowser } from "../provider-browser";

type CsEntry = { recv: number; data: Data};

export class ContentStore {
    private cs: CsEntry[] = [];

    constructor(
        private readonly provider: ProviderBrowser,
    ) {}

    public push(data: Data): void {
        if (!data.freshnessPeriod) return;

        // CS object
        const obj: CsEntry = {
            recv: (new Date()).getTime(),
            data: data,
        };

        // Replace old object
        const i = this.cs.findIndex((e) => e.data.name.equals(data.name));
        if (i !== -1) {
            this.cs[i] = obj;
        } else {
            this.cs.unshift(obj);
        }

        // Trim CS
        if (this.cs.length > this.provider.contentStoreSize) {
            this.cs = this.cs.slice(0, this.provider.contentStoreSize);
        }
    }

    public get(interest: Interest): Data | undefined {
        return this.cs.find(e =>
            interest.name.isPrefixOf(e.data.name) &&
                e.recv + (e.data.freshnessPeriod || 0) > (new Date()).getTime()
        )?.data;
    }
}