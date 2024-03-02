import { Injectable } from '@angular/core';

/** List of WASM module names */
type WasmExportName =
  'schemaCompile' |
  'schema_info' |
  'make_cert' |
  'schema_cert' |
  'make_bundle' |
  'schema_dump';

/** WASM module after load */
type WasmModule = EmscriptenModule & {
  callMain: (args: string[]) => number;
  FS: typeof FS;
}

/** Module arguments for WASM */
type WasmModuleArgs = Partial<EmscriptenModule>;

/** WASM function */
type WasmFunction = (args: string[], moduleArgs?: WasmModuleArgs) => Promise<number>;

/** Internal global functions */
type WindowInternal = Window & {
  [key in WasmExportName]?: EmscriptenModuleFactory<WasmModule>;
};

// Copied from @types/emscripten namespace FS
// typeof FS doesn't directly work with api-extractor
export interface WasmFS {
  isFile(mode: number): boolean;
  isDir(mode: number): boolean;
  isLink(mode: number): boolean;

  mkdir(path: string, mode?: number): any;
  mkdev(path: string, mode?: number, dev?: number): any;
  symlink(oldpath: string, newpath: string): any;
  rename(old_path: string, new_path: string): void;
  rmdir(path: string): void;
  readdir(path: string): any;
  unlink(path: string): void;
  stat(path: string, dontFollow?: boolean): any;
  chmod(path: string, mode: number, dontFollow?: boolean): void;
  readFile(path: string, opts: { encoding: "binary"; flags?: string | undefined }): Uint8Array;
  readFile(path: string, opts: { encoding: "utf8"; flags?: string | undefined }): string;
  readFile(path: string, opts?: { flags?: string | undefined }): Uint8Array;
  writeFile(path: string, data: string | ArrayBufferView, opts?: { flags?: string | undefined }): void;

  cwd(): string;
  chdir(path: string): void;
};

@Injectable({ providedIn: 'root' })
export class WasmService {
  /** Proxy filesystem for all modules */
  public FS: null | typeof FS = null;
  /** Working directory for virtual filesystem */
  public cwd = '/data';
  /** List of loaded modules (scripts) */
  private readonly loaded = new Set<WasmExportName>();
  /** Files in queue to be updated in the filesystem */
  private readonly files = new Map<string, string | Uint8Array>();

  /**
   * Load and get a WASM module.
   * @param path Path to JavaScript asset (e.g. dct/tool.js)
   * @param name Name of WASM module (e.g. schemaCompile)
   * @param moduleArgs Arguments to pass to WASM module
   * @returns Promise that resolves to the WASM module
   */
  public async get(path: string, name: WasmExportName, moduleArgs?: WasmModuleArgs): Promise<WasmModule> {
    // Load JavaScript if needed
    if (!this.loaded.has(name)) {
      // Set flag for next call
      this.loaded.add(name);

      // Add script tag
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = path;
        script.addEventListener('load', () => {
          this.get(path, name, moduleArgs).then(resolve, reject);
        });
        script.addEventListener('error', () => {
          reject(new Error(`Failed to load ${path}`));
        });
        document.body.appendChild(script);
      });
    }

    // Add base arguments
    moduleArgs = { ...this.baseArgs(), ...moduleArgs };

    // Load WASM module
    const w = window as unknown as WindowInternal;
    const module = await w[name]?.(moduleArgs ?? {});
    if (!module) {
      throw new Error(`${name} is not loaded or failed to load WASM module`);
    }

    // Initialize filesystem if needed
    this.initfs(module);

    return module;
  }

  /**
   * Get a wrapped WASM module as an async function.
   * @param path Path to JavaScript asset (e.g. dct/tool.js)
   * @param name Name of WASM module (e.g. schemaCompile)
   * @param wrapperArgs Arguments to pass to WASM module
   * @param expectZero Whether to throw an error if the return value is not zero
   * @returns Promise that resolves to the WASM module
   */
  public wrapper(
    path: string,
    name: WasmExportName,
    wrapperArgs?: WasmModuleArgs,
    expectZero = true,
  ): WasmFunction {
    return async (args: string[], moduleArgs?: WasmModuleArgs) => {
      // Get the WASM module
      // This _will_ unfortunately fetch the module every time
      const module = await this.get(path, name, {
        ...wrapperArgs ?? {},
        ...moduleArgs ?? {},
      });

      // Call native main function
      const status = module.callMain(args);

      // Check status code if needed
      if (expectZero && status !== 0) {
        const args_str = args
          .slice(1) // skip dummy name
          .map((arg) => arg.includes(' ') ? `"${arg}"` : arg) // escape spaces
          .join(' '); // join args
        throw new Error(`exited with status ${status} while running binary\n${name} ${args_str}`);
      }

      // Return status code
      return status;
    };
  }

  /**
   * Patch a wrapper to return stdout.
   * @param fun WASM function to wrap
   */
  public async stdout(fun: WasmFunction, ...args: Parameters<WasmFunction>): Promise<string> {
    const stdout: string[] = [];
    try {
      await fun(args[0], {
        ...args[1] ?? {},
        print: (line) => stdout.push(line) && window.console.log_play(line),
      });

      return stdout.join('\n');
    } catch (e: any) {
      e.stdout = stdout.join('\n');
      throw e;
    }
  }

  /**
   * Write a file to the virtual filesystem.
   * This can be called before the WASM module is loaded since
   * the files are written every time the module is called.
   */
  public writeFile(path: string, data: string | Uint8Array): void {
    if (this.FS) {
      // Write file to filesystem
      this.FS.writeFile(path, data);
    } else {
      // Queue the file for when the filesystem is initialized
      this.files.set(path, data);
    }
  }

  /**
   * Initialize the virtual filesystem with the IndexedDB.
   * @param module Module to sync filesystem for
   * @param populate Whether to populate the filesystem
   * @returns Whether initialization was performed
   */
  private initfs(module: WasmModule): void {
    // Create mount point
    module.FS.mkdir(this.cwd);

    // Initialize filesystem
    if (!this.FS) {
      // Save filesystem for other modules
      window.FS = this.FS = module.FS;
    } else {
      // Mount filesystem to data directory
      module.FS.mount((this.FS as any).filesystems.PROXYFS, {
        root: this.cwd,
        fs: this.FS,
      }, this.cwd);
    }

    // Change working directory
    module.FS.chdir(this.cwd);

    // Write files to virtual filesystem
    for (const [path, file] of this.files.entries())
      module.FS.writeFile(path, file);
    this.files.clear();
  }

  /**
   * Get base arguments for WASM module.
   */
  private baseArgs(): WasmModuleArgs {
    // Enable logging only to our console and not
    // the browser console to prevent noise.
    return {
      noInitialRun: true,
      print: window.console.log_play,
      printErr: window.console.error_play,
    };
  }
}