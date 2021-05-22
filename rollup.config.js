import dts from "rollup-plugin-dts";

const config = [
  {
    input: "src/app/user-types.ts",
    output: [{ file: "types.d.ts", format: "es" }],
    plugins: [dts({
        respectExternal: true
    })],
  },
];

export default config;
