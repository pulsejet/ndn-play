# ndn-play-vscode

Visual Studio Code Extension for NDN-Play.

Features:
1. Visualization for `.tlv` and `.bundle` extensions.
2. DCT schema visualization ([VerSec](https://marketplace.visualstudio.com/items?itemName=pulsejet.versec-language) extension is recommended)

![Schema Visualization](https://raw.githubusercontent.com/pulsejet/ndn-play/master/vscode-extension/images/dag.ss.png)

## Building & Development

First build NDN-Play, then copy the `dist` folder to the extension as `ndn-play`. \
Alternatively, clone the `gh-pages` branch into the folder with
```bash
git clone https://github.com/pulsejet/ndn-play -b gh-pages --depth 1
```

To develop, use `npm run watch` and the debugging task in VS code.
