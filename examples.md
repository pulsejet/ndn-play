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

## Code Examples
NDN-Play can run mostly unmodified NDNts snippets. Examples can be found on the front page of the [deployed website](https://play.ndn.today).