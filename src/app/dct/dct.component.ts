import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { WasmService } from '../wasm.service';
import { initialize as initIface } from './dct.interface';
import { transpile, ScriptTarget } from 'typescript';
import { DataSet, Network, Node, Edge, IdType } from 'vis-network/standalone';
import { COLOR_MAP } from '../topo/color.map';
import localforage from 'localforage';

import type { TabsComponent } from '../tabs/tabs.component';
import type { TabComponent } from '../tabs/tab.component';

const LS = {
  schema: 'dct:schema',
  script: 'dct:script',
};

interface ICertDagNode extends Node {
  mark: boolean;
  template?: string;
};
interface ICertDagEdge extends Edge {
  mark: boolean;
  color: Exclude<Edge['color'], string>;
};

@Component({
  selector: 'app-dct',
  templateUrl: 'dct.component.html',
  styleUrls: ['dct.component.scss']
})
export class DCTComponent implements OnInit, AfterViewInit {
  public schema = String();
  public script = String();
  public schemaOutput = String();

  private certDag = {
    nodes: new DataSet<ICertDagNode>(),
    edges: new DataSet<ICertDagEdge>(),
  };
  private certDagNet!: Network;
  public certDagOpts = {
    hideChainInfo: true,
  };

  // Native Elements
  @ViewChild('tabs') tabs!: TabsComponent;
  @ViewChild('visualizerTab') visualizerTab!: TabComponent;
  @ViewChild('dagContainer') dagContainer!: ElementRef;

  constructor(
    private wasm: WasmService,
  ) { }

  ngOnInit(): void {
    // Explose global DCT object
    window.DCT = initIface(this.wasm);

    // Load schema from localStorage
    localforage.getItem<string>(LS.schema).then((schema) => {;
      schema = schema?.trim() ?? null;
      if (schema) {
        this.schema = schema;
      } else {
        // Sample rules files
        fetch('https://raw.githubusercontent.com/pollere/DCT/099b26c3acb57888cf6f96e1a02cb15fc84ddd6d/examples/hmIot/iot1.rules')
          .then((res) => res.text())
          .then((schema) => (this.schema = schema));
      }
    });

    // Load script from localStorage
    localforage.getItem<string>(LS.script).then((script) => {
      script = script?.trim() ?? null;
      if (script) {
        this.script = script;
      } else {
        // Sample rules files
        fetch('assets/dct-script-example.js')
          .then((res) => res.text())
          .then((script) => (this.script = script));
      }
    });
  }

  ngAfterViewInit(): void {
    // Initialize DAG visualizer
    const options = {
      interaction: {
        hover: true,
        tooltipDelay: 0,
      },
      manipulation: {
        enabled: false,
      },
      layout: {
        randomSeed: 2,
        hierarchical: {
          enabled: true,
          sortMethod: 'directed',
          levelSeparation: 80,
          nodeSpacing: 80,
          treeSpacing: 80,
          direction: 'UD',
        },
      },

      edges:{
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.75,
          },
        },
        scaling:{
          label: true,
        },
        smooth: true,
      },

      physics: {
        hierarchicalRepulsion: {
          nodeDistance: 50,
          avoidOverlap: 1,
        },
      },
    };

    // Create network
    this.certDagNet = new Network(this.dagContainer?.nativeElement, this.certDag, options);

    // Add event handlers
    this.certDagNet.on('select', this.onSelect.bind(this));
  }

  async compileSchema(): Promise<boolean> {
    window.console.clear_play();
    this.preHookFS();

    try {
      this.schemaOutput = await window.DCT.schemaCompile({
        input: 'schema.rules',
        output: 'schema.scm',
        verbose: true,
      });
      this.refreshVisualizer(true);
    } catch (e) {
      console.error(e);
      return false;
    }

    // Save schema to local storage
    await localforage.setItem(LS.schema, this.schema);
    return true;
  }

  async visualizeSchema() {
    if (await this.compileSchema()) {
      this.tabs.set(this.visualizerTab)
    }
  }

  refreshVisualizer(stabilize: boolean = false): void {
    const lines = this.schemaOutput.split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length);

    // Patterns in schemaCompile output
    const REGEX = {
      CHAIN: /chain \w+:(.*)/i,
      TEMPLATE: /cert (\w+):(.*)/i,
    }

    // Mark all nodes and edges as unvisited
    for (const node of this.certDag.nodes.get()) node.mark = false;
    for (const edge of this.certDag.edges.get()) edge.mark = false;

    // Parse compiler output
    for (const line of lines) {
      // Signing chain
      let match = line.match(REGEX.CHAIN);
      if (match) {
        const chain = match[1].trim()
          .split('<=')
          .map((item) => item.trim())
          .reverse();

        // Create DAG nodes and edges
        for (let i = 0; i < chain.length; i++) {
          const cert = chain[i];
          const prev = i > 0 ? chain[i-1] : null;
          const isroot = i === 0;
          const isleaf = i === chain.length - 1;

          // Excluded nodes
          if (this.certDagOpts.hideChainInfo && cert === '#chainInfo') continue;

          // Get node color
          let color = COLOR_MAP.DEFAULT_NODE_COLOR;
          if (isroot) color = COLOR_MAP.red;
          else if (isleaf) color = COLOR_MAP.lightorange;

          // Get font color
          let fontColor = 'black';
          if (color === COLOR_MAP.red) fontColor = 'white';

          // Get shape
          const shape = isleaf ? 'box' : 'ellipse';

          // Add certificate node
          const node: ICertDagNode = {
            id: cert,
            label: cert,
            mark: true,
            color: color,
            font: {
              color: fontColor,
            },
            shape: shape,
          };

          if (this.certDag.nodes.get(node.id!)) {
            this.certDag.nodes.update(node);
          } else {
            this.certDag.nodes.add(node);
          }

          // Add signing chain edge
          if (prev) {
            const id = `${prev}-${cert}`;
            const edge = this.certDag.edges.get(id);
            if (edge) {
              edge.mark = true;
            } else {
              this.certDag.edges.add({
                id: id,
                from: prev, to: cert,
                mark: true,
                color: {
                  color: COLOR_MAP.DEFAULT_LINK_COLOR,
                  hover: COLOR_MAP.DEFAULT_LINK_COLOR,
                  highlight: COLOR_MAP.DEFAULT_LINK_COLOR,
                  opacity: 1
                },
              });
            }
          }
        }
        continue;
      }

      // Certificate template
      match = line.match(REGEX.TEMPLATE);
      if (match) {
        const certName = match[1].trim();
        const template = match[2].trim();
        const node = this.certDag.nodes.get(certName);
        if (node) {
          // remove quotes to make it more readable
          node.template = template.replace(/"/g, '');
        }
        continue;
      }
    }

    // Clean up unvisited nodes and edges
    for (const node of this.certDag.nodes.get()) {
      if (!node.mark) {
        this.certDag.nodes.remove(node.id);
        continue;
      }

      // Set extra info
      if (node.template) {
        this.certDag.nodes.update({
          id: node.id,
          title: node.template,
        });
      }
    }
    for (const edge of this.certDag.edges.get()) {
      if (!edge.mark) this.certDag.edges.remove(edge.id);
    }

    if (stabilize) {
      this.certDagNet.stabilize();
      this.certDagNet.fit();
    }
  }

  preHookFS(): void {
    // Convert line endings to LF. Also add a trailing newline.
    const schema = this.schema.replace(/\r\n/g, '\n') + '\n';

    // Write schema to a file
    this.wasm.writeFile('schema.rules', schema);
  }

  async runScript(): Promise<void> {
    this.preHookFS();
    window.console.clear_play();

    // ZoneAwarePromise cannot be used with async functions
    // So we first construct an async function and transpile it
    // to ES2015 to get rid of async/await
    const target = ScriptTarget.ES2015;
    let code = `return (async () => {
      ${this.script}
    })()`;
    code = transpile(code, { target });

    // Run the script
    try {
      await new Function(code)();
    } catch (e) {
      console.error(e);
    }

    // Save script to local storage
    await localforage.setItem(LS.script, this.script);
  }

  onSelect({ edges, nodes }: { edges: IdType[]; nodes: IdType[] }) {
    // DFS to get all nodes below/above the selected nodes
    const visitedNodes = new Set<IdType>();
    const visitedEdges = new Set<IdType>();

    if (nodes.length) {
      // One or more nodes selected
      const dfs = (up: boolean) => {
        const stack = [...nodes];
        stack.forEach(visitedNodes.delete.bind(visitedNodes));

        while (stack.length) {
          const node = stack.pop()!;
          if (visitedNodes.has(node)) continue;
          visitedNodes.add(node);

          const edges = this.certDagNet.getConnectedEdges(node);
          for (const edge of edges) {
            const edgeObj = this.certDag.edges.get(edge)!;
            if (!edgeObj.from || !edgeObj.to) continue;

            if (!up && edgeObj.from === node) {
              stack.push(edgeObj.to);
              visitedEdges.add(edgeObj.id);
            } else if (up && edgeObj.to === node) {
              stack.push(edgeObj.from);
              visitedEdges.add(edgeObj.id);
            }
          }
        }
      }

      // DFS up and down
      dfs(false);
      dfs(true);
    } else if (edges.length) {
      // No nodes selected, but edges selected
      for (const edge of edges) {
        visitedEdges.add(edge);
        const edgeObj = this.certDag.edges.get(edge)!;
        if (!edgeObj.from || !edgeObj.to) continue;

        visitedNodes.add(edgeObj.from);
        visitedNodes.add(edgeObj.to);
      }
    }

    // Highlight node and neigbors
    for (const node of this.certDag.nodes.get()) {
      const visible = (!nodes.length && !edges.length) || visitedNodes.has(node.id);
      this.certDag.nodes.update({
        id: node.id,
        opacity: visible ? 1 : 0.2,
      });
    }

    // Highlight edges
    for (const edge of this.certDag.edges.get()) {
      const visible = (!nodes.length && !edges.length) || visitedEdges.has(edge.id);
      this.certDag.edges.update({
        id: edge.id,
        color: {
          ...edge.color,
          opacity: visible ? 1 : 0.2,
        },
      });
    }
  }
}
