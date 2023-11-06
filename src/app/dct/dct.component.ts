import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { WasmService } from '../wasm.service';
import { initialize as initIface } from './dct.interface';
import { transpile, ScriptTarget } from 'typescript';
import { DataSet, Network, Node, Edge } from 'vis-network/standalone';
import localforage from 'localforage';

import type { TabsComponent } from '../tabs/tabs.component';
import type{ TabComponent } from '../tabs/tab.component';

const LS = {
  schema: 'dct:schema',
  script: 'dct:script',
};

interface ICertDagNode extends Node {
  mark: boolean;
};
interface ICertDagEdge extends Edge {
  mark: boolean;
};

@Component({
  selector: 'app-dct',
  templateUrl: 'dct.component.html',
  styleUrls: ['dct.component.scss']
})
export class DCTComponent implements OnInit, AfterViewInit {
  public schema = String();
  public script = String();

  private certDag = {
    nodes: new DataSet<ICertDagNode>(),
    edges: new DataSet<ICertDagEdge>(),
  };
  private certDagNet!: Network;

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
      },
      manipulation: {
        enabled: true,
      },
      layout: {
        randomSeed: 2,
      },
    };
    this.certDagNet = new Network(this.dagContainer?.nativeElement, this.certDag, options);
  }

  async compileSchema(): Promise<boolean> {
    window.console.clear_play();
    this.preHookFS();

    try {
      const output = await window.DCT.schemaCompile({
        input: 'schema.rules',
        output: 'schema.scm',
        verbose: true,
      });
      this.parseCompilerOutput(output);
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

  parseCompilerOutput(output: string): void {
    const lines = output.split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length);

    // Patterns in schemaCompile output
    const REGEX = {
      CHAIN: /chain \w+:(.*)/i
    }

    // Mark all nodes and edges as unvisited
    for (const node of this.certDag.nodes.get()) node.mark = false;
    for (const edge of this.certDag.edges.get()) edge.mark = false;

    // Parse compiler output
    for (const line of lines) {
      // Signing chain
      const match = line.match(REGEX.CHAIN);
      if (match) {
        const chain = match[1].trim()
          .split('<=')
          .map((item) => item.trim())
          .reverse();

        // Create DAG nodes and edges
        for (let i = 0; i < chain.length; i++) {
          const cert = chain[i];
          const prev = i > 0 ? chain[i-1] : null;

          // Add certificate node
          const node = this.certDag.nodes.get(cert);
          if (node) {
            node.mark = true;
          } else {
            this.certDag.nodes.add({ id: cert, label: cert, mark: true });
          }

          // Add signing chain edge
          if (prev) {
            const id = `${prev}-${cert}`;
            const edge = this.certDag.edges.get(id);
            if (edge) {
              edge.mark = true;
            } else {
              this.certDag.edges.add({ id: id, from: prev, to: cert, mark: true });
            }
          }
        }
        continue;
      }
    }

    // Clean up unvisited nodes and edges
    for (const node of this.certDag.nodes.get())
      if (!node.mark) this.certDag.nodes.remove(node.id);
    for (const edge of this.certDag.edges.get())
      if (!edge.mark) this.certDag.edges.remove(edge.id);

    // Stabilize physics if needed
    this.certDagNet.stabilize();
    this.certDagNet.fit();
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
}
