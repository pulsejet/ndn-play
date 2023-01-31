# Feature Overview
NDN-Play lets users simulate and play with NDN topologies

## Topology
The home page of the deployed website shows an example topology in the right box.
You can scroll to adjust the size of this topology graph.
Each node represents an NDN node, and each edge represents a link (or NDN Face) between nodes.
On the top left corner, the `Edit` button allows modifying the topology graph with `Add Node` or `Add Edge`.
Additionally, you can select and delete nodes or edges. Note that by deleting a node, corresponding edges will also be deleted.
When selecting a specific node, one can change the node name.

## Global Configuration
On the landing page of the deployed website, the left box contains the global configuration panel.
There are four global configuration knobs: `Default Latency`, `Default Loss`, `Content Store Size`, `Latency Slowdown Multiplier`.
Moreover, you can check out the `Enable Packet Capture (All Nodes)` option to capture all packets sent and received packets in the network,
which can be visualized later.
Besides, as an advanced feature for people who're more familiar with NDN tools, you can load [MiniNDN](https://github.com/named-data/mini-ndn) configs into the simulator via the bottom textbox.

## Functions
Functions are defined as any network semantics that an NDN Play node can execute with.
NDN Play offers the two default functions `Ping` and `Express interest` in the node configuration page.
When clicking `Express Interest`, the packet flow is visualized in the topology graph.
NDN Play also provides the choice of customized functions.
While on the node configuration page, the `Editor` button in the right box will guide you to a text editor page.
You can define your own functions with JS code there and click `Run` on the left to execute that function.

## Packet Capture and Visualizer
Turning on the packet capture will enable the NDN Play to capture and parse every packet received and sent by selected nodes.
For example, go to `Node D`'s configuration page, and check the `Enable Packet Capture` option, then click the `Express Interest`, you will see the sent Interest captured in the `Packet Capture` section in the visualizer below the topology graph.
Checking out the `TLV visualizer` section will give the packet structure of captured packet.
You can try to capture and visualize the Data packets generated during `Ping` in a similar way.

## Experiment Dumps
The current state of the experiment including the topology and the captured packets can be downloaded using the experiment generation function. Internally, the dump uses Message Pack encoding that is compressed using the DEFLATE algorithm.

# Code Examples

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
const { fromUtf8, toUtf8 } = ndn.util;

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
const { fromUtf8, toUtf8 } = ndn.util;

const endpoint = node.nfw.getEndpoint();
var myProducer = endpoint.produce('/ndn/producer/test', async (interest) => {
    const data = new Data(interest.name, Data.FreshnessPeriod(500));
    data.content = toUtf8("Hello from NDNts Producer");
    return data;
});

// Consumer
const { Data, Interest } = ndn.packet;
const { fromUtf8, toUtf8 } = ndn.util;

const endpoint = node.nfw.getEndpoint();
const interest = new Interest('/ndn/producer/test');
const data = await endpoint.consume(interest);
alert(fromUtf8(data.content));
```

### Sync

A sample application running PSync (run this code on multiple nodes)

```js
const { Data, Interest, Name } = ndn.packet;
const { fromUtf8, toUtf8 } = ndn.util;

const endpoint = node.nfw.getEndpoint();

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
