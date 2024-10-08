# NDN-Play

Visualizer for NDN, running completely in the browser.

[![build](https://github.com/pulsejet/ndn-play/actions/workflows/build.yml/badge.svg)](https://github.com/pulsejet/ndn-play/actions/workflows/build.yml)
[![web](https://img.shields.io/badge/web-live-blue)](https://play.ndn.today)
![GitHub](https://img.shields.io/github/license/pulsejet/ndn-play)

[![Chrome Web Store](https://img.shields.io/badge/chrome%20extension-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/ndn-play-devtools/iknhkednlmhmcooifnplndiahiopfmnh)
[![VS Code Extension](https://img.shields.io/badge/vscode%20extension-007ACC?logo=visualstudio&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=pulsejet.ndn-play-vscode)

This is simulator project aims to help NDN beginners better understand NDN via visualizing both network topology and Interest/Data exchanges. The master branch is continuously deployed at [play.ndn.today](https://play.ndn.today)

NDN-Play can also be used as a GUI for [MiniNDN](https://github.com/named-data/mini-ndn) using [minindn_play](https://github.com/pulsejet/minindn_play). This provides additional featues such as getting an interactive shell on each node along with log and traffic monitoring.

## Build

To run the project

```bash
npm install             # install dependencies
npm run editor-types    # generate type definitions for user code editor
                        # this step is not run during CI/CD and may require some manual patching
npm run start           # build with live refresh
npm run build           # generate production build
```

## License

All code in the repository is licensed under the Apache License Version 2.0.

DCT tools are licensed under the GPLv3 license. If you want a permissive build, remove the `dct-wasm` dependency from `package.json` and references from `angular.json`.
