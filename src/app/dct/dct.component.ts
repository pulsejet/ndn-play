import { Component } from '@angular/core';
import { GlobalService } from '../global.service';
import { WasmService } from '../wasm.service';

// WASM modules
type WasmModule = {
  callMain: (args: string[]) => void;
  FS_createDataFile: (path: string, name: string, data: string, canRead: boolean, canWrite: boolean) => void;
}

// WASM module names
type WasmModuleName = 'schemaCompile';

@Component({
  selector: 'app-dct',
  templateUrl: 'dct.component.html',
  styleUrls: ['dct.component.scss']
})
export class DCTComponent {

  public schema = "// Write DCT schema here";

  constructor(
    private gs: GlobalService,
    private wasm: WasmService,
  ) { }

  async compile(): Promise<void> {
    // Convert line endings to LF. Also add a trailing newline.
    const schema = this.schema.replace(/\r\n/g, '\n') + '\n';

    // Compile the schema
    const compiler = await this.wasm.get('assets/dct/schemaCompile.js', 'schemaCompile', { noInitialRun: true });
    compiler.FS_createDataFile('', 'schema.rules', schema, true, true, true);
    compiler.callMain(['-o', 'schema.scm', 'schema.rules']);
  }
}
