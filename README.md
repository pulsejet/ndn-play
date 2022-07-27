# NDN Play

Playful visualizer for NDN, running completely in the browser.

This is simulator project aims to help NDN beginners better understand NDN via visualizing both network topology and Interest/Data exchanges.
A sample deployed website is [here](https://ndn-play.varunpatil.me)

## Features
NDN-Play lets users simulate and play with NDN topologies

### Topology
The home page of the deployed website shows an example topology in the right box.
You can scroll to adjust the size of this topology graph.
Each node represents an NDN node, and each edge represents a link (or NDN Face) between nodes.
On the top left corner, the `edit` button allows modifying the topology graph with `add node` or `add edge`.
Additionally, you can select and delete nodes or edges. Note that by deleting a node, corresponding edges will also be deleted.
When selecting a specific node, one can change the node name.

### Global Configuration
On the landing page of the deployed website, the left box contains the global configuration panel.
There are four global configuration knobs: `default latency`, `default loss`, `content store size`, `latency slowdown multiplier`.
Moreover, you can check out the `enable packet capture (all nodes)` option to capture all packets sent and received packets in the network,
which can be visualized later.
Besides, as an advanced feature for people who're more familiar with NDN tools, you can load [MiniNDN](https://github.com/named-data/mini-ndn) configs into the simulator via the bottom textbox.

### Functions
Functions are defined as any network semantics that an NDN Play node can execute with.
NDN Play offers the two default functions `ping` and `express interest` in the node configuration page.
When clicking `expressing interest`, the packet flow is visualized in the topology graph.
NDN Play also provides the choice of customized functions.
While on the node configuration page, the `editor` button in the right box will guide you to a text editor page.
You can define your own functions with JS code there and click `run` on the left to execute that function.
[example.md](https://github.com/pulsejet/ndn-play-ng/blob/master/examples.md) gives some functions commonly used in NDN applications.

### Packet Capture and Visualizer
Turning on the packet capture will enable the NDN Play to capture and parse every packet received and sent by selected nodes.
For example, go to `node D`'s configuration page, and check the `enable packet capture` option, then click the `express interest`, you will see the sent Interest captured in the `packet capture` section in the visualizer below the topology graph.
Checking out the `TLV visualizer` section will give the packet structure of captured packet.
You can try to capture and visualize the Data packets generated during `ping` in a similar way.

### Experiment Dumps
The current state of the experiment including the topology and the captured packets can be downloaded using the experiment generation function. Internally, the dump uses Message Pack encoding that is compressed using the DEFLATE algorithm.

### Future Work
In order to help NDN beginners better understand the security primitives in NDN, we plan to visualize the ceritificate chain and signing relationships in the future.

## Build

To run the project

```bash
npm install             # install dependencies
npm run editor-types    # generate type definitions for user code editor
npm run start           # build with live refresh
npm run build           # generate production build
```

## Contributions

Are welcome though GitHub (someone fix the dumb forwarder). All files are licensed under the Apache License v2.0.
