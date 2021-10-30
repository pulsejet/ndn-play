import { Data, Interest } from "@ndn/packet";
import { ProviderBrowser } from "../provider-browser";

export class ContentStore {
    private cs: { recv: number; data: Data}[] = [];

    constructor(private provider: ProviderBrowser) {}

    public push(data: Data): void {
        if (!data.freshnessPeriod) return;

        // CS object
        const obj = {
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
        const entry = this.cs.find(e => {
            return interest.name.isPrefixOf(e.data.name) &&
                   e.recv + (e.data.freshnessPeriod || 0) > (new Date()).getTime();
        });
        return entry?.data;
    }
}