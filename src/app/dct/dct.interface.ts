import { WasmService } from "../wasm.service";

export interface DCT {
  /** Compile a trust schema. */
  schemaCompile: (opts: {
    /** input file */
    input: string,
    /** output file */
    output?: string,
    /** quiet (no diagnostic output) */
    quiet?: boolean,
    /** increase diagnostic level */
    verbose?: boolean,
    /** debug (highest diagnostic level) */
    debug?: boolean,
    /** print schema's cert DAG then exit */
    printDAG?: boolean,
    /** print compiler version and exit */
    version?: boolean,
  }) => Promise<string>;

  /** Get information about a trust schema. */
  schema_info: (opts: {
    /** input binary schema */
    input: string,
    /** pass option -c */
    c?: boolean,
    /** pass option -t */
    t?: boolean,
    /** publication name */
    pubname?: string,
  }) => Promise<string>;

  /** Generate a self-signed certificate. */
  make_cert: (opts: {
    /** Type of signature (e.g. EdDSA) */
    sigType?: string,
    /** Output file */
    output?: string,
    /** Name of certificate */
    name: string,
    /** Signer of cert */
    signer?: string,
  }) => Promise<void>;

  /** Sign a schema to create a schema certificate */
  schema_cert: (opts: {
    /** Output file */
    output?: string,
    /** Input schema file */
    input: string,
    /** Schema signer */
    signer?: string,
  }) => Promise<void>;

  make_bundle: (opts: {
    /** Increase output level */
    verbose?: boolean,
    /** Output file */
    output: string,
    /** Input files */
    input: string[],
  }) => Promise<void>;

  schema_dump: (opts: {
    input: string,
  }) => Promise<string>;
};

export function initialize(wasm: WasmService): DCT {
  const wrappers = {
    schemaCompile: wasm.wrapper('assets/dct/schemaCompile.js', 'schemaCompile'),
    schema_info: wasm.wrapper('assets/dct/schema_info.js', 'schema_info'),
    make_cert: wasm.wrapper('assets/dct/make_cert.js', 'make_cert'),
    schema_cert: wasm.wrapper('assets/dct/schema_cert.js', 'schema_cert'),
    make_bundle: wasm.wrapper('assets/dct/make_bundle.js', 'make_bundle'),
    schema_dump: wasm.wrapper('assets/dct/schema_dump.js', 'schema_dump'),
  };

  return {
    schemaCompile: async (opts) => {
      requireProps('schemaCompile', opts, ['input']);

      const args = [];
      if (opts.quiet) args.push('-q');
      if (opts.verbose) args.push('-v');
      if (opts.debug) args.push('-d');
      if (opts.printDAG) args.push('-D');
      if (opts.version) args.push('-V');
      if (opts.output) args.push('-o', opts.output);
      args.push(opts.input);

      return await wasm.stdout(wrappers.schemaCompile, args);
    },

    schema_info: async (opts) => {
      requireProps('schema_info', opts, ['input']);

      const args = [];
      if (opts.c) args.push('-c');
      if (opts.t) args.push('-t');
      args.push(opts.input);
      if (opts.pubname) args.push(opts.pubname);

      return await wasm.stdout(wrappers.schema_info, args);
    },

    make_cert: async (opts) => {
      requireProps('make_cert', opts, ['name']);

      const args = [];
      if (opts.sigType) args.push('-s', opts.sigType);
      if (opts.output) args.push('-o', opts.output);
      args.push(opts.name);
      if (opts.signer) args.push(opts.signer);

      await wrappers.make_cert(args);
    },

    schema_cert: async (opts) => {
      requireProps('schema_cert', opts, ['input']);

      const args = [];
      if (opts.output) args.push('-o', opts.output);
      args.push(opts.input);
      if (opts.signer) args.push(opts.signer);

      await wrappers.schema_cert(args);
    },

    make_bundle: async (opts) => {
      requireProps('make_bundle', opts, ['input', 'output']);

      const args = [];
      if (opts.verbose) args.push('-v');
      args.push('-o', opts.output);
      args.push(...opts.input);

      await wrappers.make_bundle(args);
    },

    schema_dump: async (opts) => {
      requireProps('schema_dump', opts, ['input']);

      const args = [];
      args.push(opts.input);

      return await wasm.stdout(wrappers.schema_dump, args);
    },
  };
}

function requireProps<T>(name: string, obj: T, props: (keyof T)[]): void {
  for (const prop of props)
    if (obj[prop] === undefined)
      throw new Error(`Invalid Arguments (${name} requires ${String(prop)})`);
}