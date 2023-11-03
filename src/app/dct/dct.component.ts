import { Component, OnInit } from '@angular/core';
import { WasmService } from '../wasm.service';
import localforage from 'localforage';

@Component({
  selector: 'app-dct',
  templateUrl: 'dct.component.html',
  styleUrls: ['dct.component.scss']
})
export class DCTComponent implements OnInit {
  public schema = "// Write DCT schema here";

  constructor(
    private wasm: WasmService,
  ) { }


  async ngOnInit(): Promise<void> {
    // Load schema from localStorage
    localforage.getItem<string>('dct:schema').then((schema) => {;
      if (schema?.trim()) {
        this.schema = schema;
      } else {
        // Sample rules files
        fetch('https://raw.githubusercontent.com/pollere/DCT/099b26c3acb57888cf6f96e1a02cb15fc84ddd6d/examples/hmIot/iot1.rules')
          .then((res) => res.text())
          .then((schema) => (this.schema = schema));
      }
    });
  }

  async compile(): Promise<void> {
    this.clearConsole();

    // Convert line endings to LF. Also add a trailing newline.
    const schema = this.schema.replace(/\r\n/g, '\n') + '\n';

    // Compile the schema
    const compiler = await this.wasm.get('assets/dct/schemaCompile.js', 'schemaCompile', this.getModuleArgs());
    compiler.FS_createDataFile('', 'schema.rules', schema, true, true, true);
    compiler.callMain(['-o', 'schema.scm', 'schema.rules']);

    // Save schema to localStorage
    localforage.setItem('dct:schema', schema);
  }

  getModuleArgs() {
    const console = (<any>window).console;

    // Enable logging only to our console and not
    // the browser console to prevent noise.
    return {
      noInitialRun: true,
      print: console.log_play,
      printErr: console.error_play,
    };
  }

  clearConsole(): void {
    (<any>window).console.clear_play();
  }
}
