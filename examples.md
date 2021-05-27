# NDN-Play Code Examples

You can run JavaScript code using NDNts on nodes in NDN-Play. The `Node` object is available in the variable `node` and NDNts imports must be done from `ndn.<package-name>`.

You can get a configured NDNts `Endpoint` with `node::nfw::getEndpoint`.

## Visualize Packet
On any node, run `visualize(packet)` to visualize an Encodable TLV.

```js
const { Data, Interest, Name } = ndn.packet;

const i = new Interest(new Name('/ndn/test/alice/test'), Interest.MustBeFresh);
visualize(i);
```

Example with signed data

```js
const { Data, Interest, Name } = ndn.packet;
const { fromUtf8, toUtf8 } = ndn.tlv;

const data = new Data(new Name('/ndn/test/alice/test'));
data.content = toUtf8("Test");
node.nfw.security.signer.sign(data);
visualize(data);
```

### Producer-Consumer

A simple ping program is described below.

```js
// Producer
const { Data, Interest } = ndn.packet;
const { fromUtf8, toUtf8 } = ndn.tlv;

const endpoint = node.nfw.getEndpoint({ secure: false });
var myProducer = endpoint.produce('/ndn/producer/test', async (interest) => {
    const data = new Data(interest.name, Data.FreshnessPeriod(500));
    data.content = toUtf8("Hello from NDNts Producer");
    return data;
});

// Consumer
const { Data, Interest } = ndn.packet;
const { fromUtf8, toUtf8 } = ndn.tlv;

const endpoint = node.nfw.getEndpoint({ secure: false });
const interest = new Interest('/ndn/producer/test');
const data = await endpoint.consume(interest);
alert(fromUtf8(data.content));
```

### Sync

A sample application running PSync (run this code on multiple nodes)

```js
const { Data, Interest, Name } = ndn.packet;
const { fromUtf8, toUtf8 } = ndn.tlv;

const endpoint = node.nfw.getEndpoint({ secure: false });

const opts = {
    p: ndn.sync.makePSyncCompatParam({ expectedEntries: 40 }),
    syncPrefix: new Name("/ndn/multicast/psync"),
    syncInterestLifetime: 4000,
    syncInterestInterval: [1100, 1500],
    endpoint: endpoint,
};

const sync = new ndn.sync.PSyncFull(opts);
sync.on("update", (e) => {
    console.log(`PSync update at ${node.label} ${e.node.id.toString()} = ${e.loSeqNum} - ${e.hiSeqNum}`);
});

const syncNode = sync.add(new Name(`/ndn/${node.label}/psync`));
setInterval(() => {
    syncNode.seqNum++;
    console.log(node.label, "produced", syncNode.seqNum)
}, 3000);

if (!window.sync) window.sync = [];
window.sync[node.label] = sync;

// To stop all nodes, run
// Object.values(window.sync).forEach((e) => e.close())
```

## Trust Visualization

A keypair and certificate is generated for each node from the schema, when the prefix of the certificate is `/ndn/<_node>`. All root certificates are configured as trust anchors.

* One certificate directly signed by the trust anchor for each node
    ```
    site = ndn
    root = <site>/<_KEY>
    node = <site>/<_node>/cert/node/<_KEY>
    ping = <site>/<_node>/ping/<_time>
    ping <= node <= root
    ```

* One certificate for node A, signed by the trust anchor. All other certificates are signed by A. A's certificate is distributed by A only.
    ```
    site = ndn
    root = <site>/<_KEY>
    a = <site>/A/cert/my-tree/<_KEY>
    a-node = <site>/<_node>/cert/my-tree/<_KEY>
    ping = <site>/<_node>/ping/<_time>
    ping <= a-node <= a <= root
    ```
