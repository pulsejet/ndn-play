import { Component, OnInit } from '@angular/core';
import { WasmService } from '../wasm.service';
import { initialize as initIface } from './dct.interface';
import localforage from 'localforage';

const LS = {
  schema: 'dct:schema',
  script: 'dct:script',
};

@Component({
  selector: 'app-dct',
  templateUrl: 'dct.component.html',
  styleUrls: ['dct.component.scss']
})
export class DCTComponent implements OnInit {
  public schema = String();
  public script = String();

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
        fetch('assets/dct-script-example.ts')
          .then((res) => res.text())
          .then((script) => (this.script = script));
      }
    });
  }

  async compileSchema(): Promise<void> {
    window.console.clear_play();

    // Compile the schema
    this.saveSchema();
    await window.DCT.schemaCompile({
      input: 'schema.rules',
      output: 'schema.scm',
    });

    // Save schema to local storage
    await localforage.setItem(LS.schema, this.schema);
  }

  saveSchema(): void {
    // Convert line endings to LF. Also add a trailing newline.
    const schema = this.schema.replace(/\r\n/g, '\n') + '\n';

    // Write schema to a file
    this.wasm.writeFile('schema.rules', schema);
  }

  async runScript(): Promise<void> {
    this.saveSchema();
    window.console.clear_play();

    // ZoneAwarePromise cannot be used with async functions
    // So we first construct an async function and transpile it
    // to ES2015 to get rid of async/await
    const target = window.ts.ScriptTarget.ES2015;
    let code = `return (async () => {
      ${this.script}
    })()`;
    code = window.ts.transpile(code, { target });

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
