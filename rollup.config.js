import dts from "rollup-plugin-dts";

const config = [];

const files = [
  'src/app/user-types.ts',
];

files.forEach((f) => {
  const out = 'src/assets/' + (f.substr(0, f.length - 3) + '.d.ts').split('/').pop();

  config.push({
    input: f,
    output: [{ file: out, format: "es" }],
    plugins: [dts({
        respectExternal: true
    })],
  });
});

export default config;
