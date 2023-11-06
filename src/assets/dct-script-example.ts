/**
 * This is an example of a DCT script that generates a set of bundles
 * for the Home IoT example. The script is run as a top-level async
 * function and each DCT call is awaited.
 */

// define any global variables
const devices = ["frontdoor", "backdoor", "gate", "patio"];
const operators = ["alice", "bob"];

// define filenames
const schema = "schema";
const rules = schema + ".rules";
const bschema = schema + ".scm";
const rootCert = schema + ".root";
const schemaCert = schema + ".schema";
const deviceSigner = rootCert;

// compile the schema
await DCT.schemaCompile({
    output: bschema,
    input: rules,
});

// extract the info needed to make certs from the compiled schema
const pub = await DCT.schema_info({ input: bschema });
const pubPrefix = await DCT.schema_info({ input: bschema, pubname: "#pubPrefix" });
const certValidator = await DCT.schema_info({ t: true, input: bschema, pubname: "#certValidator" });

// make root certificate
await DCT.make_cert({
    sigType: certValidator,
    output: rootCert,
    name: pubPrefix,
});

// make schema certificate
await DCT.schema_cert({
    output: schemaCert,
    input: bschema,
    signer: rootCert,
});

// make the device certs
for (const nm of devices) {
    await DCT.make_cert({
        sigType: certValidator,
        output: `${nm}.cert`,
        name: `${pubPrefix}/device/${nm}`,
        signer: deviceSigner,
    });
}

// make the operator certs
for (const nm of operators) {
    await DCT.make_cert({
        sigType: certValidator,
        output: `${nm}.cert`,
        name: `${pubPrefix}/operator/${nm}`,
        signer: rootCert,
    });
}

// make bundles for operators
for (const nm of operators) {
    await DCT.make_bundle({
        output: `${nm}.bundle`,
        input: [rootCert, schemaCert, `+${nm}.cert`],
    });
}

// visualize alice's bundle
visualize(WFS.readFile('alice.bundle'));