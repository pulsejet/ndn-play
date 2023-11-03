import { Injectable } from '@angular/core';

type WasmModule = {
  callMain: (args: string[]) => void;
  FS_createDataFile: (path: string, name: string, data: string, canRead: boolean, canWrite: boolean, canOwn: boolean) => void;
}

type WasmModuleArgs = {
  noInitialRun?: boolean;
  noExitRuntime?: boolean;
  noFSInit?: boolean;
  print?: (msg: string) => void;
  printErr?: (msg: string) => void;
}

type WasmModuleName = 'schemaCompile';

@Injectable({
  providedIn: 'root'
})
export class WasmService {
  private loaded = new Set<WasmModuleName>();

  /**
   * Load and get a WASM module.
   * @param path Path to JavaScript asset (e.g. dct/tool.js)
   * @param name Name of WASM module (e.g. schemaCompile)
   * @param moduleArgs Arguments to pass to WASM module
   * @returns Promise that resolves to the WASM module
   */
  async get(path: string, name: WasmModuleName, moduleArgs: WasmModuleArgs = {}): Promise<WasmModule> {
    // Load JavaScript if needed
    if (!this.loaded.has(name)) {
      // Set flag for next call
      this.loaded.add(name);

      // Add script tag
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = path;
        script.addEventListener('load', async () => {
          this.get(path, name, moduleArgs).then(resolve, reject);
        });
        document.body.appendChild(script);
      });
    }

    // Load WASM module
    const module = await (<any>window)[name]?.(moduleArgs);
    if (!module) {
      throw new Error(`${name} is not loaded or failed to load WASM module`);
    }
    return module;
  }
}