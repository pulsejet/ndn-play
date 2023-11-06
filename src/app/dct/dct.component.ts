import { Component, OnInit } from '@angular/core';
import { WasmService } from '../wasm.service';
import localforage from 'localforage';

const LS = {
  schema: 'dct:schema',
}

@Component({
  selector: 'app-dct',
  templateUrl: 'dct.component.html',
  styleUrls: ['dct.component.scss']
})
export class DCTComponent implements OnInit {
  public schema = String();

  constructor(
    private wasm: WasmService,
  ) { }

  ngOnInit(): void {
    // Explose global DCT object
    window.DCT = {
      schemaCompile: this.wasm.wrapper('assets/dct/schemaCompile.js', 'schemaCompile'),
    };

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
  }

  async compileSchema(): Promise<void> {
    window.console.clear_play();

    // Convert line endings to LF. Also add a trailing newline.
    const schema = this.schema.replace(/\r\n/g, '\n') + '\n';

    // Compile the schema
    this.wasm.writeFile('schema.rules', schema);
    const status = await window.DCT.schemaCompile('-o', 'schema.scm', 'schema.rules');
    if (status !== 0) return;

    // Save schema to local storage
    await localforage.setItem(LS.schema, this.schema);
  }
}
