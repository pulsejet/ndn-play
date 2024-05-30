import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { WasmService } from '../wasm.service';
import { initialize as initIface } from './dct.interface';
import { untangleGraph } from '../algorithm';
import { transpile, ScriptTarget } from 'typescript';
import { DataSet, Network, parseDOTNetwork } from 'vis-network/standalone';
import { COLOR_MAP } from '../topo/color.map';
import localforage from 'localforage';

import type { TabsComponent } from '../tabs/tabs.component';
import type { TabComponent } from '../tabs/tab.component';
import type { Node, Edge, IdType } from 'vis-network/standalone';

const LS = {
  schema: 'dct:schema',
  script: 'dct:script',
};

interface ICertDagNode extends Node {
  mark: number;
  template?: string;
  hide?: boolean;
};
interface ICertDagEdge extends Edge {
  mark: number;
  color: Exclude<Edge['color'], string>;
};

@Component({
  selector: 'app-dct',
  templateUrl: 'dct.component.html',
  styleUrls: ['dct.component.scss']
})
export class DCTComponent implements OnInit, AfterViewInit {
  public schema: string = String();
  public script: string = String();
  public schemaOutput: string = String();

  private readonly certDag = {
    nodes: new DataSet<ICertDagNode>(),
    edges: new DataSet<ICertDagEdge>(),
  };
  private certDagNet!: Network;
  public readonly certDagOpts = {
    hideChainInfo: true,
    showHidden: false,
  };
  public compileError: boolean = false;

  // Only show DAG visualizer
  @Input() public dagOnly: boolean = false;

  // Native Elements
  @ViewChild('tabs') public tabs?: TabsComponent;
  @ViewChild('visualizerTab') public visualizerTab?: TabComponent;
  @ViewChild('dagContainer') public dagContainer?: ElementRef<HTMLDivElement>;

  constructor(
    private readonly wasm: WasmService,
  ) { }

  ngOnInit(): void {
    // Explose global DCT object
    window.DCT = initIface(this.wasm);

    // Load defaults if needed
    if (!this.dagOnly) {
      this.fetchDefaults()
    }
  }

  private fetchDefaults() {
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

    if (this.dagContainer) {
      // Create network
      this.certDagNet = new Network(this.dagContainer?.nativeElement, this.certDag, options);

      // Add event handlers
      this.certDagNet.on('select', this.onSelect.bind(this));
    }
  }

  public async compileSchema(debug: boolean = false): Promise<boolean> {
    window.console.clear_play?.();
    this.preHookFS();

    try {
      this.schemaOutput = await window.DCT.schemaCompile({
        input: 'schema.rules',
        output: 'schema.scm',
        verbose: true,
        debug: debug,
      });
    } catch (e: any) {
      console.error(e);
      this.schemaOutput = e.stdout ?? String();
      return false;
    }

    // Save schema to local storage
    await localforage.setItem(LS.schema, this.schema);
    return true;
  }

  public async visualizeSchema() {
    this.compileError = !(await this.compileSchema(true));

    // Check if output contains a DAG
    // This can be the case even if the compiler fails
    if (this.schemaOutput.includes('digraph')) {
      this.refreshVisualizer();
      this.tabs?.set(this.visualizerTab!);
    } else {
      this.certDag.nodes.clear();
      this.certDag.edges.clear();
    }
  }

  public refreshVisualizer(): void {
    // Patterns in schemaCompile output
    const REGEX = {
      DAG: /digraph (\w+) \{(.*?)\}/is,
      CHAIN: /chain \w+:(.*)/i,
      TEMPLATE: /cert (\w+):(.*)/i,
    };

    // Get DAG from compiler output
    let match = this.schemaOutput.match(REGEX.DAG);
    if (!match) return;
    this.setVisualizerDAG(parseDOTNetwork(`digraph ${match[1]} {${match[2]}}`));

    // Stabilize physics
    this.certDagNet.stabilize();
    this.certDagNet.fit();

    // Split output on lines
    const lines = this.schemaOutput.split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length);

    // Parse compiler output
    for (const line of lines) {
      // Signing chain
      let match = line.match(REGEX.CHAIN);
      if (match) {
        const chain = match[1]
          .split('<=')
          .map((item) => item.trim());

        // Make root node red
        const root = chain[chain.length - 1]; // root node
        if (this.certDag.nodes.get(root)) {
          this.certDag.nodes.updateOnly({
            id: root,
            color: COLOR_MAP.NODE_RED,
            font: { color: '#DDDDDD' },
          });
        }

        // Make chain leaf nodes orange
        const leaf = chain[0]; // leaf node
        if (this.certDag.nodes.get(leaf)) {
          this.certDag.nodes.updateOnly({
            id: leaf,
            color: COLOR_MAP.NODE_ORANGE,
            shape: 'box',
          });
        }
        continue;
      }

      // Certificate template
      match = line.match(REGEX.TEMPLATE);
      if (match) {
        const certName = match[1].trim();
        const template = match[2].trim().replace(/"/g, ''); // no quotes
        const node = this.certDag.nodes.get(certName);
        if (node) {
          this.certDag.nodes.update({
            id: node.id,
            template: template,
            title: template,
          });
        }
        continue;
      }
    }
  }

  private setVisualizerDAG(dag: { nodes: Node[], edges: Edge[] }) {
    const mark = Math.random();

    // Remove all nodes and edges
    this.certDag.nodes.clear();
    this.certDag.edges.clear();

    // Add new nodes
    this.certDag.nodes.update(
      dag.nodes.map((node: Node): ICertDagNode => {
        // Node color from DOT
        let color
          = typeof node.color === 'string'
          ? node.color
          : typeof node.color === 'object'
          ? node.color.background
          : COLOR_MAP.DEFAULT_NODE_COLOR;
        let fontColor = COLOR_MAP.NODE_FONT;

        // Hide grayed out nodes by default
        const hide = color === 'gray';

        // Color substitutions
        if (color === 'gray') {
          color = COLOR_MAP.silver;
          fontColor = COLOR_MAP.gray;
        }

        return {
          ...node,
          hide: hide,
          mark: mark,
          color: color,
          font: {
            color: fontColor,
          },
        }
      }));

    // Add new edges
    this.certDag.edges.update(
      // Edge color from DOT
      dag.edges.map((edge: Edge): ICertDagEdge => {
        let color
          = typeof edge.color === 'string'
          ? edge.color
          : typeof edge.color === 'object'
          ? edge.color.color
          : COLOR_MAP.DEFAULT_LINK_COLOR;

        // Color substitutions
        if (color === 'gray') {
          color = '#888888';
        }

        return {
          ...edge,
          mark: mark,
          color: {
            color: color,
            hover: color,
            highlight: color,
            opacity: 1
          },
        };
      }));

    // Helper to remove a node from the graph
    const removeNode = (id: IdType) => {
      try {
        this.certDag.edges.remove(this.certDagNet.getConnectedEdges(id));
        this.certDag.nodes.remove(id);
      } catch (_) { }
    };

    // Remove chainInfo if hidden
    if (this.certDagOpts.hideChainInfo) {
      removeNode('#chainInfo');
    }

    // Remove hidden objects
    if (!this.certDagOpts.showHidden) {
      this.certDag.nodes.get()
        .filter((node: ICertDagNode) => node.hide)
        .forEach((node: ICertDagNode) => removeNode(node.id!));
    }

    // Untangle the graph to get correct sorting
    untangleGraph(this.certDag, this.certDagNet, true);
  }

  private preHookFS(): void {
    // Convert line endings to LF. Also add a trailing newline.
    const schema = this.schema.replace(/\r\n/g, '\n') + '\n';

    // Write schema to a file
    this.wasm.writeFile('schema.rules', schema);
  }

  public async runScript(): Promise<void> {
    this.preHookFS();
    window.console.clear_play?.();

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

  private onSelect({ edges, nodes }: { edges: IdType[]; nodes: IdType[] }) {
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
        opacity: visible ? 1 : 0.15,
      });
    }

    // Highlight edges
    for (const edge of this.certDag.edges.get()) {
      const visible = (!nodes.length && !edges.length) || visitedEdges.has(edge.id);
      this.certDag.edges.update({
        id: edge.id,
        color: {
          ...edge.color,
          opacity: visible ? 1 : 0.15,
        },
      });
    }
  }
}
