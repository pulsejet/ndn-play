import { Component } from '@angular/core';
import { WasmService } from '../wasm.service';

@Component({
  selector: 'app-dct',
  templateUrl: 'dct.component.html',
  styleUrls: ['dct.component.scss']
})
export class DCTComponent {
  public schema = "// Write DCT schema here";

  constructor(
    private wasm: WasmService,
  ) { }

  async compile(): Promise<void> {
    this.clearConsole();

    // Convert line endings to LF. Also add a trailing newline.
    const schema = this.schema.replace(/\r\n/g, '\n') + '\n';

    // Compile the schema
    const compiler = await this.wasm.get('assets/dct/schemaCompile.js', 'schemaCompile', this.getModuleArgs());
    compiler.FS_createDataFile('', 'schema.rules', schema, true, true, true);
    compiler.callMain(['-o', 'schema.scm', 'schema.rules']);
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
