/// <reference types="emscripten" />
/// <reference types="node" />

import type * as asn1 from '@yoursunny/asn1';
import assert from 'minimalistic-assert';
import { DataSet } from './esm';
import type { DataStore } from '@ndn/repo-api';
import { Edge } from './esm';
import { EventEmitter } from '@angular/core';
import { IdType } from './esm';
import { Network } from './esm';
import { Node as Node_2 } from './esm';
import { TypedEventTarget } from 'typescript-event-target';
import type WsWebSocket from 'ws';

/** AES block size in octets. */
declare const AesBlockSize = 16;

/**
 * AES-CBC encryption algorithm.
 *
 * Initialization Vectors must be 16 octets.
 * During encryption, if IV is unspecified, it is randomly generated.
 * During decryption, quality of IV is not checked.
 */
declare const AESCBC: AesEncryption<{}, AESCBC.GenParams>;

declare namespace AESCBC {
    interface GenParams extends AesGenParams {
    }
}

/**
 * AES-CTR encryption algorithm.
 *
 * Initialization Vectors must be 16 octets.
 * During encryption, if IV is unspecified, it is constructed with two parts:
 * @li a 64-bit random number, generated each time a private key instance is constructed;
 * @li a 64-bit counter starting from zero.
 *
 * During decryption, quality of IV is not automatically checked.
 * Since the security of AES-CTR depends on having unique IVs, the application is recommended to
 * check IVs using CounterIvChecker type.
 */
declare const AESCTR: AesEncryption<AESCTR.Info, AESCTR.GenParams>;

declare namespace AESCTR {
    interface Info {
        /**
         * Specify number of bits in IV to use as counter.
         * This must be between 1 and 128. Default is 64.
         */
        counterLength: number;
    }
    type GenParams = AesGenParams & Partial<Info>;
}

declare interface AesEncryption<I, G extends AesGenParams> extends EncryptionAlgorithm<I, false, G> {
    readonly ivLength: number;
    makeAesKeyGenParams: (genParams: G) => AesKeyGenParams;
}

/**
 * AES-GCM encryption algorithm.
 *
 * Initialization Vectors must be 12 octets.
 * During encryption, if IV is unspecified, it is constructed with two parts:
 * @li a 64-bit random number, generated each time a private key instance is constructed;
 * @li a 32-bit counter starting from zero.
 *
 * During decryption, quality of IV is not automatically checked.
 * Since the security of AES-GCM depends on having unique IVs, the application is recommended to
 * check IVs using CounterIvChecker type.
 */
declare const AESGCM: AesEncryption<{}, AESGCM.GenParams>;

declare namespace AESGCM {
    interface GenParams extends AesGenParams {
    }
}

/** Key generation parameters. */
declare interface AesGenParams {
    length?: AesKeyLength;
    /** Import raw key bits instead of generating. */
    importRaw?: Uint8Array;
}

declare type AesKeyLength = 128 | 192 | 256;

declare namespace AesKeyLength {
    const Default: AesKeyLength;
    const Choices: readonly AesKeyLength[];
}

/** Print Generic, ImplicitDigest, ParamsDigest in alternate URI syntax. */
declare const AltUri: AltUriConverter;

/**
 * Functions to print and parse names in alternate/pretty URI syntax.
 *
 * This class is constructed with a sequence of NamingConventions. Each component is matched
 * against these conventions in order, and the first matching convention can determine how to
 * print that component in an alternate URI syntax, if available.
 *
 * Other than pre-constructed 'AltUri' instances exported by this and naming convention packages,
 * you may construct an instance with only the naming conventions you have adopted, so that a
 * component that happens to match a convention that your application did not adopt is not
 * mistakenly interpreted with that convention.
 */
declare class AltUriConverter {
    readonly conventions: ReadonlyArray<NamingConvention<any> & NamingConvention.WithAltUri>;
    constructor(conventions: ReadonlyArray<NamingConvention<any> & NamingConvention.WithAltUri>);
    /** Print component in alternate URI syntax */
    readonly ofComponent: (comp: Component) => string;
    /** Print name in alternate URI syntax. */
    readonly ofName: (name: Name) => string;
    /** Parse component from alternate URI syntax */
    readonly parseComponent: (input: string) => Component;
    /** Parse name from alternate URI syntax. */
    readonly parseName: (input: string) => Name;
}

/** Convert ArrayBuffer or ArrayBufferView to DataView. */
declare function asDataView(a: BufferSource): DataView;

/** Convert ArrayBuffer or ArrayBufferView to Uint8Array. */
declare function asUint8Array(a: BufferSource): Uint8Array;

/** A Bloom filter. */
declare class BloomFilter {
    private readonly m;
    /**
     * Construct a Bloom filter.
     * @param p algorithm parameter.
     * @param wire decode from serialized wire encoding.
     * @returns a Promise that resolves to BloomFilter instance.
     */
    static create(p: Parameters_2, wire?: Uint8Array): Promise<BloomFilter>;
    /** Dispose this instance to prevent memory leak. */
    dispose(): void;
    /** Clear the Bloom filter. */
    clear(): void;
    /** Insert a value to the Bloom filter. */
    insert(s: string | Uint8Array): void;
    /** Determine whether the Bloom filter probably contains a value. */
    contains(s: string | Uint8Array): boolean;
    /** Serialize the Bloom filter. */
    encode(): Uint8Array;
    private constructor();
    private readonly c;
    private disposed;
    private throwIfDisposed;
    private readonly hashFunction;
}

declare interface BloomFilter extends Readonly<Parameters_2> {
}

/**
 * NDN Certificate v2.
 * This type is immutable.
 */
declare class Certificate {
    readonly data: Data;
    readonly validity: ValidityPeriod;
    static fromData(data: Data): Certificate;
    private constructor();
    get name(): Name;
    get issuer(): Name | undefined;
    get isSelfSigned(): boolean;
    /** Ensure certificate is within validity period. */
    checkValidity(now?: ValidityPeriod.TimestampInput): void;
    /** Public key in SubjectPublicKeyInfo (SPKI) binary format. */
    get publicKeySpki(): Uint8Array;
    /** Import SPKI as public key. */
    importPublicKey<I, A extends CryptoAlgorithm<I>>(algoList: readonly A[]): Promise<[A, CryptoAlgorithm.PublicKey<I>]>;
}

declare namespace Certificate {
    interface BuildOptions {
        /** Certificate name. */
        name: Name;
        /** Certificate packet FreshnessPeriod, default is 1 hour. */
        freshness?: number;
        /** ValidityPeriod. */
        validity: ValidityPeriod;
        /** Public key in SubjectPublicKeyInfo (SPKI) binary format. */
        publicKeySpki: Uint8Array;
        /** Issuer signing key. */
        signer: Signer;
    }
    /** Build a certificate from fields. */
    function build({ name, freshness, validity, publicKeySpki, signer, }: BuildOptions): Promise<Certificate>;
    interface IssueOptions {
        /** Certificate packet FreshnessPeriod, default is 1 hour. */
        freshness?: number;
        /** ValidityPeriod. */
        validity: ValidityPeriod;
        /** IssuerId in certificate name. */
        issuerId: Component;
        /** Issuer signing key. */
        issuerPrivateKey: Signer;
        /** Public key to appear in certificate. */
        publicKey: PublicKey;
    }
    /** Create a certificated signed by issuer. */
    function issue(opts: IssueOptions): Promise<Certificate>;
    interface SelfSignOptions {
        /** Certificate packet FreshnessPeriod, default is 1 hour. */
        freshness?: number;
        /** ValidityPeriod, default is maximum validity. */
        validity?: ValidityPeriod;
        /** Private key corresponding to public key. */
        privateKey: NamedSigner;
        /** Public key to appear in certificate. */
        publicKey: PublicKey;
    }
    /** Create a self-signed certificate. */
    function selfSign(opts: SelfSignOptions): Promise<Certificate>;
}

declare interface CertNameFields extends KeyNameFields {
    issuerId: Component;
    version: Component;
    keyName: Name;
}

declare namespace CertNaming {
    export {
        toSubjectName,
        isKeyName,
        parseKeyName,
        toKeyName,
        makeKeyName,
        isCertName,
        parseCertName,
        makeCertName,
        KEY,
        ISSUER_DEFAULT,
        ISSUER_SELF,
        KeyNameFields,
        CertNameFields
    }
}

/** KV store of certificates. */
declare class CertStore extends StoreBase<StoredCert> {
    get(name: Name): Promise<Certificate>;
    insert(cert: Certificate): Promise<void>;
}

declare interface Closer {
    close: () => void;
}

/** A list of objects that can be closed or destroyed. */
declare class Closers extends Array {
    /** Close all objects in reverse order and clear the list. */
    close: () => void;
    /** Schedule a timeout or interval to be canceled via .close(). */
    addTimeout<T extends NodeJS.Timeout | number>(t: T): T;
    /** Wait for close. */
    wait(): Promise<void>;
}

/**
 * Name component.
 * This type is immutable.
 */
declare class Component {
    static decodeFrom(decoder: Decoder): Component;
    /** Parse from URI representation, or return existing Component. */
    static from(input: ComponentLike): Component;
    /** Whole TLV. */
    readonly tlv: Uint8Array;
    /** TLV-TYPE. */
    readonly type: number;
    /** TLV-VALUE. */
    readonly value: Uint8Array;
    /** TLV-LENGTH. */
    get length(): number;
    /** TLV-VALUE interpreted as UTF-8 string. */
    get text(): string;
    /**
     * Construct from TLV-TYPE and TLV-VALUE.
     * @param type TLV-TYPE, default is GenericNameComponent.
     * @param value TLV-VALUE; if specified as string, it's encoded as UTF-8 but not interpreted
     *              as URI representation. Use from() to interpret URI.
     */
    constructor(type?: number, value?: Uint8Array | string);
    /** Construct from TLV. */
    constructor(tlv: Uint8Array);
    /** Get URI string. */
    toString(): string;
    encodeTo(encoder: Encoder): void;
    /** Determine if component follows a naming convention. */
    is(convention: NamingConvention<any>): boolean;
    /** Convert with naming convention. */
    as<R>(convention: NamingConvention<any, R>): R;
    /** Compare this component with other. */
    compare(other: ComponentLike): Component.CompareResult;
    /** Determine if this component equals other. */
    equals(other: ComponentLike): boolean;
}

declare namespace Component {
    /** Component compare result. */
    enum CompareResult {
        /** lhs is less than rhs */
        LT = -2,
        /** lhs and rhs are equal */
        EQUAL = 0,
        /** lhs is greater than rhs */
        GT = 2
    }
}

/** Name component or component URI. */
declare type ComponentLike = Component | string;

declare interface Compression {
    compress: (input: Uint8Array) => Uint8Array;
    decompress: (compressed: Uint8Array) => Uint8Array;
}

/** Concatenate Uint8Arrays. */
declare function concatBuffers(arr: readonly Uint8Array[], totalLength?: number): Uint8Array;

/** Console on stderr. */
declare const console_2: Console;

/**
 * Progress of Data retrieval.
 *
 * This is a Promise that resolves with the retrieved Data and rejects upon timeout,
 * annotated with the Interest and some counters.
 */
declare interface ConsumerContext extends Promise<Data> {
    readonly interest: Interest;
    readonly nRetx: number;
}

declare interface ConsumerOptions {
    /** Description for debugging purpose. */
    describe?: string;
    /** AbortSignal that allows canceling the Interest via AbortController. */
    signal?: AbortSignal;
    /**
     * Modify Interest according to specified options.
     * Default is no modification.
     */
    modifyInterest?: Interest.Modify;
    /**
     * Retransmission policy.
     * Default is disabling retransmission.
     */
    retx?: RetxPolicy;
    /**
     * Data verifier.
     * Default is no verification.
     */
    verifier?: Verifier;
}

/** Check IVs of fixed+random+counter structure to detect duplication. */
declare class CounterIvChecker extends IvChecker {
    constructor(opts: CounterIvChecker.Options);
    private readonly fixedMask;
    private readonly randomMask;
    private readonly counterMask;
    private readonly fixed;
    private readonly requireSameRandom;
    private lastRandom?;
    private readonly ci;
    extract(iv: Uint8Array): {
        fixed: bigint;
        random: bigint;
        counter: bigint;
    };
    protected check(iv: Uint8Array, plaintextLength: number, ciphertextLength: number): void;
}

declare namespace CounterIvChecker {
    interface Options extends CounterIvOptions {
        /**
         * If true, all IVs must have the same bits in the random portion.
         * @default false
         */
        requireSameRandom?: boolean;
    }
}

/** IV generator using fixed+random+counter structure. */
declare class CounterIvGen extends IvGen {
    constructor(opts: CounterIvGen.Options);
    private readonly ivPrefix;
    private readonly ci;
    protected generate(): Uint8Array;
    protected update(plaintextLength: number, ciphertextLength: number): void;
}

declare namespace CounterIvGen {
    interface Options extends CounterIvOptions {
    }
}

/**
 * Options for Initialization Vectors using fixed+random+counter structure.
 *
 * IVs following this construction method have three parts:
 * @li fixed bits, specified in options.
 * @li random bits, different for each key and in each session.
 * @li counter bits, monotonically increasing for each plaintext/ciphertext block.
 */
declare interface CounterIvOptions {
    /** IV length in octets. */
    ivLength: number;
    /**
     * Number of fixed bits.
     * @default 0
     */
    fixedBits?: number;
    /**
     * Fixed portion.
     * Required if fixedBits is positive.
     * This may be specified as a bigint or a Uint8Array.
     * If it's a Uint8Array, it must have fixedBits bits.
     * The least significant bits are taken.
     */
    fixed?: bigint | Uint8Array;
    /** Number of counter bits. */
    counterBits: number;
    /**
     * Crypto algorithm block size in octets.
     * If plaintext and ciphertext have different lengths, the longer length is considered.
     */
    blockSize: number;
}

/** Create a plain decrypter from crypto key. */
declare function createDecrypter<I>(algo: EncryptionAlgorithm<I>, key: CryptoAlgorithm.PrivateSecretKey<I>): LLDecrypt.Key;

/** Create a named decrypter from crypto key. */
declare function createDecrypter<I, Asym extends boolean>(name: Name, algo: EncryptionAlgorithm<I, Asym>, key: CryptoAlgorithm.PrivateSecretKey<I>): NamedDecrypter<Asym>;

/** Create a plain encrypter from crypto key. */
declare function createEncrypter<I>(algo: EncryptionAlgorithm<I>, key: CryptoAlgorithm.PublicSecretKey<I>): LLEncrypt.Key;

/** Create a named encrypter from crypto key. */
declare function createEncrypter<I, Asym extends boolean>(name: Name, algo: EncryptionAlgorithm<I, Asym>, key: CryptoAlgorithm.PublicSecretKey<I>): NamedEncrypter<Asym>;

/** Create a named encrypter from certificate public key. */
declare function createEncrypter(cert: Certificate, opts?: createEncrypter.ImportCertOptions): Promise<NamedEncrypter.PublicKey>;

declare namespace createEncrypter {
    /** createEncrypter options when importing public key from a certificate. */
    interface ImportCertOptions {
        /**
         * List of recognized algorithms.
         * Default is EncryptionAlgorithmListSlim.
         * Use EncryptionAlgorithmListFull for all algorithms, at the cost of larger bundle size.
         */
        algoList?: readonly EncryptionAlgorithm[];
        /**
         * Whether to check certificate ValidityPeriod.
         * Default is true, which throws an error if current timestamp is not within ValidityPeriod.
         */
        checkValidity?: boolean;
        /**
         * Current timestamp for checking ValidityPeriod.
         * Default is Date.now().
         */
        now?: ValidityPeriod.TimestampInput;
    }
}

/** Create a plain signer from crypto key. */
declare function createSigner<I>(algo: SigningAlgorithm<I>, key: CryptoAlgorithm.PrivateSecretKey<I>): Signer;

/** Create a named signer from crypto key. */
declare function createSigner<I, Asym extends boolean>(name: Name, algo: SigningAlgorithm<I, Asym>, key: CryptoAlgorithm.PrivateSecretKey<I>): NamedSigner<Asym>;

/** Create a plain verifier from crypto key. */
declare function createVerifier<I>(algo: SigningAlgorithm<I>, key: CryptoAlgorithm.PublicSecretKey<I>): Verifier;

/** Create a named verifier from crypto key. */
declare function createVerifier<I, Asym extends boolean>(name: Name, algo: SigningAlgorithm<I, Asym>, key: CryptoAlgorithm.PublicSecretKey<I>): NamedVerifier<Asym>;

/** Create a named verifier from certificate public key. */
declare function createVerifier(cert: Certificate, opts?: createVerifier.ImportCertOptions): Promise<NamedVerifier.PublicKey>;

declare namespace createVerifier {
    /** createVerifier options when importing public key from a certificate. */
    interface ImportCertOptions {
        /**
         * List of recognized algorithms.
         * Default is SigningAlgorithmListSlim.
         * Use SigningAlgorithmListFull for all algorithms, at the cost of larger bundle size.
         */
        algoList?: readonly SigningAlgorithm[];
        /**
         * Whether to check certificate ValidityPeriod.
         * Default is true, which throws an error if current timestamp is not within ValidityPeriod.
         */
        checkValidity?: boolean;
        /**
         * Current timestamp for checking ValidityPeriod.
         * Default is Date.now().
         */
        now?: ValidityPeriod.TimestampInput;
    }
}

/** Web Crypto API. */
declare const crypto_2: Crypto;

/** WebCrypto based algorithm implementation. */
declare interface CryptoAlgorithm<I = any, Asym extends boolean = any, G = any> {
    /**
     * Identifies an algorithm in storage.
     * This should be changed when the serialization format changes.
     */
    readonly uuid: string;
    readonly keyUsages: If<Asym, Record<"private" | "public", readonly KeyUsage[]>, Record<"secret", readonly KeyUsage[]>, {}>;
    /** Generate key pair or secret key. */
    cryptoGenerate: (params: G, extractable: boolean) => Promise<If<Asym, CryptoAlgorithm.GeneratedKeyPair<I>, CryptoAlgorithm.GeneratedSecretKey<I>, never>>;
    /**
     * Import public key from SPKI.
     *
     * This should only appear on asymmetric algorithm.
     */
    importSpki?: (spki: Uint8Array, der: asn1.ElementBuffer) => Promise<CryptoAlgorithm.PublicKey<I>>;
}

declare namespace CryptoAlgorithm {
    function isAsym<I, G>(algo: CryptoAlgorithm<I, any, G>): algo is CryptoAlgorithm<I, true, G>;
    function isSym<I, G>(algo: CryptoAlgorithm<I, any, G>): algo is CryptoAlgorithm<I, false, G>;
    function isSigning<I, Asym extends boolean = any, G = any>(algo: CryptoAlgorithm<I, Asym, G>): algo is SigningAlgorithm<I, Asym, G>;
    function isEncryption<I, Asym extends boolean = any, G = any>(algo: CryptoAlgorithm<I, Asym, G>): algo is EncryptionAlgorithm<I, Asym, G>;
    interface PrivateKey<I = any> {
        privateKey: CryptoKey;
        info: I;
    }
    interface PublicKey<I = any> {
        publicKey: CryptoKey;
        spki: Uint8Array;
        info: I;
    }
    interface SecretKey<I = any> {
        secretKey: CryptoKey;
        info: I;
    }
    type PrivateSecretKey<I = any, Asym extends boolean = any> = If<Asym, PrivateKey<I>, SecretKey<I>>;
    type PublicSecretKey<I = any, Asym extends boolean = any> = If<Asym, PublicKey<I>, SecretKey<I>>;
    interface GeneratedKeyPair<I = any> extends PrivateKey<I>, PublicKey<I> {
        jwkImportParams: AlgorithmIdentifier;
    }
    interface GeneratedSecretKey<I = any> extends SecretKey<I> {
        jwkImportParams: AlgorithmIdentifier;
    }
}

/**
 * A full list of crypto algorithms.
 * This list encompasses SigningAlgorithmListFull and EncryptionAlgorithmListFull.
 */
declare const CryptoAlgorithmListFull: readonly CryptoAlgorithm[];

/**
 * A slim list of crypto algorithms.
 * This list encompasses SigningAlgorithmListSlim and EncryptionAlgorithmListSlim.
 * If you need more algorithms, explicitly import them or use CryptoAlgorithmListFull.
 */
declare const CryptoAlgorithmListSlim: readonly CryptoAlgorithm[];

declare const ctorAssign: unique symbol;

declare const ctorAssign_2: unique symbol;

declare const ctorAssign_3: unique symbol;

declare interface CtorTag {
    [ctorAssign]: (si: SigInfo) => void;
}

declare interface CtorTag_2 {
    [ctorAssign_2]: (f: Fields_2) => void;
}

declare interface CtorTag_3 {
    [ctorAssign_3]: (f: Fields) => void;
}

/** CustomEvent object. */
declare const CustomEvent_2: typeof globalThis["CustomEvent"];

/** Data packet. */
declare class Data implements LLSign.Signable, LLVerify.Verifiable, Signer.Signable, Verifier.Verifiable {
    /**
     * Construct from flexible arguments.
     *
     * Arguments can include, in any order unless otherwise specified:
     * - Data to copy from
     * - Name or name URI
     * - Data.ContentType(v)
     * - Data.FreshnessPeriod(v)
     * - Data.FinalBlock (must appear after Name)
     * - Uint8Array as Content
     */
    constructor(...args: Array<Data | Data.CtorArg>);
    readonly [FIELDS]: Fields;
    static decodeFrom(decoder: Decoder): Data;
    encodeTo(encoder: Encoder): void;
    private encodeSignedPortion;
    /** Return the implicit digest if it's already computed. */
    getImplicitDigest(): Uint8Array | undefined;
    /** Compute the implicit digest. */
    computeImplicitDigest(): Promise<Uint8Array>;
    /** Return the full name if the implicit digest is already computed. */
    getFullName(): Name | undefined;
    /** Compute the full name (name plus implicit digest). */
    computeFullName(): Promise<Name>;
    /**
     * Determine if a Data can satisfy an Interest.
     * @param isCacheLookup if true, Data with zero FreshnessPeriod cannot satisfy Interest with MustBeFresh;
     *                      if false, this check does not apply.
     * @returns a Promise that will be resolved with the result.
     */
    canSatisfy(interest: Interest, { isCacheLookup }?: Data.CanSatisfyOptions): Promise<boolean>;
    [LLSign.OP](sign: LLSign): Promise<void>;
    [LLVerify.OP](verify: LLVerify): Promise<void>;
}

declare interface Data extends PublicFields_2 {
}

declare namespace Data {
    /** Constructor argument to set ContentType field. */
    function ContentType(v: number): CtorTag_3;
    /** Constructor argument to set FreshnessPeriod field. */
    function FreshnessPeriod(v: number): CtorTag_3;
    /** Constructor argument to set the current packet as FinalBlock. */
    const FinalBlock: unique symbol;
    /** Constructor argument. */
    type CtorArg = NameLike | CtorTag_3 | typeof FinalBlock | Uint8Array;
    /** Data.canSatisfy options. */
    interface CanSatisfyOptions {
        /**
         * Whether the Interest-Data matching is in the context of cache lookup.
         * If true, Data with zero FreshnessPeriod cannot satisfy Interest with MustBeFresh.
         * If false, this check does not apply.
         * @default false
         */
        isCacheLookup?: boolean;
    }
}

/** Outgoing Data buffer for producer. */
declare interface DataBuffer {
    find: (interest: Interest) => Promise<Data | undefined>;
    insert: (...pkts: Data[]) => Promise<void>;
}

/** Prototype of DataStore from @ndn/repo package. */
declare interface DataStore_2 {
    find: (interest: Interest) => Promise<Data | undefined>;
    insert: (opts: {
        expireTime?: number;
    }, ...pkts: Data[]) => Promise<void>;
}

/**
 * DataBuffer implementation based on DataStore from @ndn/repo package.
 *
 * @example
 * new DataStoreBuffer(new DataStore(memdown()))
 */
declare class DataStoreBuffer implements DataBuffer {
    readonly store: DataStore_2;
    constructor(store: DataStore_2, { ttl, dataSigner, }?: DataStoreBuffer.Options);
    private readonly ttl;
    private readonly dataSigner?;
    find(interest: Interest): Promise<Data | undefined>;
    insert(...pkts: Data[]): Promise<void>;
}

declare namespace DataStoreBuffer {
    interface Options {
        /** Data expiration time. Default is 60000ms. 0 means infinity. */
        ttl?: number;
        /** If specified, automatically sign Data packets unless already signed. */
        dataSigner?: Signer;
    }
}

declare interface DCT {
    /** Compile a trust schema. */
    schemaCompile: (opts: {
        /** input file */
        input: string;
        /** output file */
        output?: string;
        /** quiet (no diagnostic output) */
        quiet?: boolean;
        /** increase diagnostic level */
        verbose?: boolean;
        /** debug (highest diagnostic level) */
        debug?: boolean;
        /** print schema's cert DAG then exit */
        printDAG?: boolean;
        /** print compiler version and exit */
        version?: boolean;
    }) => Promise<string>;
    /** Get information about a trust schema. */
    schema_info: (opts: {
        /** input binary schema */
        input: string;
        /** pass option -c */
        c?: boolean;
        /** pass option -t */
        t?: boolean;
        /** publication name */
        pubname?: string;
    }) => Promise<string>;
    /** Generate a self-signed certificate. */
    make_cert: (opts: {
        /** Type of signature (e.g. EdDSA) */
        sigType?: string;
        /** Output file */
        output?: string;
        /** Name of certificate */
        name: string;
        /** Signer of cert */
        signer?: string;
    }) => Promise<void>;
    /** Sign a schema to create a schema certificate */
    schema_cert: (opts: {
        /** Output file */
        output?: string;
        /** Input schema file */
        input: string;
        /** Schema signer */
        signer?: string;
    }) => Promise<void>;
    make_bundle: (opts: {
        /** Increase output level */
        verbose?: boolean;
        /** Output file */
        output: string;
        /** Input files */
        input: string[];
    }) => Promise<void>;
    schema_dump: (opts: {
        input: string;
    }) => Promise<string>;
}

declare interface DebugEntry {
    action: string;
    ownIblt: IBLT;
    recvIblt?: IBLT;
    state?: PSyncCore.State;
}

declare interface DebugEntry_2 {
    action: string;
    interestName?: Name;
}

declare interface DebugEntry_3 {
    action: string;
}

declare interface DebugEntry_4 {
    action: string;
    own: Record<string, number>;
    recv?: Record<string, number>;
    state: string;
    nextState?: string;
    ourOlder?: number;
    ourNewer?: number;
}

declare interface DebugEntry_5 {
    action: string;
    key?: number;
    name?: Name;
    ownIblt: IBLT;
    recvIblt?: IBLT;
    content?: Name[];
}

declare interface Decodable<R> {
    decodeFrom: (decoder: Decoder) => R;
}

/** TLV decoder. */
declare class Decoder {
    private readonly input;
    /** Determine whether end of input has been reached. */
    get eof(): boolean;
    private readonly dv;
    private offset;
    constructor(input: Uint8Array);
    /** Read TLV structure. */
    read(): Decoder.Tlv;
    /** Read a Decodable object. */
    decode<R>(d: Decodable<R>): R;
    private readVarNum;
}

declare namespace Decoder {
    /** Decoded TLV. */
    interface Tlv {
        /** TLV-TYPE. */
        readonly type: number;
        /** TLV-LENGTH. */
        readonly length: number;
        /** TLV-VALUE. */
        readonly value: Uint8Array;
        /** TLV buffer. */
        readonly tlv: Uint8Array;
        /** Size of TLV. */
        readonly size: number;
        /** TLV as decoder. */
        readonly decoder: Decoder;
        /** TLV-VALUE as decoder. */
        readonly vd: Decoder;
        /** TLV-VALUE as non-negative integer. */
        readonly nni: number;
        /** TLV-VALUE as non-negative integer bigint. */
        readonly nniBig: bigint;
        /** TLV-VALUE as UTF-8 string. */
        readonly text: string;
        /** Siblings before this TLV. */
        readonly before: Uint8Array;
        /** Siblings after this TLV. */
        readonly after: Uint8Array;
    }
}

/**
 * High level decrypter.
 *
 * This captures both the decryption key and the wire format of encrypted content.
 */
declare interface Decrypter<T = Data> {
    /** Decrypt a packet. The packet is modified in-place. */
    decrypt: (pkt: T) => Promise<void>;
}

declare class DefaultServers {
    private nfw;
    /** Server for ping */
    private pingServer?;
    /** Server for certificates */
    private certServer?;
    constructor(nfw: NFW);
    restart(): void;
    private setupPingServer;
    private setupCertServer;
}

/** Make a Promise that resolves after specified duration. */
declare const delay: <T = void>(after: number, value?: T) => Promise<T>;

declare class DigestComp implements NamingConvention<Uint8Array>, NamingConvention.WithAltUri {
    private readonly tt;
    private readonly altUriPrefix;
    private readonly altUriRegex;
    constructor(tt: number, altUriPrefix: string);
    match(comp: Component): boolean;
    create(v: Uint8Array): Component;
    parse(comp: Component): Uint8Array;
    toAltUri(comp: Component): string;
    fromAltUri(input: string): Component | undefined;
}

/** Signer and Verifier for SigType.Sha256 digest. */
declare const digestSigning: Signer & Verifier;

declare type EcCurve = keyof typeof PointSizes;

declare namespace EcCurve {
    const Default: EcCurve;
    const Choices: readonly ("P-256" | "P-384" | "P-521")[];
}

/** Sha256WithEcdsa signing algorithm. */
declare const ECDSA: SigningAlgorithm<ECDSA.Info, true, ECDSA.GenParams>;

declare namespace ECDSA {
    /** Key generation parameters. */
    interface GenParams {
        /** Pick EC curve. Default is P-256. */
        curve?: EcCurve;
        /** Import PKCS#8 private key and SPKI public key instead of generating. */
        importPkcs8?: [pkcs8: Uint8Array, spki: Uint8Array];
    }
    interface Info {
        curve: EcCurve;
    }
}

/** Ed25519 signing algorithm. */
declare const Ed25519: SigningAlgorithm<{}, true, {}>;

declare namespace Ed25519 {
    type GenParams = EdGenParams;
}

/** Key generation parameters. */
declare interface EdGenParams {
    /** Import PKCS#8 private key and SPKI public key instead of generating. */
    importPkcs8?: [pkcs8: Uint8Array, spki: Uint8Array];
}

/** An object acceptable to Encoder.encode(). */
declare type Encodable = Uint8Array | undefined | false | EncodableObj | EncodableTlv;

/** An object that knows how to prepend itself to an Encoder. */
declare interface EncodableObj {
    encodeTo: (encoder: Encoder) => void;
}

/**
 * An encodable TLV structure.
 *
 * First item is a number for TLV-TYPE.
 * Optional second item could be OmitEmpty to omit the TLV if TLV-VALUE is empty.
 * Subsequent items are Encodables for TLV-VALUE.
 */
declare type EncodableTlv = [number, ...Encodable[]] | [number, typeof Encoder.OmitEmpty, ...Encodable[]];

/** TLV encoder that accepts objects in reverse order. */
declare class Encoder {
    private buf;
    private off;
    /** Return encoding output size. */
    get size(): number;
    /** Obtain encoding output. */
    get output(): Uint8Array;
    constructor(initSize?: number);
    /** Obtain part of encoding output. */
    slice(start?: number, length?: number): Uint8Array;
    /**
     * Make room to prepend an object.
     * @param sizeofObject object size.
     * @returns room to write object.
     */
    prependRoom(sizeofObject: number): Uint8Array;
    /** Prepend TLV-TYPE and TLV-LENGTH. */
    prependTypeLength(tlvType: number, tlvLength: number): void;
    /** Prepend TLV-VALUE. */
    prependValue(...tlvValue: Encodable[]): void;
    /** Prepend TLV structure. */
    prependTlv(tlvType: number, ...tlvValue: Encodable[]): void;
    /** Prepend TLV structure, but skip if TLV-VALUE is empty. */
    prependTlv(tlvType: number, omitEmpty: typeof Encoder.OmitEmpty, ...tlvValue: Encodable[]): void;
    /** Prepend an Encodable object. */
    encode(obj: Encodable | readonly Encodable[]): void;
    private grow;
}

declare namespace Encoder {
    const OmitEmpty: unique symbol;
    /** Encode a single object into Uint8Array. */
    function encode(obj: Encodable | readonly Encodable[], initBufSize?: number): Uint8Array;
    /** Extract the encoding output of an element while writing to a larger encoder. */
    function extract(obj: Encodable | readonly Encodable[], cb: (output: Uint8Array) => void): Encodable;
}

/**
 * High level encrypter.
 *
 * This captures both the encryption key and the wire format of encrypted content.
 */
declare interface Encrypter<T = Data> {
    /** Encrypt a packet. The packet is modified in-place. */
    encrypt: (pkt: T) => Promise<void>;
}

/** WebCrypto based encryption algorithm implementation. */
declare interface EncryptionAlgorithm<I = any, Asym extends boolean = any, G = any> extends CryptoAlgorithm<I, Asym, G> {
    makeLLEncrypt: If<Asym, (key: CryptoAlgorithm.PublicKey<I>) => LLEncrypt, (key: CryptoAlgorithm.SecretKey<I>) => LLEncrypt, unknown>;
    makeLLDecrypt: If<Asym, (key: CryptoAlgorithm.PrivateKey<I>) => LLDecrypt, (key: CryptoAlgorithm.SecretKey<I>) => LLDecrypt, unknown>;
}

/**
 * A full list of encryption algorithms.
 * This list currently contains AES-CBC, AES-CTR, AES-GCM, and RSA-OAEP.
 */
declare const EncryptionAlgorithmListFull: readonly EncryptionAlgorithm[];

/**
 * A slim list of encryption algorithms.
 * This list is currently empty.
 * If you need more algorithms, explicitly import them or use EncryptionAlgorithmListFull.
 */
declare const EncryptionAlgorithmListSlim: readonly EncryptionAlgorithm[];

declare type EncryptionOptG<I, Asym extends boolean, G> = {} extends G ? [EncryptionAlgorithm<I, Asym, G>, G?] : [EncryptionAlgorithm<I, Asym, G>, G];

/**
 * Endpoint is the main entry point for an application to interact with the forwarding plane.
 * It provides basic consumer and producer functionality.
 */
declare class Endpoint {
    readonly opts: Options_2;
    readonly fw: Forwarder;
    constructor(opts?: Options_2);
}

declare interface Endpoint extends EndpointConsumer, EndpointProducer {
}

declare namespace Endpoint {
    /** Delete default Forwarder instance (mainly for unit testing). */
    const deleteDefaultForwarder: typeof Forwarder.deleteDefault;
    type RouteAnnouncement = EndpointProducer.RouteAnnouncement;
}

declare namespace endpoint {
    export {
        RetxOptions,
        RetxPolicy,
        ConsumerContext,
        ConsumerOptions,
        DataBuffer,
        DataStoreBuffer,
        ProducerHandler,
        ProducerOptions,
        Producer,
        Options_2 as Options,
        Endpoint
    }
}
export { endpoint }

/** Consumer functionality of Endpoint. */
declare class EndpointConsumer {
    fw: Forwarder;
    opts: ConsumerOptions;
    /** Consume a single piece of Data. */
    consume(interestInput: Interest | NameLike, opts?: ConsumerOptions): ConsumerContext;
}

/** Producer functionality of Endpoint. */
declare class EndpointProducer {
    fw: Forwarder;
    opts: ProducerOptions;
    /**
     * Start a producer.
     * @param prefixInput prefix registration; if undefined, prefixes may be added later.
     * @param handler function to handle incoming Interest.
     */
    produce(prefixInput: NameLike | undefined, handler: ProducerHandler, opts?: ProducerOptions): Producer;
}

declare namespace EndpointProducer {
    type RouteAnnouncement = FwFace.RouteAnnouncement;
}

/** TLV-VALUE decoder that understands Packet Format v0.3 evolvability guidelines. */
declare class EvDecoder<T> {
    private readonly typeName;
    private readonly topTT;
    private readonly rules;
    private readonly requiredTT;
    private nextOrder;
    private isCritical;
    private unknownHandler?;
    /** Callbacks before decoding TLV-VALUE. */
    readonly beforeObservers: Array<EvDecoder.TlvObserver<T>>;
    /** Callbacks after decoding TLV-VALUE. */
    readonly afterObservers: Array<EvDecoder.TlvObserver<T>>;
    /**
     * Constructor.
     * @param typeName type name, used in error messages.
     * @param topTT if specified, check top-level TLV-TYPE to be in this list.
     */
    constructor(typeName: string, topTT?: number | readonly number[]);
    /**
     * Add a decoding rule.
     * @param tt TLV-TYPE to match this rule.
     * @param cb callback or nested EvDecoder to handle element TLV.
     * @param options additional rule options.
     */
    add(tt: number, cb: EvDecoder.ElementDecoder<T> | EvDecoder<T>, { order, required, repeat, }?: Partial<EvDecoder.RuleOptions>): this;
    /** Set callback to determine whether TLV-TYPE is critical. */
    setIsCritical(cb: EvDecoder.IsCritical): this;
    /** Set callback to handle unknown elements. */
    setUnknown(cb: EvDecoder.UnknownElementHandler<T>): this;
    /** Decode TLV to target object. */
    decode<R extends T = T>(target: R, decoder: Decoder): R;
    /** Decode TLV-VALUE to target object. */
    decodeValue<R extends T = T>(target: R, vd: Decoder): R;
    private decodeV;
    private handleUnrecognized;
}

declare namespace EvDecoder {
    /** Invoked when a matching TLV element is found. */
    type ElementDecoder<T> = (target: T, tlv: Decoder.Tlv) => void;
    interface RuleOptions {
        /**
         * Expected order of appearance.
         * When using this option, it should be specified for all rules in a EvDecoder.
         * Default to the order in which rules were added to EvDecoder.
         */
        order: number;
        /**
         * Whether TLV element must appear at least once.
         * Default is false.
         */
        required: boolean;
        /**
         * Whether TLV element may appear more than once.
         * Default is false.
         */
        repeat: boolean;
    }
    /**
     * Invoked when a TLV element does not match any rule.
     * 'order' denotes the order number of last recognized TLV element.
     * Return true if this TLV element is accepted, or false to follow evolvability guidelines.
     */
    type UnknownElementHandler<T> = (target: T, tlv: Decoder.Tlv, order: number) => boolean;
    /**
     * Function to determine whether a TLV-TYPE number is "critical".
     * Unrecognized or out-of-order TLV element with a critical TLV-TYPE number causes decoding error.
     */
    type IsCritical = (tt: number) => boolean;
    /**
     * Callback before or after decoding TLV-VALUE.
     * @param target target object.
     * @param topTlv top-level TLV element, available in EVD.decode but unavailable in EVD.decodeValue.
     */
    type TlvObserver<T> = (target: T, topTlv?: Decoder.Tlv) => void;
}

declare type EventMap = {
    [key: string]: (...args: any[]) => void
}

declare type EventMap_2 = {
    /** Emitted before adding face. */
    faceadd: Forwarder.FaceEvent;
    /** Emitted after removing face. */
    facerm: Forwarder.FaceEvent;
    /** Emitted before adding prefix to face. */
    prefixadd: Forwarder.PrefixEvent;
    /** Emitted after removing prefix from face. */
    prefixrm: Forwarder.PrefixEvent;
    /** Emitted before advertising prefix. */
    annadd: Forwarder.AnnouncementEvent;
    /** Emitted before withdrawing prefix. */
    annrm: Forwarder.AnnouncementEvent;
    /** Emitted after packet arrival. */
    pktrx: Forwarder.PacketEvent;
    /** Emitted before packet transmission. */
    pkttx: Forwarder.PacketEvent;
};

declare type EventMap_3 = {
    /** Emitted upon face is up as reported by lower layer. */
    up: Event;
    /** Emitted upon face is down as reported by lower layer. */
    down: Event;
    /** Emitted upon face is closed. */
    close: Event;
};

declare type EventMap_4 = {
    /** Emitted upon face state change. */
    state: L3Face.StateEvent;
    /** Emitted upon state becomes UP. */
    up: Event;
    /** Emitted upon state becomes DOWN. */
    down: CustomEvent<Error>;
    /** Emitted upon state becomes CLOSED. */
    close: Event;
    /** Emitted upon RX decoding error. */
    rxerror: CustomEvent<L3Face.RxError>;
    /** Emitted upon TX preparation error. */
    txerror: CustomEvent<L3Face.TxError>;
};

declare type Events = SyncProtocol.Events<Name> & {
    debug: (entry: DebugEntry) => void;
};

declare type Events_2 = SyncProtocol.Events<Name> & {
    debug: (entry: DebugEntry_2) => void;
};

declare type Events_3 = {
    debug: (entry: DebugEntry_3) => void;
    state: (topics: readonly PSyncPartialSubscriber.TopicInfo[]) => void;
};

declare type Events_4 = SyncProtocol.Events<Name> & {
    debug: (entry: DebugEntry_4) => void;
};

declare type Events_5 = {
    error: (err: Error) => void;
};

declare type Events_6 = {
    debug: (entry: DebugEntry_5) => void;
};

/** Delete keys from a Set or Map until its size is below capacity. */
declare function evict<K>(capacity: number, ct: evict.Container<K>): void;

declare namespace evict {
    type Container<K> = Pick<Set<K>, "delete" | "size" | "keys">;
}

export declare namespace ext {
    const ndnTypes: {
        packet: typeof packet;
        tlv: typeof tlv;
        sync: typeof sync;
        keychain: typeof keychain;
        util: typeof util;
        ws_transport: typeof ws_transport;
        endpoint: typeof endpoint;
    };
    const node: INode;
    /**
     * Visualize a NDN TLV block or packet
     * @param packet can be hex or base64 string, binary buffer or an encodable e.g. Interest
     */
    export function visualize(packet: string | Uint8Array | ArrayBuffer | tlv.Encodable | undefined): void;
    /**
     * Filter packets to be captured
     * @param filter filter: function to check if captured packet should be stored
     */
    export function setGlobalCaptureFilter(filter: (packet: ICapturedPacket) => boolean): void;
    /**
     * Load a local file from the user's computer
     */
    export function loadfile(): Promise<ArrayBuffer>;
    /**
     * Download a file to user's computer
     * @param bin Buffer to be downloaded
     * @param type MIME type of the file to be downloaded
     * @param name Name of the file to be downloaded
     * @param deflate Compress the buffer using pako DEFLATE
     */
    export function downloadfile(bin: Uint8Array, type: string, name: string, deflate?: boolean): void;
    /**
     * The WebAssembly filesystem.
     * @details Allows access to the virtual filesystem.
     * Note: this module exists only after the first call
     * to a WASM module has been done and the filesystem has been
     * initialized. The /data directory is the working directory
     * and is the only directory that is shared across all modules.
     */
    const FS: WasmFS;
    /**
     * The DCT tools module.
     */
    const DCT: DCT;
}

/** An TLV element that allows extension sub element. */
declare interface Extensible {
    readonly [Extensible.TAG]: ExtensionRegistry<any>;
}

declare namespace Extensible {
    const TAG: unique symbol;
    /** Clone extension fields of src to dst. */
    function cloneRecord(dst: Extensible, src: Extensible): void;
    /**
     * Define simple getters and setters.
     * @param typ Extensible subclass constructor.
     * @param exts extensions, each key is a property name and each value is the TLV-TYPE number.
     */
    function defineGettersSetters<T extends Extensible>(typ: new () => T, exts: Record<string, number>): void;
}

/**
 * An extension sub element on a parent TLV element.
 * T is the parent TLV element type.
 * R is the value type of this extension.
 */
declare interface Extension<T, R = unknown> {
    /** TLV-TYPE. */
    readonly tt: number;
    /** Order relative to other extensions, used on encoding only. */
    readonly order?: number;
    /**
     * Decode extension element.
     * @param obj parent object.
     * @param tlv TLV of sub element; its TLV-TYPE would be this.tt .
     * @param accumulator previous decoded value, if extension element appears more than once.
     */
    decode: (obj: T, tlv: Decoder.Tlv, accumulator?: R) => R;
    /**
     * Encode extension element.
     * @param obj parent object.
     * @param value decoded value.
     * @returns encoding of sub element; its TLV-TYPE should be this.tt .
     */
    encode: (obj: T, value: R) => Encodable;
}

declare namespace Extension {
    /** Retrieve value of an extension field. */
    function get(obj: Extensible, tt: number): unknown;
    /** Assign value of an extension field. */
    function set(obj: Extensible, tt: number, value: unknown): void;
    /** Clear value of an extension field. */
    function clear(obj: Extensible, tt: number): void;
}

/** Registry of known extension fields of a parent TLV element. */
declare class ExtensionRegistry<T extends Extensible> {
    private readonly table;
    /** Add an extension. */
    readonly registerExtension: <R>(ext: Extension<T, R>) => void;
    /** Remove an extension. */
    readonly unregisterExtension: (tt: number) => void;
    /** UnknownElementCallback for EvDecoder. */
    readonly decodeUnknown: (target: T, tlv: Decoder.Tlv, order: number) => boolean;
    /** Encode extension fields. */
    encode(source: T): Encodable[];
}

declare const FIELDS: unique symbol;

declare class Fields {
    constructor(...args: Array<Data | Data.CtorArg>);
    name: Name;
    get contentType(): number;
    set contentType(v: number);
    private contentType_;
    get freshnessPeriod(): number;
    set freshnessPeriod(v: number);
    private freshnessPeriod_;
    finalBlockId?: Component;
    /** Determine whether FinalBlockId equals the last name component. */
    get isFinalBlock(): boolean;
    /**
     * Setting to false deletes FinalBlockId.
     *
     * Setting to true assigns FinalBlockId to be the last name component.
     * It is not allowed if the name is empty.
     */
    set isFinalBlock(v: boolean);
    content: Uint8Array;
    sigInfo: SigInfo;
    sigValue: Uint8Array;
    signedPortion?: Uint8Array;
    topTlv?: Uint8Array;
    topTlvDigest?: Uint8Array;
}

declare class Fields_2 {
    constructor(...args: Array<Interest | Interest.CtorArg>);
    name: Name;
    canBePrefix: boolean;
    mustBeFresh: boolean;
    fwHint?: FwHint;
    get nonce(): number | undefined;
    set nonce(v: number | undefined);
    private nonce_;
    get lifetime(): number;
    set lifetime(v: number);
    private lifetime_;
    get hopLimit(): number;
    set hopLimit(v: number);
    private hopLimit_;
    appParameters?: Uint8Array;
    sigInfo?: SigInfo;
    sigValue: Uint8Array;
    paramsPortion?: Uint8Array;
    signedPortion?: Uint8Array;
}

/**
 * Map and flatten once.
 * This differs from flatMap in streaming-iterables, which recursively flattens the result.
 */
declare function flatMapOnce<T, R>(f: (item: T) => Iterable<R> | AsyncIterable<R>, iterable: Iterable<T> | AsyncIterable<T>): AsyncIterable<R>;

/** Forwarding plane. */
declare interface Forwarder extends TypedEventTarget<EventMap_2> {
    /** Node names, used in forwarding hint processing. */
    readonly nodeNames: Name[];
    /** Logical faces. */
    readonly faces: ReadonlySet<FwFace>;
    /** Add a logical face to the forwarding plane. */
    addFace(face: FwFace.RxTx | FwFace.RxTxDuplex, attributes?: FwFace.Attributes): FwFace;
    /**
     * Cancel timers and other I/O resources.
     * This instance should not be used after this operation.
     */
    close(): void;
}

declare namespace Forwarder {
    interface Options {
        /** Whether to try matching Data without PIT token. */
        dataNoTokenMatch?: boolean;
    }
    const DefaultOptions: Required<Options>;
    /** Create a new forwarding plane. */
    function create(options?: Options): Forwarder;
    /** Access the default forwarding plane instance. */
    function getDefault(): Forwarder;
    /** Replace the default forwarding plane instance. */
    function replaceDefault(fw?: Forwarder): void;
    /** Delete default instance (mainly for unit testing). */
    function deleteDefault(): void;
    /** Face event. */
    class FaceEvent extends Event {
        readonly face: FwFace;
        constructor(type: string, face: FwFace);
    }
    /** Prefix registration event. */
    class PrefixEvent extends Event {
        readonly face: FwFace;
        readonly prefix: Name;
        constructor(type: string, face: FwFace, prefix: Name);
    }
    /** Prefix announcement event. */
    class AnnouncementEvent extends Event {
        readonly name: Name;
        constructor(type: string, name: Name);
    }
    /** Packet event. */
    class PacketEvent extends Event {
        readonly face: FwFace;
        readonly packet: FwPacket;
        constructor(type: string, face: FwFace, packet: FwPacket);
    }
}

declare interface ForwardingProvider {
    topo: Topology;
    pendingUpdatesNodes: {
        [id: string]: Partial<INode>;
    };
    pendingUpdatesEdges: {
        [id: string]: Partial<IEdge>;
    };
    defaultLatency: number;
    defaultLoss: number;
    contentStoreSize?: number;
    latencySlowdown?: number;
    initialize: () => Promise<void>;
    initializePostNetwork: () => Promise<void>;
    edgeUpdated: (edge?: IEdge) => Promise<void>;
    nodeUpdated: (node?: INode) => Promise<void>;
    onNetworkClick: () => Promise<void>;
    refreshFib?: () => Promise<void>;
    sendPingInterest?: (from: INode, to: INode) => void;
    sendInterest?: (name: string, node: INode) => void;
    fetchCapturedPackets?: (node: INode) => void;
    visualizeCaptured?: (packet: ICapturedPacket, node: INode) => void;
    downloadExperimentDump?: () => void;
    loadExperimentDump?: () => Promise<void>;
    runCode?: (code: string, node: INode) => void;
    openTerminal?: (node: INode) => void;
}

/**
 * Convert hexadecimal string to byte array.
 *
 * If the input is not a valid hexadecimal string, result will be incorrect.
 */
declare function fromHex(s: string): Uint8Array;

declare namespace fromHex {
    /** Conversion table from hexadecimal digit (case insensitive) to nibble. */
    const TABLE: Readonly<Record<string, number>>;
}

/** Convert UTF-8 byte array to string. */
declare function fromUtf8(buf: Uint8Array): string;

/** A socket or network interface associated with forwarding plane. */
declare interface FwFace extends TypedEventTarget<EventMap_3> {
    readonly fw: Forwarder;
    readonly attributes: FwFace.Attributes;
    readonly running: boolean;
    /** Shutdown the face. */
    close(): void;
    toString(): string;
    /** Determine if a route is present on the face. */
    hasRoute(name: NameLike): boolean;
    /** Add a route toward the face. */
    addRoute(name: NameLike, announcement?: FwFace.RouteAnnouncement): void;
    /** Remove a route toward the face. */
    removeRoute(name: NameLike, announcement?: FwFace.RouteAnnouncement): void;
    /** Add a prefix announcement associated with the face. */
    addAnnouncement(name: NameLike): void;
    /** Remove a prefix announcement associated with the face. */
    removeAnnouncement(name: NameLike): void;
}

declare namespace FwFace {
    interface Attributes extends Record<string, any> {
        /** Short string to identify the face. */
        describe?: string;
        /** Whether face is local. Default is false. */
        local?: boolean;
        /** Whether to readvertise registered routes. Default is true. */
        advertiseFrom?: boolean;
        /**
         * Whether routes registered on this face would cause FIB to stop matching onto shorter prefixes.
         * Default is true.
         * More explanation in @ndn/endpoint package ProducerOptions type.
         */
        routeCapture?: boolean;
    }
    type RouteAnnouncement = boolean | number | NameLike;
    type RxTxEventMap = Pick<EventMap_3, "up" | "down">;
    interface RxTxBase {
        readonly attributes?: Attributes;
        addEventListener?: <K extends keyof RxTxEventMap>(type: K, listener: (ev: RxTxEventMap[K]) => any, options?: AddEventListenerOptions) => void;
        removeEventListener?: <K extends keyof RxTxEventMap>(type: K, listener: (ev: RxTxEventMap[K]) => any, options?: EventListenerOptions) => void;
    }
    interface RxTx extends RxTxBase {
        rx: AsyncIterable<FwPacket>;
        tx: (iterable: AsyncIterable<FwPacket>) => void;
    }
    interface RxTxDuplex extends RxTxBase {
        /**
         * The transform function takes an iterable of packets sent by the forwarder,
         * and returns an iterable of packets received by the forwarder.
         */
        duplex: (iterable: AsyncIterable<FwPacket>) => AsyncIterable<FwPacket>;
    }
}

/** ForwardingHint in Interest. */
declare class FwHint {
    static decodeValue(vd: Decoder): FwHint;
    constructor(copy?: FwHint);
    constructor(name: NameLike);
    constructor(delegations: readonly NameLike[]);
    delegations: Name[];
    encodeTo(encoder: Encoder): void;
}

/** A logical packet in the forwarder. */
declare interface FwPacket<T extends L3Pkt = L3Pkt> {
    l3: T;
    token?: unknown;
    reject?: RejectInterest.Reason;
    cancel?: boolean;
}

declare namespace FwPacket {
    function create<T extends L3Pkt>(l3: T, token?: unknown): FwPacket<T>;
    /** Whether this is a plain packet that can be sent on the wire. */
    function isEncodable({ reject, cancel }: FwPacket): boolean;
}

/** Generate a pair of encrypter and decrypter. */
declare function generateEncryptionKey<I, Asym extends boolean, G>(name: NameLike, ...a: EncryptionOptG<I, Asym, G>): Promise<[NamedEncrypter<Asym>, NamedDecrypter<Asym>]>;

/** Generate a pair of encrypter and decrypter, and save to KeyChain. */
declare function generateEncryptionKey<I, Asym extends boolean, G>(keyChain: KeyChain, name: NameLike, ...a: EncryptionOptG<I, Asym, G>): Promise<[NamedEncrypter<Asym>, NamedDecrypter<Asym>]>;

/** Generate a pair of signer and verifier with the default ECDSA signing algorithm. */
declare function generateSigningKey(name: NameLike): Promise<[NamedSigner.PrivateKey, NamedVerifier.PublicKey]>;

/** Generate a pair of signer and verifier with the default ECDSA signing algorithm, and save to KeyChain. */
declare function generateSigningKey(keyChain: KeyChain, name: NameLike): Promise<[NamedSigner.PrivateKey, NamedVerifier.PublicKey]>;

/** Generate a pair of signer and verifier. */
declare function generateSigningKey<I, Asym extends boolean, G>(name: NameLike, ...a: SigningOptG<I, Asym, G>): Promise<[NamedSigner<Asym>, NamedVerifier<Asym>]>;

/** Generate a pair of signer and verifier, and save to KeyChain. */
declare function generateSigningKey<I, Asym extends boolean, G>(keyChain: KeyChain, name: NameLike, ...a: SigningOptG<I, Asym, G>): Promise<[NamedSigner<Asym>, NamedVerifier<Asym>]>;

/** 32-bit hash function. */
declare type HashFunction = (seed: number, input: Uint8Array) => number;

/** HmacWithSha256 signing algorithm. */
declare const HMAC: SigningAlgorithm<{}, false, HMAC.GenParams>;

declare namespace HMAC {
    /** Key generation parameters. */
    interface GenParams {
        /** Import raw key bits instead of generating. */
        importRaw?: Uint8Array;
    }
}

/** Invertible Bloom Lookup Table. */
declare class IBLT {
    constructor(p: IBLT.Parameters | IBLT.PreparedParameters);
    private readonly p;
    private readonly ht;
    private readonly key;
    /** Insert a key. */
    insert(key: number): void;
    /** Erase a key. */
    erase(key: number): void;
    private update;
    private update2;
    /** Compute the difference between this (first) and other (second) IBLT. */
    diff(...others: IBLT[]): IBLT.Diff;
    /**
     * Serialize the hashtable to a byte array.
     *
     * Each entry is serialized as 12 octets:
     * - count: int32
     * - keySum: uint32
     * - keyCheck: uint32
     * IBLT.Parameters.serializeLittleEndian determines endianness.
     *
     * Return value shares the underlying memory. It must be copied when not using compression.
     */
    serialize(): Uint8Array;
    /**
     * Deserialize from a byte array.
     * @throws input does not match parameters.
     */
    deserialize(v: Uint8Array): void;
    /** Clone to another IBLT. */
    clone(): IBLT;
}

declare namespace IBLT {
    type HashFunction = (seed: number, input: Uint8Array) => number;
    /** IBLT parameters. */
    interface Parameters {
        /** Whether to use little endian when converting uint32 key to Uint8Array. */
        keyToBufferLittleEndian: boolean;
        /** Whether to use little endian when serializing uint32 and int32 fields. */
        serializeLittleEndian: boolean;
        /** 32-bit hash function. */
        hash: HashFunction;
        /** Number of hash keys. */
        nHash: number;
        /**
         * Hash function seed for KeyCheck field.
         * This must be greater than nHash.
         */
        checkSeed: number;
        /**
         * Number of hashtable entries.
         * This must be divisible by `nHash`.
         */
        nEntries: number;
    }
    class PreparedParameters implements Readonly<Parameters> {
        static prepare(p: Parameters): PreparedParameters;
        private constructor();
        readonly nBuckets: number;
    }
    interface PreparedParameters extends Readonly<Parameters> {
    }
    /** Difference between two IBLTs. */
    interface Diff {
        /** Whether all keys have been extracted. */
        success: boolean;
        /** Keys present in the first IBLT but absent in the second IBLT. */
        positive: Set<number>;
        /** Keys absent in the first IBLT but present in the second IBLT. */
        negative: Set<number>;
        /** Total number of keys in positive and negative sets. */
        total: number;
    }
}

declare class IbltCodec {
    readonly ibltCompression: Compression;
    protected readonly ibltParams: IBLT.PreparedParameters;
    iblt2comp(iblt: IBLT): Component;
    comp2iblt(comp: Component): IBLT;
}

declare type ICapturedPacket = [
/** Internal flags */
flags: number,
/** Frame number */
frame_number: number,
/** Timestamp in ms */
timestamp: number,
/** Length of packet in bytes */
length: number,
/** Interest/Data/Nack */
type: string,
/** NDN name of packet */
name: string,
/** Originating node */
from: string | undefined,
/** Destination node */
to?: string | undefined,
/** Contents of the packet for visualization */
p?: Uint8Array | undefined
];

declare interface IEdge extends Edge {
    /** Latency in milliseconds */
    latency: number;
    /** Loss in percentage */
    loss: number;
    /** Extra data object */
    extra: ILinkExtra;
}

declare type If<Cond, True, False, Unknown = True | False> = Cond extends true ? True : Cond extends false ? False : Unknown;

declare interface ILinkExtra {
    /** Units of traffic pending on this link */
    pendingTraffic: number;
}

/** ImplicitSha256DigestComponent */
declare const ImplicitDigest: ImplicitDigestComp;

declare class ImplicitDigestComp extends DigestComp {
    constructor();
    /** Remove ImplicitDigest if present at last component. */
    strip(name: Name): Name;
}

declare interface INode extends Node_2 {
    nfw?: NFW;
    /** Extra data object */
    extra: INodeExtra;
    /** Label of this node */
    label: string;
    /** Set if this node is a passive switch */
    isSwitch?: boolean;
}

declare interface INodeExtra {
    /** Units of traffic pending on this node */
    pendingTraffic: number;
    /** Currently written code on this node */
    codeEdit: string;
    /** Prefixes prodcued by this node */
    producedPrefixes: string[];
    /** FIB or status information of the node */
    fibStr: string;
    /** Wireshark */
    capturedPackets: ICapturedPacket[];
    /** Replay position */
    replayWindow?: number;
    /** Replay position (first) */
    replayWindowF?: number;
    /** Color of node */
    color?: string;
}

/** Interest packet. */
declare class Interest implements LLSign.Signable, LLVerify.Verifiable, Signer.Signable, Verifier.Verifiable {
    /**
     * Construct from flexible arguments.
     *
     * Arguments can include, in any order:
     * - Interest to copy from
     * - Name or name URI
     * - Interest.CanBePrefix
     * - Interest.MustBeFresh
     * - FwHint
     * - Interest.Nonce(v)
     * - Interest.Lifetime(v)
     * - Interest.HopLimit(v)
     * - Uint8Array as AppParameters
     */
    constructor(...args: Array<Interest | Interest.CtorArg>);
    readonly [FIELDS]: Fields_2;
    static decodeFrom(decoder: Decoder): Interest;
    encodeTo(encoder: Encoder): void;
    private encodeParamsPortion;
    private appendParamsDigestPlaceholder;
    updateParamsDigest(): Promise<void>;
    validateParamsDigest(requireAppParameters?: boolean): Promise<void>;
    [LLSign.OP](sign: LLSign): Promise<void>;
    [LLVerify.OP](verify: LLVerify): Promise<void>;
}

declare interface Interest extends PublicFields {
}

declare namespace Interest {
    /** Generate a random nonce. */
    function generateNonce(): number;
    /** Default InterestLifetime. */
    const DefaultLifetime = 4000;
    /** Constructor argument to set CanBePrefix flag. */
    const CanBePrefix: CtorTag_2;
    /** Constructor argument to set MustBeFresh flag. */
    const MustBeFresh: CtorTag_2;
    /** Constructor argument to set Nonce field. */
    function Nonce(v?: number): CtorTag_2;
    /** Constructor argument to set InterestLifetime field. */
    function Lifetime(v: number): CtorTag_2;
    /** Constructor argument to set HopLimit field. */
    function HopLimit(v: number): CtorTag_2;
    /** Constructor argument. */
    type CtorArg = NameLike | FwHint | CtorTag_2 | Uint8Array;
    /** A function to modify an existing Interest. */
    type ModifyFunc = (interest: Interest) => void;
    /** Common fields to assign onto an existing Interest. */
    type ModifyFields = Partial<Pick<Fields_2, "canBePrefix" | "mustBeFresh" | "fwHint" | "lifetime" | "hopLimit">>;
    /** A structure to modify an existing Interest. */
    type Modify = ModifyFunc | ModifyFields;
    /** Turn ModifyFields to ModifyFunc; return ModifyFunc as-is. */
    function makeModifyFunc(input?: Modify): ModifyFunc;
}

declare type IntervalRange = [min: number, max: number];

/** Connected Pty */
declare interface IPty {
    id: string;
    name: string;
    write: EventEmitter<Uint8Array>;
    data: EventEmitter<string>;
    resized: EventEmitter<{
        rows: number;
        cols: number;
    }>;
    focus?: EventEmitter<void>;
    initBuf?: Uint8Array;
}

/** Determine whether the name is a certificate name. */
declare function isCertName(name: Name): boolean;

/** Determine whether the name is a key name. */
declare function isKeyName(name: Name): boolean;

/** Default issuerId. */
declare const ISSUER_DEFAULT: Component;

/** Self-signed issuerId. */
declare const ISSUER_SELF: Component;

/**
 * Initialization Vector checker.
 *
 * The .wrap() method creates an LLDecrypt.Key or LLDecrypt that checks the IV in each message
 * before and after decryption, and updates the internal state of this class. Typically, a
 * separate IvChecker instances should be used for each key.
 */
declare abstract class IvChecker {
    readonly ivLength: number;
    constructor(ivLength: number);
    wrap<T extends LLDecrypt.Key>(key: T): T;
    wrap(f: LLDecrypt): LLDecrypt;
    private wrapKey;
    private wrapLLDecrypt;
    /** Check IV for incoming message and update internal state. */
    protected abstract check(iv: Uint8Array, plaintextLength: number, ciphertextLength: number): void;
}

/**
 * Initialization Vector generator.
 *
 * The .wrap() method creates an LLEncrypt.Key or LLEncrypt that generates an IV for each message
 * before encryption, and updates the internal state of this class after encryption. Typically, a
 * separate IVGen instance should be used for each key.
 *
 * If a message passed for encryption already has an IV associated, it would bypass this class: in
 * that case, the IV is not checked and the internal state is not updated.
 */
declare abstract class IvGen {
    readonly ivLength: number;
    constructor(ivLength: number);
    wrap<T extends LLEncrypt.Key>(key: T): T;
    wrap(f: LLEncrypt): LLEncrypt;
    private wrapKey;
    private wrapLLEncrypt;
    /** Generate IV for next message. */
    protected abstract generate(): Uint8Array;
    /** Update internal state after a message is encrypted.. */
    protected update(plaintextLength: number, ciphertextLength: number): void;
}

/** 'KEY' component. */
declare const KEY: Component;

declare interface Key<K extends KeyKind> {
    readonly name: Name;
    readonly [KeyKind]: K;
    readonly spki?: "public" extends K ? Uint8Array : never;
}

/** Storage of own private keys and certificates. */
declare abstract class KeyChain {
    /** Return whether insertKey function expects JsonWebKey instead of CryptoKey. */
    abstract readonly needJwk: boolean;
    /** List keys, filtered by name prefix. */
    abstract listKeys(prefix?: Name): Promise<Name[]>;
    /** Retrieve key pair by key name. */
    abstract getKeyPair(name: Name): Promise<KeyChain.KeyPair>;
    /**
     * Retrieve key by key name.
     * @param typ "signer", "verifier", etc.
     */
    getKey<K extends keyof KeyChain.KeyPair>(name: Name, typ: K): Promise<KeyChain.KeyPair[K]>;
    /** Insert key pair. */
    abstract insertKey(name: Name, stored: KeyStore.StoredKey): Promise<void>;
    /** Delete key pair and associated certificates. */
    abstract deleteKey(name: Name): Promise<void>;
    /** List certificates, filtered by name prefix. */
    abstract listCerts(prefix?: Name): Promise<Name[]>;
    /** Retrieve certificate by cert name. */
    abstract getCert(name: Name): Promise<Certificate>;
    /** Insert certificate; key must exist. */
    abstract insertCert(cert: Certificate): Promise<void>;
    /** Delete certificate. */
    abstract deleteCert(name: Name): Promise<void>;
    /**
     * Create a signer from keys and certificates in the KeyChain.
     * @param name subject name, key name, or certificate name.
     *
     * @li If name is a certificate name, sign with the corresponding private key,
     *     and use the specified certificate name as KeyLocator.
     * @li If name is a key name, sign with the specified private key.
     *     If a non-self-signed certificate exists for this key, use the certificate name as KeyLocator.
     *     Otherwise, use the key name as KeyLocator.
     * @li If name is neither certificate name nor key name, it is interpreted as a subject name.
     *     A non-self-signed certificate of this subject name is preferred.
     *     If such a certificate does not exist, use any key of this subject name.
     * @li If prefixMatch is true, name can also be interpreted as a prefix of the subject name.
     */
    getSigner(name: Name, { prefixMatch, fallback, useKeyNameKeyLocator }?: KeyChain.GetSignerOptions): Promise<Signer>;
    private findSignerCertName;
}

declare namespace KeyChain {
    type KeyPair<Asym extends boolean = any> = KeyStore.KeyPair<Asym>;
    /**
     * keyChain.getSigner() options.
     */
    interface GetSignerOptions {
        /**
         * If false, name argument must equal subject name, key name, or certificate name.
         * If true, name argument may be a prefix of subject name.
         * Default is false.
         */
        prefixMatch?: boolean;
        /**
         * If a function, it is invoked when no matching key or certificate is found, and should
         * either return a fallback Signer or reject the promise.
         * If a Signer, it is used when no matching key or certificate is found.
         */
        fallback?: Signer | ((name: Name, keyChain: KeyChain, err?: Error) => Promise<Signer>);
        /**
         * If false, KeyLocator is a certificate name when a non-self-signed certificate exists.
         * If true, KeyLocator is the key name.
         * Default is false.
         */
        useKeyNameKeyLocator?: boolean;
    }
    /**
     * Open a persistent KeyChain.
     * @param locator in Node.js, a filesystem directory; in browser, a database name.
     * @param algoList list of recognized algorithms. Default is CryptoAlgorithmListSlim.
     *                 Use CryptoAlgorithmListFull for all algorithms, at the cost of larger bundle size.
     */
    function open(locator: string, algoList?: readonly CryptoAlgorithm[]): KeyChain;
    /** Open a KeyChain from given KeyStore and CertStore. */
    function open(keys: KeyStore, certs: CertStore): KeyChain;
    /**
     * Create an in-memory ephemeral KeyChain.
     * @param algoList list of recognized algorithms.
     *                 Use CryptoAlgorithmListFull for all algorithms, at the cost of larger bundle size.
     */
    function createTemp(algoList?: readonly CryptoAlgorithm<any, any, any>[]): KeyChain;
}

declare namespace keychain {
    export {
        CertNaming,
        AesEncryption,
        AesKeyLength,
        AesBlockSize,
        RsaModulusLength,
        AESCBC,
        AESCTR,
        AESGCM,
        EcCurve,
        ECDSA,
        Ed25519,
        HMAC,
        RSA,
        RSAOAEP,
        CryptoAlgorithmListFull,
        EncryptionAlgorithmListFull,
        SigningAlgorithmListFull,
        SigningAlgorithmListSlim,
        EncryptionAlgorithmListSlim,
        CryptoAlgorithmListSlim,
        ValidityPeriod,
        Certificate,
        CounterIvOptions,
        IvChecker,
        CounterIvChecker,
        CounterIvGen,
        IvGen,
        RandomIvGen,
        createDecrypter,
        createEncrypter,
        generateEncryptionKey,
        generateSigningKey,
        createSigner,
        createVerifier,
        KeyKind,
        PrivateKey,
        PublicKey,
        SecretKey,
        NamedSigner,
        NamedVerifier,
        NamedEncrypter,
        NamedDecrypter,
        CryptoAlgorithm,
        SigningAlgorithm,
        EncryptionAlgorithm,
        KeyStore,
        CertStore,
        KeyChain
    }
}
export { keychain }

/** Identify kind of key. */
declare type KeyKind = "private" | "public" | "secret";

declare namespace KeyKind {
    /** Pick "private" or "secret" based on whether the algorithm is asymmetric. */
    type PrivateSecret<Asym extends boolean> = If<Asym, "private", "secret">;
    /** Pick "public" or "secret" based on whether the algorithm is asymmetric. */
    type PublicSecret<Asym extends boolean> = If<Asym, "public", "secret">;
}

declare const KeyKind: unique symbol;

/** KeyLocator in SigInfo. */
declare class KeyLocator {
    static decodeFrom(decoder: Decoder): KeyLocator;
    name?: Name;
    digest?: Uint8Array;
    constructor(...args: KeyLocator.CtorArg[]);
    encodeTo(encoder: Encoder): void;
}

declare namespace KeyLocator {
    type CtorArg = KeyLocator | NameLike | Uint8Array;
    function isCtorArg(arg: unknown): arg is CtorArg;
    /**
     * Extract KeyLocator name.
     * @throws KeyLocator is missing or does not have Name.
     */
    function mustGetName(kl?: KeyLocator): Name;
}

/**
 * Map that transforms keys.
 *
 * K: input key type.
 * V: value type.
 * I: indexable key type.
 * L: lookup key type.
 */
declare class KeyMap<K, V, I, L = K> {
    private readonly keyOf;
    /**
     * Constructor.
     * @param keyOf function to transform input key to indexable key.
     */
    constructor(keyOf: (key: K | L) => I);
    private readonly m;
    get size(): number;
    has(key: K | L): boolean;
    get(key: K | L): V | undefined;
    set(key: K, value: V): this;
    delete(key: K | L): boolean;
    [Symbol.iterator](): IterableIterator<[key: K, value: V]>;
}

/**
 * MultiMap that transforms keys.
 *
 * K: input key type.
 * V: value type.
 * I: indexable key type.
 * L: lookup key type.
 */
declare class KeyMultiMap<K, V, I, L = K> {
    /**
     * Constructor.
     * @param keyOf function to transform input key to indexable key.
     */
    constructor(keyOf: (key: K | L) => I);
    private readonly m;
    private size_;
    /** Number of distinct keys. */
    get dimension(): number;
    /** Number of values. */
    get size(): number;
    /** Count values associated with a key. */
    count(key: K | L): number;
    /** List values associated with a key. */
    list(key: K | L): ReadonlySet<V>;
    /**
     * Add a key-value pair.
     * Values are stored in a Set, so duplicates are skipped.
     * @returns count(key) after the operation.
     */
    add(key: K, value: V): number;
    /**
     * Remove a key-value pair.
     * No-op if key-value does not exist.
     * @returns count(key) after the operation.
     */
    remove(key: K | L, value: V): number;
    /** Iterate over key and associated values. */
    associations(): IterableIterator<[key: K, values: ReadonlySet<V>]>;
    /** Iterate over key-value pairs. */
    [Symbol.iterator](): IterableIterator<[key: K, value: V]>;
}

/**
 * MultiSet that transforms keys.
 *
 * K: input key type.
 * I: indexable key type.
 * L: lookup key type.
 */
declare class KeyMultiSet<K, I, L = K> {
    /**
     * Constructor.
     * @param keyOf function to transform input key to indexable key.
     */
    constructor(keyOf: (key: K | L) => I);
    private readonly m;
    private size_;
    /** Number of distinct keys. */
    get dimension(): number;
    /** Number of values. */
    get size(): number;
    /** Count occurrences of a key. */
    count(key: K | L): number;
    /**
     * Add a key.
     * @returns number of occurrences after the operation.
     */
    add(key: K): number;
    /**
     * Remove a key.
     * No-op if key does not exist.
     * @returns number of occurrences after the operation.
     */
    remove(key: K): number;
    /** Iterate over key and number of occurrences. */
    multiplicities(): IterableIterator<[key: K, count: number]>;
}

declare interface KeyNameFields {
    subjectName: Name;
    keyId: Component;
}

declare interface KeyState {
    nonces?: Set<string>;
    time?: number;
    seqNum?: bigint;
}

/** KV store of named key pairs. */
declare class KeyStore extends StoreBase<KeyStore.StoredKey> {
    constructor(provider: StoreProvider<KeyStore.StoredKey>, algoList: readonly CryptoAlgorithm[]);
    private readonly loader;
    get(name: Name): Promise<KeyStore.KeyPair>;
    insert(name: Name, stored: KeyStore.StoredKey): Promise<void>;
}

declare namespace KeyStore {
    /** Loaded key pair. */
    class KeyPair<Asym extends boolean = any, I = any> {
        readonly name: Name;
        readonly algo: CryptoAlgorithm<I, Asym>;
        readonly pvt: CryptoAlgorithm.PrivateSecretKey<I, Asym>;
        readonly pub: CryptoAlgorithm.PublicSecretKey<I, Asym>;
        constructor(name: Name, algo: CryptoAlgorithm<I, Asym>, pvt: CryptoAlgorithm.PrivateSecretKey<I, Asym>, pub: CryptoAlgorithm.PublicSecretKey<I, Asym>);
        get signer(): NamedSigner<Asym>;
        get verifier(): NamedVerifier<Asym>;
        get encrypter(): NamedEncrypter<Asym>;
        get decrypter(): NamedDecrypter<Asym>;
        get publicKey(): PublicKey;
    }
    /** Stored key pair in JSON or structure clone format. */
    interface StoredKey {
        algo: string;
        info: any;
        jwkImportParams?: AlgorithmIdentifier;
        privateKey?: CryptoKey | JsonWebKey;
        publicKey?: CryptoKey | JsonWebKey;
        publicKeySpki?: Uint8Array | string;
        secretKey?: CryptoKey | JsonWebKey;
    }
    /** Helper to load key pair from stored format. */
    class Loader {
        private readonly extractable;
        private readonly algoList;
        constructor(extractable: boolean, algoList: readonly CryptoAlgorithm[]);
        findAlgo(uuid: string): CryptoAlgorithm<unknown> | undefined;
        loadKey(name: Name, stored: StoredKey): Promise<KeyPair>;
        private loadAsymmetric;
        private loadSymmetric;
    }
}

/** Network layer face for sending and receiving L3 packets. */
declare class L3Face extends TypedEventTarget<EventMap_4> implements FwFace.RxTx {
    private transport;
    readonly attributes: L3Face.Attributes;
    readonly lp: LpService;
    readonly rx: AsyncIterable<FwPacket>;
    private readonly wireTokenPrefix;
    get state(): L3Face.State;
    private set state(value);
    private state_;
    private lastError?;
    private readonly rxSources;
    private reopenRetry?;
    constructor(transport: Transport, attributes?: L3Face.Attributes, lpOptions?: LpService.Options);
    private makeRx;
    private rxTransform;
    private txTransform;
    tx: (iterable: AsyncIterable<FwPacket>) => Promise<void>;
    private reopenTransport;
}

declare namespace L3Face {
    enum State {
        UP = 0,
        DOWN = 1,
        CLOSED = 2
    }
    class StateEvent extends Event {
        readonly state: State;
        readonly prev: State;
        constructor(type: string, state: State, prev: State);
    }
    interface Attributes extends Transport.Attributes {
        /** Whether to readvertise registered routes. */
        advertiseFrom?: boolean;
    }
    type RxError = LpService.RxError;
    type TxError = LpService.TxError;
    /** Options to createFace function as first parameter. */
    interface CreateFaceOptions {
        /**
         * Forwarder instance to add the face to.
         * Default is the default Forwarder.
         */
        fw?: Forwarder;
        /** Routes to be added on the created face. Default is ["/"]. */
        addRoutes?: NameLike[];
        /**
         * L3Face attributes.
         * l3.advertiseFrom defaults to false in createFace function.
         */
        l3?: Attributes;
        /** NDNLP service options. */
        lp?: LpService.Options;
        /**
         * A callback to receive Transport, L3Face, and FwFace objects.
         * This can be useful for reading counters or listening to events on these objects.
         */
        callback?: (transport: Transport, l3face: L3Face, fwFace: FwFace) => void;
    }
    /**
     * A function to create a transport then add to forwarder.
     * First parameter is CreateFaceOptions.
     * Subsequent parameters are passed to Transport.connect() function.
     * Returns FwFace.
     */
    type CreateFaceFunc<R extends Transport | Transport[], P extends any[]> = (opts: CreateFaceOptions, ...args: P) => Promise<R extends Transport[] ? FwFace[] : FwFace>;
    function makeCreateFace<C extends (...args: any[]) => Promise<Transport | Transport[]>>(createTransport: C): CreateFaceFunc<C extends (...args: any[]) => Promise<infer R> ? R : never, Parameters<C>>;
    function processAddRoutes(fwFace: FwFace, addRoutes?: readonly NameLike[]): void;
}

declare type L3Pkt = Interest | Data | Nack;

declare type Len = 1 | 2 | 4 | 8;

/** Low level decryption function. */
declare type LLDecrypt = (params: LLDecrypt.Params) => Promise<LLDecrypt.Result>;

declare namespace LLDecrypt {
    /** Input of LLDecrypt function. */
    interface Params {
        ciphertext: Uint8Array;
        iv?: Uint8Array;
        authenticationTag?: Uint8Array;
        additionalData?: Uint8Array;
    }
    /** Output of LLDecrypt function. */
    interface Result {
        plaintext: Uint8Array;
    }
    /** Object that provides LLDecrypt function, such as secret key. */
    interface Key {
        readonly llDecrypt: LLDecrypt;
    }
}

/** Low level encryption function. */
declare type LLEncrypt = (params: LLEncrypt.Params) => Promise<LLEncrypt.Result>;

declare namespace LLEncrypt {
    /** Input of LLEncrypt function. */
    interface Params {
        plaintext: Uint8Array;
        iv?: Uint8Array;
        additionalData?: Uint8Array;
    }
    /** Output of LLEncrypt function. */
    interface Result {
        ciphertext: Uint8Array;
        iv?: Uint8Array;
        authenticationTag?: Uint8Array;
    }
    /** Object that provides LLEncrypt function, such as secret key. */
    interface Key {
        readonly llEncrypt: LLEncrypt;
    }
}

/**
 * Low level signing function.
 * It takes a buffer of signed portion, and returns a Promise of signature value.
 */
declare type LLSign = (input: Uint8Array) => Promise<Uint8Array>;

declare namespace LLSign {
    const OP: unique symbol;
    interface Signable {
        [OP]: (signer: LLSign) => Promise<void>;
    }
}

/**
 * Low level verification function.
 * It takes a buffer of signed portion and the signature value, and returns a Promise
 * that is resolved upon good signature or rejected upon bad signature.
 */
declare type LLVerify = (input: Uint8Array, sig: Uint8Array) => Promise<void>;

declare namespace LLVerify {
    const OP: unique symbol;
    interface Verifiable {
        [OP]: (verifier: LLVerify) => Promise<void>;
    }
}

/**
 * Name longest prefix match algorithm.
 * @param name target name.
 * @param get callback function to retrieve entry by hexadecimal name prefix.
 */
declare function lpm<Entry>(name: Name, get: (prefixHex: string) => Entry | undefined): Iterable<Entry>;

/** NDNLPv2 service. */
declare class LpService {
    private readonly transport;
    constructor({ keepAlive, mtu, reassemblerCapacity, }: LpService.Options, transport: LpService.Transport);
    private readonly keepAlive?;
    private readonly mtu;
    private readonly fragmenter;
    private readonly reassembler;
    rx: (iterable: AsyncIterable<Decoder.Tlv>) => AsyncIterable<LpService.Packet | LpService.RxError>;
    private decode;
    private decodeL3;
    tx: (iterable: AsyncIterable<LpService.Packet>) => AsyncIterable<Uint8Array | LpService.TxError>;
    private encode;
}

declare namespace LpService {
    /** An object to report transport MTU. */
    interface Transport {
        /**
         * Return current transport MTU.
         */
        readonly mtu: number;
    }
    interface Options {
        /**
         * How often to send IDLE packets if nothing else was sent, in milliseconds.
         * Set false or zero to disable keep-alive.
         * @default 60000
         */
        keepAlive?: false | number;
        /**
         * Administrative MTU.
         * The lesser of this MTU and the transport's reported MTU is used for fragmentation.
         * @default Infinity
         */
        mtu?: number;
        /**
         * Maximum number of partial packets kept in the reassembler.
         * @default 16
         */
        reassemblerCapacity?: number;
    }
    type L3Pkt = Interest | Data | Nack;
    interface Packet {
        l3: L3Pkt;
        token?: Uint8Array;
    }
    class RxError extends Error {
        readonly packet: Uint8Array;
        constructor(inner: Error, packet: Uint8Array);
    }
    class TxError extends Error {
        readonly packet: L3Pkt;
        constructor(inner: Error, packet: L3Pkt);
    }
        {};
}

/**
 * Create certificate name from subject name, key name, or certificate name.
 * @param name subject name, key name, or certificate name.
 * @param opts.keyId keyId component, used only if input name is subject name.
 * @param opts.issuerId keyId, used only if input name is subject name or key name.
 * @param opts.version keyId, used only if input name is subject name or key name.
 */
declare function makeCertName(name: Name, opts?: Partial<Pick<CertNameFields, "keyId" | "issuerId" | "version">>): Name;

/**
 * Create key name from subject name, key name, or certificate name.
 * @param name subject name, key name, or certificate name.
 * @param opts.keyId keyId component, used only if input name is subject name.
 */
declare function makeKeyName(name: Name, opts?: Partial<Pick<KeyNameFields, "keyId">>): Name;

/** Create algorithm parameters to be compatible with PSync C++ library. */
declare function makePSyncCompatParam({ keyToBufferLittleEndian, expectedEntries, expectedSubscriptions, ibltCompression, contentCompression, }?: makePSyncCompatParam.Options): PSyncFull.Parameters & PSyncPartialPublisher.Parameters & PSyncPartialSubscriber.Parameters;

declare namespace makePSyncCompatParam {
    interface Options {
        /**
         * Whether to use little endian when converting uint32 key to Uint8Array.
         * PSync C++ library behaves differently on big endian and little endian machines,
         * https://github.com/named-data/PSync/blob/b60398c5fc216a1b577b9dbcf61d48a21cb409a4/PSync/detail/util.cpp#L126
         * This must be set to match other peers.
         * @default true
         */
        keyToBufferLittleEndian?: boolean;
        /**
         * Expected number of IBLT entries, i.e. expected number of updates in a sync cycle.
         * This is irrelevant to PartialSync consumer.
         * @default 80
         */
        expectedEntries?: number;
        /**
         * Estimated number of subscriptions in PartialSync consumer.
         * @default 16
         */
        expectedSubscriptions?: number;
        /**
         * Whether to use zlib compression on IBLT.
         * Default is no compression. Use `PSyncZlib` to set zlib compression.
         *
         * In PSync C++ library, default for FullSync depends on whether zlib is available at compile
         * time, and default for PartialSync is no compression.
         * This must be set to match other peers.
         */
        ibltCompression?: PSyncCodec.Compression;
        /**
         * Whether to use zlib compression on Data payload.
         * Default is no compression. Use `PSyncZlib` to set zlib compression.
         *
         * In PSync C++ library, default for FullSync depends on whether zlib is available at compile
         * time. For PartialSync, it is always no compression.
         * This must be set to match other peers.
         */
        contentCompression?: PSyncCodec.Compression;
    }
}

/** Create algorithm parameters to be compatible with PSync C++ library. */
declare function makeSyncpsCompatParam({ keyToBufferLittleEndian, expectedEntries, }?: makeSyncpsCompatParam.Options): SyncpsPubsub.Parameters;

declare namespace makeSyncpsCompatParam {
    interface Options {
        /**
         * Whether to use little endian when converting a uint32 key to a byte array.
         * ndn-ind behaves differently on big endian and little endian machines,
         * https://github.com/operantnetworks/ndn-ind/blob/dd934a7a5106cda6ea14675554427e12df1ce18f/src/lite/util/crypto-lite.cpp#L114
         * This must be set to match other peers.
         * @default true
         */
        keyToBufferLittleEndian?: boolean;
        /**
         * Expected number of IBLT entries, i.e. expected number of updates in a sync cycle.
         * @default 85
         */
        expectedEntries?: number;
    }
}

/** Container that associates a key with multiple distinct values. */
declare class MultiMap<K, V> extends KeyMultiMap<K, V, K> {
    constructor();
}

/** Nack packet. */
declare class Nack {
    interest: Interest;
    get reason(): number;
    set reason(v: number);
    header: NackHeader;
    constructor(interest: Interest, header?: NackHeader | number);
}

/** Nack header. */
declare class NackHeader {
    get reason(): number;
    set reason(v: number);
    private reason_;
    static decodeFrom(decoder: Decoder): NackHeader;
    constructor(reason?: number);
    encodeTo(encoder: Encoder): void;
}

declare const NackReason: {
    Congestion: number;
    Duplicate: number;
    NoRoute: number;
};

/**
 * Name.
 * This type is immutable.
 */
declare class Name {
    static decodeFrom(decoder: Decoder): Name;
    /** List of name components. */
    readonly comps: readonly Component[];
    /** Create empty name, or copy from other name, or parse from URI. */
    constructor(input?: NameLike);
    /** Parse from URI, with specific component parser. */
    constructor(uri: string, parseComponent?: (input: string) => Component);
    /** Construct from TLV-VALUE. */
    constructor(value: Uint8Array);
    /** Construct from components. */
    constructor(comps: readonly ComponentLike[]);
    private readonly valueEncoderBufSize?;
    private value_?;
    private uri_?;
    private hex_?;
    /** Number of name components. */
    get length(): number;
    /** Name TLV-VALUE. */
    get value(): Uint8Array;
    /** Name TLV-VALUE hexadecimal representation, good for map keys. */
    get valueHex(): string;
    /** Retrieve i-th component. */
    get(i: number): Component | undefined;
    /**
     * Retrieve i-th component.
     * @throws i-th component does not exist.
     */
    at(i: number): Component;
    /** Get URI string. */
    toString(): string;
    /** Get sub name [begin, end). */
    slice(begin?: number, end?: number): Name;
    /** Get prefix of n components. */
    getPrefix(n: number): Name;
    /** Append a component from naming convention. */
    append<A>(convention: NamingConvention<A, unknown>, v: A): Name;
    /** Append suffix with one or more components. */
    append(...suffix: readonly ComponentLike[]): Name;
    /** Return a copy of Name with a component replaced. */
    replaceAt(i: number, comp: ComponentLike): Name;
    /** Compare with other name. */
    compare(other: NameLike): Name.CompareResult;
    /** Determine if this name equals other. */
    equals(other: NameLike): boolean;
    /** Determine if this name is a prefix of other. */
    isPrefixOf(other: NameLike): boolean;
    private comparePrefix;
    encodeTo(encoder: Encoder): void;
}

declare namespace Name {
    function isNameLike(obj: any): obj is NameLike;
    function from(input: NameLike): Name;
    /** Name compare result. */
    enum CompareResult {
        /** lhs is less than, but not a prefix of rhs */
        LT = -2,
        /** lhs is a prefix of rhs */
        LPREFIX = -1,
        /** lhs and rhs are equal */
        EQUAL = 0,
        /** rhs is a prefix of lhs */
        RPREFIX = 1,
        /** rhs is less than, but not a prefix of lhs */
        GT = 2
    }
}

/** Named private key or secret key decrypter. */
declare interface NamedDecrypter<Asym extends boolean = any> extends Key<KeyKind.PrivateSecret<Asym>>, LLDecrypt.Key {
}

declare namespace NamedDecrypter {
    /** Named private key decrypter. */
    type PrivateKey = NamedDecrypter<true>;
    /** Named secret key decrypter. */
    type SecretKey = NamedDecrypter<false>;
}

/** Named public key or secret key encrypter. */
declare interface NamedEncrypter<Asym extends boolean = any> extends Key<KeyKind.PublicSecret<Asym>>, LLEncrypt.Key {
}

declare namespace NamedEncrypter {
    /** Named public key encrypter. */
    type PublicKey = NamedEncrypter<true>;
    /** Named secret key encrypter. */
    type SecretKey = NamedEncrypter<false>;
}

/** Named private key or secret key signer. */
declare interface NamedSigner<Asym extends boolean = any> extends Key<KeyKind.PrivateSecret<Asym>>, Signer {
    readonly sigType: number;
    /** Create a Signer that signs with this private key but a different KeyLocator. */
    withKeyLocator: (keyLocator: KeyLocator.CtorArg) => Signer;
}

declare namespace NamedSigner {
    /** Named private key signer. */
    type PrivateKey = NamedSigner<true>;
    /** Named secret key signer. */
    type SecretKey = NamedSigner<false>;
}

/** Named public key or secret key verifier. */
declare interface NamedVerifier<Asym extends boolean = any> extends Key<KeyKind.PublicSecret<Asym>>, Verifier {
    readonly sigType: number;
}

declare namespace NamedVerifier {
    /** Named public key verifier. */
    type PublicKey = NamedVerifier<true>;
    /** Named secret key verifier. */
    type SecretKey = NamedVerifier<false>;
}

/** Name or Name URI. */
declare type NameLike = Name | string;

/**
 * Map keyed by name.
 * Lookups may accept either name or name.valueHex.
 */
declare class NameMap<V> extends KeyMap<Name, V, string, string> {
    constructor();
}

/**
 * MultiMap keyed by name.
 * Lookups may accept either name or name.valueHex.
 */
declare class NameMultiMap<V> extends KeyMultiMap<Name, V, string, string> {
    constructor();
}

/**
 * MultiSet keyed by name.
 * Lookups may accept either name or name.valueHex.
 */
declare class NameMultiSet extends KeyMultiSet<Name, string, string> {
    constructor();
}

/**
 * Naming convention, which interprets a name component in a specific way.
 * @template A input type to construct component.
 * @template R output type to interpret component.
 */
declare interface NamingConvention<A, R = A> {
    /** Determine if a component follows this naming convention. */
    match: (comp: Component) => boolean;
    /** Create a component from input value following this naming convention. */
    create: (v: A) => Component;
    /** Parse value of a matched component. */
    parse: (comp: Component) => R;
}

declare namespace NamingConvention {
    /** A naming convention that supports alternate/pretty URI. */
    interface WithAltUri {
        /** Convert to alternate URI. */
        toAltUri: (comp: Component) => string;
        /**
         * Parse from alternate URI.
         * @returns component, or undefined if it cannot be parsed.
         */
        fromAltUri: (input: string) => Component | undefined;
    }
    function isConvention(obj: any): obj is NamingConvention<any>;
}

declare class NFW {
    private readonly topo;
    readonly nodeId: IdType;
    /** NDNts forwarder */
    fw: Forwarder;
    /** Local face for content store etc */
    localFace: FwFace;
    /** Push channel to local face */
    private localFaceTx;
    /** Browser Forwarding Provider */
    provider: ProviderBrowser;
    /** Security options */
    securityOptions?: {
        /** Signer object */
        signer: Signer;
        /** Verifier object */
        verifier: Verifier;
        /** Keychain */
        keyChain: KeyChain;
    };
    /** Forwarding table */
    fib: any[];
    /** Enable packet capture */
    capture: boolean;
    /** Content Store */
    private cs;
    /** Dead Nonce List */
    private dnl;
    /** Routing strategies */
    readonly strategies: {
        prefix: Name;
        strategy: string;
    }[];
    /** Default servers */
    defualtServers: DefaultServers;
    /** Connections to other NFWs */
    private connections;
    /** Aggregate of sent interests */
    private pit;
    /** Announcements current */
    private announcements;
    /** Extra parameters of node */
    private nodeExtra;
    /** Packet capture */
    private shark;
    constructor(topo: Topology, nodeId: IdType);
    node(): INode;
    nodeUpdated(): void;
    /** Update color of current node */
    updateColors(): void;
    /** Add traffic to link */
    private addLinkTraffic;
    private checkPrefixRegistrationMatches;
    private longestMatch;
    private allMatches;
    private expressInterest;
    private getConnection;
    strsFIB(): string[];
    getEndpoint(opts?: {}): Endpoint;
}

/** Create Encodable from non-negative integer. */
declare function NNI(n: number | bigint, { len, unsafe, }?: Options): Encodable;

declare namespace NNI {
    /** Determine if len is a valid length of encoded NNI. */
    function isValidLength(len: number): boolean;
    /** Decode non-negative integer as number. */
    function decode(value: Uint8Array, opts?: Options & {
        big?: false;
    }): number;
    /** Decode non-negative integer as bigint. */
    function decode(value: Uint8Array, opts: Options & {
        big: true;
    }): bigint;
    /** Error if n exceeds [0,MAX_SAFE_INTEGER] range. */
    function constrain(n: number, typeName: string): number;
    /** Error if n exceeds [0,max] range. */
    function constrain(n: number, typeName: string, max: number): number;
    /** Error if n exceeds [min,max] range. */
    function constrain(n: number, typeName: string, min: number, max: number): number;
}

/** Encrypter and decrypter that do nothing. */
declare const noopEncryption: Encrypter<any> & Decrypter<any>;

/** Signer and Verifier that do nothing. */
declare const noopSigning: Signer & Verifier;

/**
 * Signer for SigType.Null, a packet that is not signed.
 * @see https://redmine.named-data.net/projects/ndn-tlv/wiki/NullSignature
 */
declare const nullSigner: Signer;

declare interface Options {
    /** If set, use/enforce specific TLV-LENGTH. */
    len?: Len;
    /** If true, allow approximate integers. */
    unsafe?: boolean;
}

declare interface Options_2 extends ConsumerOptions, ProducerOptions {
    fw?: Forwarder;
}

declare namespace packet {
    export {
        lpm,
        AltUriConverter,
        AltUri,
        ComponentLike,
        Component,
        NamingConvention,
        ImplicitDigest,
        ParamsDigest,
        NameLike,
        Name,
        NameMap,
        NameMultiMap,
        NameMultiSet,
        LLEncrypt,
        LLDecrypt,
        Encrypter,
        Decrypter,
        noopEncryption,
        SignedInterestPolicy,
        LLSign,
        LLVerify,
        Signer,
        Verifier,
        noopSigning,
        digestSigning,
        nullSigner,
        TT,
        SigType,
        NackReason,
        Data,
        FwHint,
        Interest,
        KeyLocator,
        NackHeader,
        Nack,
        SigInfo
    }
}
export { packet }

declare interface PacketWithSignature {
    readonly name: Name;
    sigInfo?: SigInfo;
    sigValue: Uint8Array;
}

/**
 * Bloom filter algorithm parameters.
 *
 * All participants must agree on the same parameters in order to communicate.
 */
declare interface Parameters_2 {
    hash: HashFunction;
    projectedElementCount: number;
    falsePositiveProbability: number;
}

/** ParametersSha256DigestComponent */
declare const ParamsDigest: ParamsDigestComp;

declare class ParamsDigestComp extends DigestComp {
    /** ParamsDigest placeholder during Interest encoding. */
    readonly PLACEHOLDER: Component;
    constructor();
    /** Determine if comp is a ParamsDigest placeholder. */
    isPlaceholder(comp: Component): boolean;
    /** Find ParamsDigest or placeholder in name. */
    findIn(name: Name, matchPlaceholder?: boolean): number;
}

/** Parse a certificate name into fields. */
declare function parseCertName(name: Name): CertNameFields;

/** Parse a key name into fields. */
declare function parseKeyName(name: Name): KeyNameFields;

declare const PointSizes: {
    readonly "P-256": 32;
    readonly "P-384": 48;
    readonly "P-521": 66;
};

/** Pretty-print TLV-TYPE number. */
declare function printTT(tlvType: number): string;

/** Named private key. */
declare type PrivateKey = Key<"private">;

/** A running producer. */
declare interface Producer {
    readonly prefix: Name | undefined;
    readonly face: FwFace;
    readonly dataBuffer?: DataBuffer;
    /**
     * Process an Interest received elsewhere.
     *
     * Use case of this function:
     * 1. Producer A dynamically creates producer B upon receiving an Interest.
     * 2. Producer A can invoke this function to let producer B generate a response.
     * 3. The response should be sent by producer A.
     */
    processInterest: (interest: Interest) => Promise<Data | undefined>;
    /** Close the producer. */
    close: () => void;
}

/**
 * Producer handler function.
 *
 * The handler can return a Data to respond to the Interest, or return `undefined` to cause a timeout.
 *
 * If Options.dataBuffer is provided, the handler can access the DataBuffer via producer.dataBuffer .
 * The handler can return a Data to respond to the Interest, which is also inserted to the DataBuffer
 * unless Options.autoBuffer is set to false. If the handler returns `undefined`, the Interest is used
 * to query the DataBuffer, and any matching Data may be sent.
 */
declare type ProducerHandler = (interest: Interest, producer: Producer) => Promise<Data | undefined>;

declare interface ProducerOptions {
    /** Description for debugging purpose. */
    describe?: string;
    /** AbortSignal that allows closing the producer via AbortController. */
    signal?: AbortSignal;
    /**
     * Whether routes registered by producer would cause @ndn/fw internal FIB to stop matching toward
     * shorter prefixes. Default is true.
     *
     * If all nexthops of a FIB entry are set to non-capture, FIB lookup may continue onto nexthops
     * on FIB entries with shorter prefixes. One use case is in @ndn/sync package, where both local
     * and remote sync participants want to receive each other's Interests.
     */
    routeCapture?: boolean;
    /**
     * What name to be readvertised.
     * Ignored if prefix is undefined.
     */
    announcement?: EndpointProducer.RouteAnnouncement;
    /**
     * How many Interests to process in parallel.
     * Default is 1.
     */
    concurrency?: number;
    /**
     * If specified, automatically sign Data packets unless already signed.
     * This does not apply to Data packets manually inserted to the dataBuffer.
     */
    dataSigner?: Signer;
    /** Outgoing Data buffer. */
    dataBuffer?: DataBuffer;
    /**
     * Whether to add handler return value to buffer.
     * Default is true.
     * Ignored when dataBuffer is not specified.
     */
    autoBuffer?: boolean;
}

declare class ProviderBrowser implements ForwardingProvider {
    readonly LOG_INTERESTS = false;
    readonly BROWSER = 1;
    topo: Topology;
    pendingUpdatesNodes: {
        [id: string]: Partial<INode>;
    };
    pendingUpdatesEdges: {
        [id: string]: Partial<IEdge>;
    };
    defaultLatency: number;
    defaultLoss: number;
    contentStoreSize: number;
    latencySlowdown: number;
    private scheduledRouteRefresh;
    constructor();
    initialize: () => Promise<void>;
    initializePostNetwork: () => Promise<void>;
    edgeUpdated: (edge?: IEdge) => Promise<void>;
    nodeUpdated: (node?: INode) => Promise<void>;
    onNetworkClick: () => Promise<void>;
    sendPingInterest(from: INode, to: INode): void;
    sendInterest(name: string, node: INode): void;
    runCode(code: string, node: INode): Promise<void>;
    /** Schedule a refresh of static routes */
    scheduleRouteRefresh: () => void;
    /** Compute static routes */
    private computeRoutes;
    /** Ensure all nodes and edges are initialized */
    private ensureInitialized;
    downloadExperimentDump(): void;
    loadExperimentDump(): Promise<void>;
    loadExperimentDumpFromBin(val: ArrayBuffer): void;
}

declare class PSyncCodec {
    protected readonly ibltParams: IBLT.PreparedParameters;
    constructor(p: PSyncCodec.Parameters, ibltParams: IBLT.PreparedParameters);
    readonly uselessCompsAfterIblt: Component[];
    state2buffer(state: PSyncCore.State): Uint8Array;
    buffer2state(buffer: Uint8Array): PSyncCore.State;
}

declare interface PSyncCodec extends Readonly<PSyncCodec.Parameters>, IbltCodec {
}

declare namespace PSyncCodec {
    type Compression = Compression;
    interface Parameters {
        /** Compression method for IBLT in name component. */
        ibltCompression: Compression;
        /**
         * Number of useless components between IBLT and Version.
         * @see https://github.com/named-data/PSync/blob/b60398c5fc216a1b577b9dbcf61d48a21cb409a4/PSync/full-producer.cpp#L239
         */
        nUselessCompsAfterIblt: number;
        /** Compression method for State in segmented object. */
        contentCompression: Compression;
        /** Encode State to buffer (without compression). */
        encodeState: (state: PSyncCore.State) => Uint8Array;
        /** Decode State from buffer (without decompression). */
        decodeState: (payload: Uint8Array) => PSyncCore.State;
        /** Convert a name prefix to a Bloom filter key. */
        toBloomKey: (prefix: Name) => string | Uint8Array;
        /** Number of name components in an encoded Bloom filter. */
        encodeBloomLength: number;
        /** Encode a Bloom filter. */
        encodeBloom: (bf: BloomFilter) => Component[];
        /** Decode a Bloom filter. */
        decodeBloom: (Bloom: typeof BloomFilter, comps: readonly Component[]) => Promise<BloomFilter>;
    }
}

declare class PSyncCore {
    constructor(p: PSyncCore.Parameters);
    readonly ibltParams: IBLT.PreparedParameters;
    readonly threshold: number;
    readonly joinPrefixSeqNum: (ps: PSyncCore.PrefixSeqNum) => PSyncCore.PrefixSeqNumEncoded;
    readonly nodes: NameMap<PSyncNode>;
    readonly keys: Map<number, PSyncNode>;
    readonly iblt: IBLT;
    get(prefix: Name): PSyncNode | undefined;
    add(prefix: Name): PSyncNode;
    list(filter: (node: PSyncNode) => boolean): PSyncCore.State;
    onIncreaseSeqNum?: (node: PSyncNode, prevSeqNum: number, prevKey: number) => void;
}

declare namespace PSyncCore {
    interface PrefixSeqNum {
        prefix: Name;
        seqNum: number;
    }
    type State = PrefixSeqNum[];
    interface PrefixSeqNumEncoded {
        readonly value: Uint8Array;
        readonly hash: number;
    }
    interface Parameters {
        iblt: IBLT.Parameters;
        /** If IBLT diff has at least this number of entries, respond with SyncData right away. */
        threshold: number;
        /** Encode prefix and sequence number to byte array. */
        joinPrefixSeqNum: (ps: PrefixSeqNum) => PrefixSeqNumEncoded;
    }
}

/** PSync - FullSync participant. */
declare class PSyncFull extends PSyncFull_base implements SyncProtocol<Name> {
    constructor({ p, endpoint, describe, syncPrefix, syncReplyFreshness, signer, producerBufferLimit, syncInterestLifetime, syncInterestInterval, verifier, }: PSyncFull.Options);
    private readonly endpoint;
    readonly describe: string;
    private readonly syncPrefix;
    private readonly c;
    private readonly codec;
    private closed;
    private readonly pFreshness;
    private readonly pBuffer;
    private readonly pProducer;
    private readonly pPendings;
    private readonly cFetcher;
    private readonly cInterval;
    private cTimer;
    private cAbort?;
    private cCurrentInterestName?;
    private debug;
    /** Stop the protocol operation. */
    close(): void;
    get(prefix: Name): SyncNode<Name> | undefined;
    add(prefix: Name): SyncNode<Name>;
    private handleSyncInterest;
    private handleIncreaseSeqNum;
    private sendSyncData;
    private scheduleSyncInterest;
    private sendSyncInterest;
}

declare namespace PSyncFull {
    interface Parameters extends PSyncCore.Parameters, PSyncCodec.Parameters {
    }
    interface Options {
        /**
         * Algorithm parameters.
         * They must be the same on every peer.
         */
        p: Parameters;
        /** Endpoint for communication. */
        endpoint?: Endpoint;
        /** Description for debugging purpose. */
        describe?: string;
        /** Sync group prefix. */
        syncPrefix: Name;
        /**
         * FreshnessPeriod of sync reply Data packet.
         * @default 1000
         */
        syncReplyFreshness?: number;
        /**
         * Signer of sync reply Data packets.
         * Default is digest signing.
         */
        signer?: Signer;
        /**
         * How many sync reply segmented objects to keep in buffer.
         * This must be positive.
         * @default 32
         */
        producerBufferLimit?: number;
        /**
         * Sync Interest lifetime in milliseconds.
         * @default 1000
         */
        syncInterestLifetime?: number;
        /**
         * Interval between sync Interests, randomized within the range, in milliseconds.
         * @default [syncInterestLifetime/2+100,syncInterestLifetime/2+500]
         */
        syncInterestInterval?: IntervalRange;
        /**
         * Verifier of sync reply Data packets.
         * Default is no verification.
         */
        verifier?: Verifier;
    }
}

declare const PSyncFull_base: new () => TypedEventEmitter<Events>;

declare class PSyncNode implements SyncNode<Name>, PSyncCore.PrefixSeqNum {
    private readonly c;
    readonly id: Name;
    constructor(c: PSyncCore, id: Name);
    get prefix(): Name;
    get key(): number;
    private seq;
    private k;
    get seqNum(): number;
    set seqNum(v: number);
    /**
     * Change sequence number, for internal use.
     * @param v new sequence number.
     * @param triggerEvent whether to trigger onIncreaseSeqNum callback.
     */
    setSeqNum(v: number, triggerEvent?: boolean): void;
    remove(): void;
    /** Recompute `this.k` after changing sequence number. */
    private updateKey;
    private detachKey;
}

/** PSync - PartialSync publisher. */
declare class PSyncPartialPublisher extends PSyncPartialPublisher_base implements SyncProtocol<Name> {
    constructor({ p, endpoint, describe, syncPrefix, helloReplyFreshness, syncReplyFreshness, signer, producerBufferLimit, }: PSyncPartialPublisher.Options);
    private readonly endpoint;
    readonly describe: string;
    private readonly syncPrefix;
    private readonly c;
    private readonly codec;
    private closed;
    private readonly pBuffer;
    private readonly hFreshness;
    private readonly hProducer;
    private readonly sFreshness;
    private readonly sProducer;
    private readonly sPendings;
    private debug;
    /** Stop the protocol operation. */
    close(): void;
    get(prefix: Name): SyncNode<Name> | undefined;
    add(prefix: Name): SyncNode<Name>;
    private handleHelloInterest;
    private handleSyncInterest;
    private handleIncreaseSeqNum;
    private sendStateData;
}

declare namespace PSyncPartialPublisher {
    interface Parameters extends PSyncCore.Parameters, PSyncCodec.Parameters {
    }
    interface Options {
        /**
         * Algorithm parameters.
         * They must match the subscriber parameters.
         */
        p: Parameters;
        /** Endpoint for communication. */
        endpoint?: Endpoint;
        /** Description for debugging purpose. */
        describe?: string;
        /** Sync producer prefix. */
        syncPrefix: Name;
        /**
         * FreshnessPeriod of hello reply Data packet.
         * @default 1000
         */
        helloReplyFreshness?: number;
        /**
         * FreshnessPeriod of sync reply Data packet.
         * @default 1000
         */
        syncReplyFreshness?: number;
        /**
         * Signer of sync reply Data packets.
         * Default is digest signing.
         */
        signer?: Signer;
        /**
         * How many sync reply segmented objects to keep in buffer.
         * This must be positive.
         * @default 32
         */
        producerBufferLimit?: number;
    }
}

declare const PSyncPartialPublisher_base: new () => TypedEventEmitter<Events_2>;

/** PSync - PartialSync subscriber. */
declare class PSyncPartialSubscriber extends PSyncPartialSubscriber_base implements Subscriber<Name, Update, PSyncPartialSubscriber.TopicInfo> {
    constructor({ p, endpoint, describe, syncPrefix, syncInterestLifetime, syncInterestInterval, verifier, }: PSyncPartialSubscriber.Options);
    readonly describe: string;
    private readonly helloPrefix;
    private readonly syncPrefix;
    private readonly codec;
    private readonly encodeBloom;
    private closed;
    private readonly subs;
    private readonly prevSeqNums;
    private bloom;
    private ibltComp?;
    private readonly cFetcher;
    private readonly cInterval;
    private cTimer;
    private cAbort?;
    private debug;
    /** Stop the protocol operation. */
    close(): void;
    subscribe(topic: PSyncPartialSubscriber.TopicInfo): Sub;
    private handleRemoveTopic;
    private scheduleInterest;
    private sendInterest;
    private sendHelloInterest;
    private sendSyncInterest;
    private handleState;
}

declare namespace PSyncPartialSubscriber {
    interface Parameters extends PSyncCore.Parameters, PSyncCodec.Parameters {
        bloom: Parameters_2;
    }
    interface Options {
        /**
         * Algorithm parameters.
         * They must match the publisher parameters.
         */
        p: Parameters;
        /** Endpoint for communication. */
        endpoint?: Endpoint;
        /** Description for debugging purpose. */
        describe?: string;
        /** Sync producer prefix. */
        syncPrefix: Name;
        /**
         * Sync Interest lifetime in milliseconds.
         * @default 1000
         */
        syncInterestLifetime?: number;
        /**
         * Interval between sync Interests, randomized within the range, in milliseconds.
         * @default [syncInterestLifetime/2+100,syncInterestLifetime/2+500]
         */
        syncInterestInterval?: [min: number, max: number];
        /**
         * Verifier of sync reply Data packets.
         * Default is no verification.
         */
        verifier?: Verifier;
    }
    interface TopicInfo extends PSyncCore.PrefixSeqNum {
    }
}

declare const PSyncPartialSubscriber_base: new () => TypedEventEmitter<Events_3>;

/** Use zlib compression with PSync. */
declare const PSyncZlib: PSyncCodec.Compression;

declare interface PublicFields extends Omit<Fields_2, "paramsPortion" | "signedPortion"> {
}

declare interface PublicFields_2 extends Omit<Fields, "signedPortion" | "topTlv" | "topTlvDigest"> {
}

/** Named public key. */
declare type PublicKey = Key<"public">;

/** IV generator using all random bits. */
declare class RandomIvGen extends IvGen {
    protected generate(): Uint8Array;
}

/**
 * Create a random jitter generator function.
 * @param r jitter factor around 1.
 * @param x median value.
 * @returns jitter generator function.
 *
 * randomJitter(0.1, 2) generates random values within [1.8, 2.2].
 */
declare function randomJitter(r: number, x?: number): () => number;

/** Indicate an Interest has been rejected. */
declare class RejectInterest implements FwPacket<Interest> {
    reject: RejectInterest.Reason;
    l3: Interest;
    token?: unknown;
    constructor(reject: RejectInterest.Reason, l3: Interest, token?: unknown);
}

declare namespace RejectInterest {
    type Reason = "cancel" | "expire";
}

/** A function to generate retx intervals. */
declare type RetxGenerator = (interestLifetime: number) => Iterable<number>;

/** Interest retransmission policy options. */
declare interface RetxOptions {
    /**
     * Maximum number of retransmissions, excluding initial Interest.
     *
     * Default is 0, which disables retransmissions.
     */
    limit?: number;
    /**
     * Initial retx interval
     *
     * Default is 50% of InterestLifetime.
     */
    interval?: number;
    /**
     * Randomize retx interval within [1-randomize, 1+randomize].
     *
     * Suppose this is set to 0.1, an interval of 100ms would become [90ms, 110ms].
     * Default is 0.1.
     */
    randomize?: number;
    /**
     * Multiply retx interval by backoff factor after each retx.
     *
     * This number should be in range [1.0, 2.0].
     * Default is 1.0.
     */
    backoff?: number;
    /**
     * Maximum retx interval.
     *
     * Default is 90% of InterestLifetime.
     */
    max?: number;
}

/**
 * Interest retransmission policy.
 *
 * A number is interpreted as the limit.
 * Set 0 to disable retransmissions.
 */
declare type RetxPolicy = RetxOptions | RetxGenerator | number;

/** Sha256WithRsa signing algorithm. */
declare const RSA: SigningAlgorithm<{}, true, RSA.GenParams>;

declare namespace RSA {
    interface GenParams {
        modulusLength?: RsaModulusLength;
        /** Import PKCS#8 private key and SPKI public key instead of generating. */
        importPkcs8?: [pkcs8: Uint8Array, spki: Uint8Array];
    }
}

declare type RsaModulusLength = 2048 | 4096;

declare namespace RsaModulusLength {
    const Default: RsaModulusLength;
    const Choices: readonly RsaModulusLength[];
}

/** RSA-OAEP encryption algorithm. */
declare const RSAOAEP: EncryptionAlgorithm<{}, true, RSA.GenParams>;

declare interface Rule {
    update: (si: SigInfo, state: KeyState) => void;
    check: (si: SigInfo, state: KeyState) => () => void;
}

/** Yield all values from an iterable but catch any error. */
declare function safeIter<T>(iterable: AsyncIterable<T>, onError?: (err?: unknown) => void): AsyncIterableIterator<T>;

/** Named secret key. */
declare type SecretKey = Key<"secret">;

/** SHA256 digest. */
declare function sha256(input: Uint8Array): Promise<Uint8Array>;

/** SignatureInfo on Interest or Data. */
declare class SigInfo {
    static decodeFrom(decoder: Decoder): SigInfo;
    type: number;
    keyLocator?: KeyLocator;
    nonce?: Uint8Array;
    time?: number;
    seqNum?: bigint;
    readonly [Extensible.TAG]: ExtensionRegistry<SigInfo>;
    /**
     * Construct from flexible arguments.
     *
     * Arguments can include, in any order:
     * - SigInfo to copy from
     * - number as SigType
     * - KeyLocator, or Name/URI/KeyDigest to construct KeyLocator
     * - SigInfo.Nonce(v)
     * - SigInfo.Time(v)
     * - SigInfo.SeqNum(v)
     */
    constructor(...args: SigInfo.CtorArg[]);
    /**
     * Create an Encodable.
     * @param tt either TT.ISigInfo or TT.DSigInfo.
     */
    encodeAs(tt: number): EncodableObj;
    private encodeTo;
}

declare namespace SigInfo {
    function Nonce(v?: Uint8Array | number): CtorTag;
    /** Generate a random nonce. */
    function generateNonce(size?: number): Uint8Array;
    function Time(v?: number): CtorTag;
    function SeqNum(v: bigint): {
        [ctorAssign](si: SigInfo): void;
    };
    type CtorArg = SigInfo | number | KeyLocator.CtorArg | CtorTag;
    const registerExtension: <R>(ext: Extension<SigInfo, R>) => void;
    const unregisterExtension: (tt: number) => void;
}

/** Validation policy for SigInfo fields in signed Interest. */
declare class SignedInterestPolicy {
    private readonly owned;
    private readonly trackedKeys;
    private readonly records;
    private readonly rules;
    /**
     * Constructor.
     * @param opts options.
     * @param rules one or more rules created from SignedInterestPolicy.Nonce(),
     *              SignedInterestPolicy.Time(), SignedInterestPolicy.SeqNum().
     */
    constructor(opts: SignedInterestPolicy.Options, ...rules: Rule[]);
    constructor(...rules: Rule[]);
    /**
     * Assign SigInfo fields on an Interest before signing.
     * @param key signing key object to associate state with; if omitted, use global state.
     */
    update(interest: Interest, key?: object): void;
    /**
     * Check SigInfo of an Interest.
     * @returns a function to save state after the Interest has passed all verifications.
     */
    check({ sigInfo }: Interest): () => void;
    /**
     * Wrap an Interest to update/check SigInfo during signing/verification.
     * During signing, global state is being used because signer key cannot be detected.
     */
    wrapInterest(interest: Interest): Signer.Signable & Verifier.Verifiable;
    /**
     * Wrap a Signer to update SigInfo when signing an Interest.
     * State is associated with the provided Signer.
     */
    makeSigner(inner: Signer): Signer;
    /** Wrap a Verifier to check the policy when verifying an Interest. */
    makeVerifier(inner: Verifier, { passData, passUnsignedInterest, }?: SignedInterestPolicy.WrapOptions): Verifier;
}

declare namespace SignedInterestPolicy {
    interface Options {
        /**
         * How many distinct public keys to keep track.
         * Each different KeyLocator Name or KeyDigest is tracked separately.
         *
         * Minimum is 1.
         * @default 256
         */
        trackedKeys?: number;
    }
    interface WrapOptions {
        /**
         * If true, non-Interest packets are passed through to the inner Verifier.
         * If false, non-Interest packets are rejected.
         * @default true
         */
        passData?: boolean;
        /**
         * If true, Interests without SigInfo are passed through to the inner Verifier.
         * If false, Interests without SigInfo are rejected.
         * @default false
         */
        passUnsignedInterest?: boolean;
    }
    interface NonceOptions {
        /**
         * Length of generated SigNonce.
         *
         * Minimum is 1.
         * @default 8
         */
        nonceLength?: number;
        /**
         * Minimum required length of SigNonce.
         *
         * Minimum is 1.
         * @default 8
         */
        minNonceLength?: number;
        /**
         * How many distinct SigNonce values to keep track, within each public key.
         *
         * Minimum is 1.
         * @default 256
         */
        trackedNonces?: number;
    }
    /**
     * Create a rule to assign or check SigNonce.
     *
     * This rule assigns a random SigNonce of `nonceLength` octets that does not duplicate
     * last `trackedNonces` values.
     *
     * This rule rejects an Interest on any of these conditions:
     * - SigNonce is absent.
     * - SigNonce has fewer than `minNonceLength` octets.
     * - SigNonce value duplicates any of last `trackedNonces` values.
     */
    function Nonce(opts?: NonceOptions): Rule;
    interface TimeOptions {
        /**
         * Maximum allowed clock offset in milliseconds.
         *
         * Minimum is 0. However, setting to 0 is inadvisable because it would require consumer and
         * producer to have precisely synchronized clocks.
         * @default 60000
         */
        maxClockOffset?: number;
    }
    /**
     * Create a rule to assign or check SigTime.
     *
     * This rule assigns SigTime to be same as current timestamp, but may increment if it
     * duplicates the previous value.
     *
     * This rule rejects an Interest on any of these conditions:
     * - SigTime is absent.
     * - SigTime differs from current timestamp by more than `maxClockOffset` milliseconds.
     * - SigTime value is less than or equal to a previous value.
     *
     * This check logic differs from NDN Packet Format v0.3 specification (as of 2020-September) in
     * that `maxClockOffset` is checked on every Interest rather than only the "initial" Interest.
     * It is the same behavior as ndn-cxx v0.7.1 implementation.
     * This logic offers better consistency as it has less dependency on internal state of the
     * SignedInterestPolicy. However, persistently sending more than 1000 signed Interests per second
     * would eventually push SigTime out of `maxClockOffset` range and cause rejections.
     */
    function Time(opts?: TimeOptions): Rule;
    interface SeqNumOptions {
        /**
         * Initial sequence number.
         * @default 0n
         */
        initialSeqNum?: bigint;
    }
    /**
     * Create a rule to assign or check SigSeqNum.
     *
     * This rule assigns SigSeqNum to `initialSegNum`, or increments from previous value.
     *
     * This rule rejects an Interest on any of these conditions:
     * (1) SigSeqNum is absent.
     * (2) SigSeqNum value is less than or equal to a previous value.
     */
    function SeqNum(opts?: SeqNumOptions): Rule;
}

/** High level signer, such as a named private key. */
declare interface Signer {
    /** Sign a packet. */
    sign: (pkt: Signer.Signable) => Promise<void>;
}

declare namespace Signer {
    interface Signable extends PacketWithSignature, LLSign.Signable {
    }
    /**
     * Put SigInfo on packet if it does not exist.
     * @param pkt target packet.
     * @param sigType optionally set sigType.
     * @param keyLocator optionally set keyLocator; false to delete KeyLocator.
     */
    function putSigInfo(pkt: PacketWithSignature, sigType?: number, keyLocator?: KeyLocator.CtorArg | false): SigInfo;
}

/** WebCrypto based signing algorithm implementation. */
declare interface SigningAlgorithm<I = any, Asym extends boolean = any, G = any> extends CryptoAlgorithm<I, Asym, G> {
    readonly sigType: number;
    makeLLSign: If<Asym, (key: CryptoAlgorithm.PrivateKey<I>) => LLSign, (key: CryptoAlgorithm.SecretKey<I>) => LLSign, unknown>;
    makeLLVerify: If<Asym, (key: CryptoAlgorithm.PublicKey<I>) => LLVerify, (key: CryptoAlgorithm.SecretKey<I>) => LLVerify, unknown>;
}

/**
 * A full list of signing algorithms.
 * This list currently contains ECDSA, RSA, HMAC, and Ed25519.
 */
declare const SigningAlgorithmListFull: readonly SigningAlgorithm[];

/**
 * A slim list of signing algorithms.
 * This list currently contains ECDSA.
 * If you need more algorithms, explicitly import them or use SigningAlgorithmListFull.
 */
declare const SigningAlgorithmListSlim: readonly SigningAlgorithm[];

declare type SigningOptG<I, Asym extends boolean, G> = {} extends G ? [SigningAlgorithm<I, Asym, G>, G?] : [SigningAlgorithm<I, Asym, G>, G];

declare const SigType: {
    Sha256: number;
    Sha256WithRsa: number;
    Sha256WithEcdsa: number;
    HmacWithSha256: number;
    Ed25519: number;
    Null: number;
};

/** KV store where each key is a Name. */
declare abstract class StoreBase<T> {
    private readonly provider;
    private readonly mutex;
    constructor(provider: StoreProvider<T>);
    get canSClone(): boolean;
    /** List item names. */
    list(): Promise<Name[]>;
    /** Erase item by name. */
    erase(name: Name): Promise<void>;
    protected getValue(name: Name): Promise<T>;
    protected insertValue(name: Name, value: T): Promise<void>;
    protected bufferToStorable(input: Uint8Array | string): Uint8Array | string;
}

declare namespace StoreBase {
    function bufferFromStorable(input: Uint8Array | string): Uint8Array;
}

declare interface StoredCert {
    certBuffer: Uint8Array | string;
}

/**
 * KV store provider where each key is a string.
 * Methods are called one at a time.
 */
declare interface StoreProvider<T> {
    /**
     * Indicate whether the store provider supports the structured clone algorithm.
     * If false, values must be serialized as JSON.
     */
    readonly canSClone: boolean;
    list: () => Promise<string[]>;
    get: (key: string) => Promise<T>;
    insert: (key: string, value: T) => Promise<void>;
    erase: (key: string) => Promise<void>;
}

declare type Sub = Subscription<Name, SyncUpdate<Name>>;

declare interface Subscriber<Topic = Name, Update = any, SubscribeInfo = Topic> {
    subscribe: (topic: SubscribeInfo) => Subscription<Topic, Update>;
}

/**
 * A subscription on a topic.
 * Listen to the 'update' event to receive updates on incoming publications matching the topic.
 */
declare interface Subscription<Topic = Name, Update = SyncUpdate<Topic>> extends TypedEventEmitter<Subscription.Events<Update>> {
    /** The topic. */
    readonly topic: Topic;
    /** Unsubscribe. */
    remove(): void;
}

declare namespace Subscription {
    type Events<Update> = {
        /** Emitted when a subscription update is received. */
        update: (update: Update) => void;
    };
}

/** SVS-PS MappingEntry element. */
declare class SvMappingEntry implements EncodableObj {
    seqNum: number;
    name: Name;
    static decodeFrom(decoder: Decoder): SvMappingEntry;
    encodeTo(encoder: Encoder): void;
    protected encodeValueExt(): Encodable[];
}

declare namespace SvMappingEntry {
    interface Constructor<M extends SvMappingEntry = SvMappingEntry> extends Decodable<M> {
        new (): M;
    }
    /** Class decorator on an extensible MappingEntry subclass. */
    function extend<M extends SvMappingEntry & Extensible>(ctor: new () => M): void;
}

/** SVS-PS publisher. */
declare class SvPublisher {
    constructor({ endpoint, sync, id, store, chunkSize, innerSigner, outerSigner, mappingSigner, }: SvPublisher.Options);
    private readonly node;
    private readonly nodeSyncPrefix;
    private readonly store;
    private readonly chunkOptions;
    private readonly innerSigner;
    private readonly outerSigner;
    private readonly outerProducer;
    private readonly mappingProducer;
    /** Publisher node ID. */
    get id(): Name;
    /**
     * Stop publisher operations.
     * This does not stop the SvSync instance or the DataStore.
     */
    close(): Promise<void>;
    /**
     * Publish application data.
     * @param name application-specified inner name.
     * @param payload application payload.
     * @param entry MappingEntry for subscriber-side filtering.
     *              This is required if subscribers are expecting a certain MappingEntry subclass.
     * @returns seqNum.
     */
    publish(name: NameLike, payload: Uint8Array, entry?: SvMappingEntry): Promise<number>;
    private readonly handleOuter;
    private readonly handleMapping;
}

declare namespace SvPublisher {
    type DataStore = DataStore.Get & DataStore.Find & DataStore.Insert;
    interface Options {
        /** Endpoint for communication. */
        endpoint?: Endpoint;
        /**
         * SvSync instance.
         *
         * Multiple SvSubscribers and SvPublishers may reuse the same SvSync instance. However,
         * publications from a SvPublisher cannot reach SvSubscribers on the same SvSync instance.
         */
        sync: SvSync;
        /** Publisher node ID. */
        id: Name;
        /**
         * Data repository used for this publisher.
         * DataStore type from @ndn/repo package satisfies the requirement.
         * Other lightweight implementations may be possible.
         */
        store: DataStore;
        /**
         * Segment chunk size of inner Data packet.
         * Default is 8000.
         */
        chunkSize?: number;
        /**
         * Inner Data signer.
         * Default is NullSigning.
         */
        innerSigner?: Signer;
        /**
         * Outer Data signer.
         * Default is NullSigning.
         */
        outerSigner?: Signer;
        /**
         * Mapping Data signer.
         * Default is NullSigning.
         */
        mappingSigner?: Signer;
    }
}

/**
 * SVS-PS subscriber.
 *
 * MappingEntry is a subclass of SvMappingEntry.
 * If it is not SvMappingEntry base class, its constructor must be specified in Options.mappingEntryType.
 */
declare class SvSubscriber<MappingEntry extends SvMappingEntry = SvMappingEntry> extends SvSubscriber_base implements Subscriber<Name, SvSubscriber.Update, SvSubscriber.SubscribeInfo<MappingEntry>> {
    constructor({ endpoint, sync, retxLimit, mappingBatch, mappingEntryType, mustFilterByMapping, innerVerifier, outerVerifier, mappingVerifier, }: SvSubscriber.Options);
    private readonly abort;
    private readonly endpoint;
    private readonly syncPrefix;
    private readonly nameSubs;
    private readonly nameFilters;
    private readonly publisherSubs;
    private readonly mappingBatch;
    private readonly mappingEVD;
    private readonly mustFilterByMapping;
    private readonly innerVerifier;
    private readonly outerFetchOpts;
    private readonly outerConsumerOpts;
    private readonly mappingConsumerOpts;
    /**
     * Stop subscriber operations.
     * This does not stop the SvSync instance.
     */
    close(): void;
    /** Subscribe to either a topic prefix or a publisher node ID. */
    subscribe(topic: SvSubscriber.SubscribeInfo<MappingEntry>): Subscription<Name, SvSubscriber.Update>;
    private readonly handleSyncUpdate;
    private retrieveMapping;
    private dispatchUpdate;
    private listNameSubs;
    private retrieveSegmented;
}

declare namespace SvSubscriber {
    interface Options {
        /** Endpoint for communication. */
        endpoint?: Endpoint;
        /**
         * SvSync instance.
         * See notes on SvPublisher.Options regarding reuse.
         */
        sync: SvSync;
        /**
         * Retransmission limit for Data retrieval.
         * Default is 2.
         */
        retxLimit?: number;
        /**
         * Maximum number of MappingEntry to retrieve in a single query.
         * Default is 10.
         * @see https://github.com/named-data/ndn-svs/blob/e39538ed1ddd789de9a34c242af47c3ba4f3583d/ndn-svs/svspubsub.cpp#L199
         */
        mappingBatch?: number;
        /**
         * MappingEntry constructor.
         * Default is MappingEntry base type.
         */
        mappingEntryType?: SvMappingEntry.Constructor;
        /**
         * When an update matches a SubscribePublisher, by default the MappingData is not retrieved.
         * Since the filter functions in SubscribePrefixFilter depend on MappingEntry, they are not called, and
         * each SubscribePrefixFilter is treated like a SubscribePrefix, which would receive the message if
         * the topic prefix matches.
         * Set this option to true forces the retrieval of MappingData and ensures filter functions are called.
         */
        mustFilterByMapping?: boolean;
        /**
         * Inner Data verifier.
         * Default is no verification.
         */
        innerVerifier?: Verifier;
        /**
         * Outer Data verifier.
         * Default is no verification.
         */
        outerVerifier?: Verifier;
        /**
         * Mapping Data verifier.
         * Default is no verification.
         */
        mappingVerifier?: Verifier;
    }
    /** Subscribe parameters. */
    type SubscribeInfo<MappingEntry extends SvMappingEntry> = SubscribePrefix | SubscribePrefixFilter<MappingEntry> | SubscribePublisher;
    /** Subscribe to messages udner a name prefix. */
    type SubscribePrefix = Name;
    /** Subscribe to messages under a name prefix that passes a filter. */
    interface SubscribePrefixFilter<MappingEntry extends SvMappingEntry> {
        /** Topic prefix. */
        prefix: Name;
        /**
         * Filter function to determine whether to retrieve a message based on MappingEntry.
         * See limitations in Options.mustFilterByMapping.
         */
        filter(entry: MappingEntry): boolean;
    }
    /** Subscribe to messages from the specified publisher. */
    interface SubscribePublisher {
        publisher: Name;
    }
    /** Received update. */
    interface Update {
        readonly publisher: Name;
        readonly seqNum: number;
        readonly name: Name;
        readonly payload: Uint8Array;
    }
}

declare const SvSubscriber_base: new () => TypedEventEmitter<Events_5>;

/** StateVectorSync participant. */
declare class SvSync extends SvSync_base implements SyncProtocol<Name> {
    constructor({ endpoint, describe, syncPrefix, syncInterestLifetime, steadyTimer, suppressionTimer, signer, verifier, }: SvSync.Options);
    private readonly endpoint;
    readonly describe: string;
    readonly syncPrefix: Name;
    private readonly syncInterestLifetime;
    private readonly steadyTimer;
    private readonly suppressionTimer;
    private readonly signer;
    private readonly verifier?;
    private readonly producer;
    /** Own state vector. */
    private readonly own;
    /**
     * In steady state, undefined.
     * In suppression state, aggregated state vector of incoming sync Interests.
     */
    private aggregated?;
    /** Sync Interest timer. */
    private timer;
    private debug;
    close(): void;
    get(id: NameLike): SyncNode<Name>;
    add(id: NameLike): SyncNode<Name>;
    private readonly handlePublish;
    private readonly handleSyncInterest;
    private resetTimer;
    private readonly handleTimer;
    private sendSyncInterest;
}

declare namespace SvSync {
    /**
     * Timer settings.
     * ms: median interval in milliseconds.
     * jitter: ± percentage, in [0.0, 1.0) range.
     */
    type Timer = [ms: number, jitter: number];
    interface Options {
        /** Endpoint for communication. */
        endpoint?: Endpoint;
        /** Description for debugging purpose. */
        describe?: string;
        /** Sync group prefix. */
        syncPrefix: Name;
        /**
         * Sync Interest lifetime in milliseconds.
         * @default 1000
         */
        syncInterestLifetime?: number;
        /**
         * Sync Interest timer in steady state.
         * Default is [30000ms, ±10%]
         */
        steadyTimer?: Timer;
        /**
         * Sync Interest timer in suppression state.
         * Default is [200ms, ±50%]
         */
        suppressionTimer?: Timer;
        /**
         * Sync Interest signer.
         * Default is NullSigning.
         */
        signer?: Signer;
        /**
         * Sync Interest verifier.
         * Default is no verification.
         */
        verifier?: Verifier;
    }
}

declare const SvSync_base: new () => TypedEventEmitter<Events_4>;

/** SVS-PS MappingEntry with Timestamp element. */
declare class SvTimedMappingEntry extends SvMappingEntry implements Extensible {
    constructor();
    readonly [Extensible.TAG]: ExtensionRegistry<Extensible>;
    timestamp: Date | undefined;
}

declare namespace sync {
    export {
        IBLT,
        makePSyncCompatParam,
        PSyncFull,
        PSyncZlib,
        PSyncPartialPublisher,
        PSyncPartialSubscriber,
        SvSync,
        SvPublisher,
        SvSubscriber,
        SvMappingEntry,
        SvTimedMappingEntry,
        makeSyncpsCompatParam,
        SyncpsPubsub,
        SyncProtocol,
        SyncNode,
        SyncUpdate,
        Subscriber,
        Subscription
    }
}
export { sync }

/**
 * A sync protocol node.
 *
 * Each sync protocol participant may have zero or more nodes.
 */
declare interface SyncNode<ID = any> {
    /**
     * Node identifier.
     * This is typically a number or a Name.
     */
    readonly id: ID;
    /**
     * Current sequence number.
     * It can be increased, but cannot be decreased.
     */
    seqNum: number;
    /**
     * Remove this node from participating in the sync protocol.
     * This may or may not have effect, depending on the sync protocol.
     */
    remove(): void;
}

/** A sync protocol participant. */
declare interface SyncProtocol<ID = any> extends TypedEventEmitter<SyncProtocol.Events<ID>> {
    /** Stop the protocol operation. */
    close(): void;
    /** Retrieve a node. */
    get(id: ID): SyncNode<ID> | undefined;
    /** Retrieve or create a node. */
    add(id: ID): SyncNode<ID>;
}

declare namespace SyncProtocol {
    type Events<ID> = {
        /** Emitted when a node is updated, i.e. has new sequence numbers. */
        update: (update: SyncUpdate<ID>) => void;
    };
}

declare class SyncpsCodec {
    protected readonly ibltParams: IBLT.PreparedParameters;
    constructor(p: SyncpsCodec.Parameters, ibltParams: IBLT.PreparedParameters);
}

declare interface SyncpsCodec extends Readonly<SyncpsCodec.Parameters>, IbltCodec {
}

declare namespace SyncpsCodec {
    type Compression = Compression;
    interface Parameters {
        /** Compression method for IBLT in name component. */
        ibltCompression: Compression;
        /** Compute the hash of a publication. */
        hashPub: (pub: Data) => number;
        /** Encode Content to buffer. */
        encodeContent: (pubs: readonly Data[], maxSize: number) => [wire: Uint8Array, count: number];
        /** Decode Content from buffer. */
        decodeContent: (payload: Uint8Array) => Data[];
    }
}

/** syncps - pubsub service. */
declare class SyncpsPubsub extends SyncpsPubsub_base implements Subscriber<Name, Data> {
    constructor({ p, endpoint, describe, syncPrefix, syncInterestLifetime, syncDataPubSize, syncSigner, syncVerifier, maxPubLifetime, maxClockSkew, modifyPublication, isExpired, filterPubs, pubSigner, pubVerifier, }: SyncpsPubsub.Options);
    private readonly endpoint;
    readonly describe: string;
    private readonly syncPrefix;
    private readonly codec;
    private closed;
    private readonly iblt;
    private readonly pubs;
    private readonly maxPubLifetime;
    private readonly maxClockSkew;
    private readonly subs;
    private readonly dModify;
    private readonly dIsExpired;
    private readonly dSigner;
    private readonly dVerifier?;
    private nOwnPubs;
    /** IBLT of own publications with callback. */
    private readonly dConfirmIblt;
    private readonly pProducer;
    private readonly pFilter;
    private readonly pPubSize;
    private readonly pPendings;
    private readonly cVerifier?;
    private readonly cLifetime;
    private cAbort?;
    private cTimer;
    private cCurrentInterestNonce?;
    private cDelivering;
    private debug;
    /** Stop the protocol operation. */
    close(): void;
    /**
     * Publish a packet.
     * @param pub a Data packet. This does not need to be signed.
     * @param cb a callback to get notified whether publication is confirmed,
     *           i.e. its hash appears in a sync Interest from another participant.
     * @returns a Promise that resolves when the publication is recorded.
     *          It does not mean the publication has reached other participants.
     */
    publish(pub: Data, cb?: SyncpsPubsub.PublishCallback): Promise<void>;
    /**
     * Subscribe to a topic.
     * @param topic a name prefix.
     */
    subscribe(topic: Name): Subscription<Name, Data>;
    private handleSyncInterest;
    private processSyncInterest;
    private processPendingInterests;
    private scheduleSyncInterest;
    private sendSyncInterest;
    private isExpired;
    private addToActive;
    private invokePublishCb;
}

declare namespace SyncpsPubsub {
    interface Parameters extends SyncpsCodec.Parameters {
        iblt: IBLT.Parameters;
    }
    type ModifyPublicationCallback = (pub: Data) => void;
    /**
     * Callback to determine if a publication is expired.
     *
     * The callback can return either:
     * - boolean to indicate whether the publication is expired.
     * - number, interpreted as Unix timestamp (milliseconds) of publication creation time.
     *   The publication is considered expired if this timestamp is before
     *   `NOW - (maxPubLifetime+maxClockSkew)` or after `NOW + maxClockSkew`.
     */
    type IsExpiredCallback = (pub: Data) => boolean | number;
    interface FilterPubItem {
        /** A publication, i.e. Data packet. */
        readonly pub: Data;
        /** Whether the publication is owned by the local participant. */
        readonly own: boolean;
    }
    /**
     * Callback to decide what publications to be included in a response.
     * Argument contains unexpired publications only.
     * It should return a priority list of publications to be included in the response.
     */
    type FilterPubsCallback = (items: FilterPubItem[]) => FilterPubItem[];
    interface Options {
        /**
         * Algorithm parameters.
         * They must be the same on every peer.
         */
        p: Parameters;
        /** Endpoint for communication. */
        endpoint?: Endpoint;
        /** Description for debugging purpose. */
        describe?: string;
        /** Sync group prefix. */
        syncPrefix: Name;
        /**
         * Sync Interest lifetime in milliseconds.
         * @default 4000
         */
        syncInterestLifetime?: number;
        /**
         * Advisory maximum size for publications included in a sync reply Data packet.
         * @default 1300
         */
        syncDataPubSize?: number;
        /**
         * Signer of sync reply Data packets.
         * Default is digest signing.
         */
        syncSigner?: Signer;
        /**
         * Verifier of sync reply Data packets.
         * Default is no verification.
         */
        syncVerifier?: Verifier;
        /**
         * Publication lifetime.
         * @default 1000
         */
        maxPubLifetime?: number;
        /**
         * Maximum clock skew, for calculating timers.
         * @default 1000
         */
        maxClockSkew?: number;
        /**
         * Callback to modify publication before it's signed.
         * Default is appending a TimestampNameComponent to the name.
         */
        modifyPublication?: ModifyPublicationCallback;
        /**
         * Callback to determine if a publication is expired.
         * Default is interpreting the last component as TimestampNameComponent;
         * if the last component is not a TimestampNameComponent, it is seen as expired.
         */
        isExpired?: IsExpiredCallback;
        /**
         * Callback to decide what publications to be included in a response.
         * Default is: respond nothing if there's no own publication; otherwise,
         * prioritize own publications over others, and prioritize later timestamp.
         */
        filterPubs?: FilterPubsCallback;
        /**
         * Signer of publications.
         * Default is digest signing.
         */
        pubSigner?: Signer;
        /**
         * Verifier of publications.
         * Default is no verification.
         */
        pubVerifier?: Verifier;
    }
    type PublishCallback = (pub: Data, confirmed: boolean) => void;
}

declare const SyncpsPubsub_base: new () => TypedEventEmitter<Events_6>;

/** A received update regarding a node. */
declare class SyncUpdate<ID = any> {
    readonly node: SyncNode<ID>;
    readonly loSeqNum: number;
    readonly hiSeqNum: number;
    /**
     * Constructor.
     * @param node the node.
     * @param loSeqNum low sequence number, inclusive.
     * @param hiSeqNum high sequence number, inclusive.
     */
    constructor(node: SyncNode<ID>, loSeqNum: number, hiSeqNum: number);
    /** Node identifier. */
    get id(): ID;
    /** Number of new sequence numbers. */
    get count(): number;
    /** Iterate over new sequence numbers. */
    seqNums(): Iterable<number>;
}

/** Timing-safe equality comparison. */
declare function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;

declare namespace tlv {
    export {
        Decodable,
        Decoder,
        EncodableObj,
        EncodableTlv,
        Encodable,
        Encoder,
        EvDecoder,
        Extensible,
        Extension,
        ExtensionRegistry,
        NNI,
        printTT
    }
}
export { tlv }

/** Convert byte array to upper-case hexadecimal string. */
declare function toHex(buf: Uint8Array): string;

declare namespace toHex {
    /** Conversion table from byte (0x00~0xFF) to upper-case hexadecimal. */
    const TABLE: Readonly<Record<number, string>>;
}

/**
 * Get key name from key name or certificate name.
 * @throws input name is neither key name nor certificate name.
 */
declare function toKeyName(name: Name): Name;

declare class Topology {
    provider: ForwardingProvider;
    readonly nodes: DataSet<INode, "id">;
    readonly edges: DataSet<IEdge, "id">;
    network: Network;
    imported?: 'MININDN' | 'BROWSER';
    busiestNode?: INode;
    busiestLink?: IEdge;
    selectedNode?: INode;
    selectedEdge?: IEdge;
    selectedPacket?: ICapturedPacket;
    captureAll: boolean;
    pendingClickEvent?: (params: any) => void;
    globalCaptureFilter: (packet: ICapturedPacket) => boolean;
    activePtys: IPty[];
    tlvTypesCode: string;
    constructor(provider: ForwardingProvider);
    /** Initialize the network */
    createNetwork: (container: HTMLElement) => Promise<void>;
    /** Update objects every animation frame */
    runAnimationFrame(): void;
    /** Handler */
    private onNetworkClick;
    /** Ensure all nodes and edges are initialized */
    private ensureInitialized;
    updateNodeColor(nodeId: IdType, nodeExtra?: INodeExtra): void;
    updateEdgeColor(edge: IEdge): void;
}

/** Get subject name from subject name, key name, or certificate name. */
declare function toSubjectName(name: Name): Name;

/** Convert string to UTF-8 byte array. */
declare function toUtf8(s: string): Uint8Array;

/**
 * Keep records on whether an event listener has been added.
 * This may allow EventTarget subclass to skip certain event generation code paths.
 * Tracking is imprecise: it does not consider 'once' and 'removeEventListener'.
 * @param target EventTarget to override.
 * @returns map from event type to whether listeners may exist.
 */
declare function trackEventListener(target: EventTarget): Record<string, boolean>;

/**
 * Low-level transport.
 *
 * The transport understands NDN TLV structures, but does not otherwise concern with packet format.
 */
declare abstract class Transport {
    readonly attributes: Transport.Attributes;
    abstract readonly rx: Transport.Rx;
    abstract readonly tx: Transport.Tx;
    protected constructor(attributes: Transport.Attributes);
    /**
     * Return the transport MTU, if known.
     * The transport should be able to send TLV structure of up to this size.
     */
    get mtu(): number;
    /**
     * Reopen the transport after it has failed.
     * @returns the same transport or a new transport after it has been reconnected.
     */
    reopen(): Promise<Transport>;
    toString(): string;
}

declare namespace Transport {
    interface Attributes extends Record<string, any> {
        /**
         * Textual description.
         * Default is automatically generated from constructor name.
         */
        describe?: string;
        /**
         * Whether the transport connects to a destination on the local machine.
         * Default is false.
         */
        local?: boolean;
        /**
         * Whether the transport can possibly talk to multiple peers.
         * Default is false;
         */
        multicast?: boolean;
    }
    /** RX iterable for incoming packets. */
    type Rx = AsyncIterable<Decoder.Tlv>;
    /**
     * TX function for outgoing packets.
     * @returns Promise that resolves when iterable is exhausted, and rejects upon error.
     */
    type Tx = (iterable: AsyncIterable<Uint8Array>) => Promise<void>;
    /**
     * Error thrown by transport.reopen() to indicate that reopen operation is not supported.
     * No further reopen() will be attempted.
     */
    class ReopenNotSupportedError extends Error {
        constructor();
    }
}

declare const TT: {
    Name: number;
    GenericNameComponent: number;
    ImplicitSha256DigestComponent: number;
    ParametersSha256DigestComponent: number;
    Interest: number;
    CanBePrefix: number;
    MustBeFresh: number;
    ForwardingHint: number;
    Nonce: number;
    InterestLifetime: number;
    HopLimit: number;
    AppParameters: number;
    ISigInfo: number;
    ISigValue: number;
    Data: number;
    MetaInfo: number;
    ContentType: number;
    FreshnessPeriod: number;
    FinalBlock: number;
    Content: number;
    DSigInfo: number;
    DSigValue: number;
    SigType: number;
    KeyLocator: number;
    KeyDigest: number;
    SigNonce: number;
    SigTime: number;
    SigSeqNum: number;
    Nack: number;
    NackReason: number;
};

/**
 * Type-safe event emitter.
 *
 * Use it like this:
 *
 * ```typescript
 * type MyEvents = {
 *   error: (error: Error) => void;
 *   message: (from: string, content: string) => void;
 * }
 *
 * const myEmitter = new EventEmitter() as TypedEmitter<MyEvents>;
 *
 * myEmitter.emit("error", "x")  // <- Will catch this type error;
 * ```
 */
declare interface TypedEventEmitter<Events extends EventMap> {
    addListener<E extends keyof Events> (event: E, listener: Events[E]): this
    on<E extends keyof Events> (event: E, listener: Events[E]): this
    once<E extends keyof Events> (event: E, listener: Events[E]): this
    prependListener<E extends keyof Events> (event: E, listener: Events[E]): this
    prependOnceListener<E extends keyof Events> (event: E, listener: Events[E]): this

    off<E extends keyof Events>(event: E, listener: Events[E]): this
    removeAllListeners<E extends keyof Events> (event?: E): this
    removeListener<E extends keyof Events> (event: E, listener: Events[E]): this

    emit<E extends keyof Events> (event: E, ...args: Parameters<Events[E]>): boolean
    // The sloppy `eventNames()` return type is to mitigate type incompatibilities - see #5
    eventNames (): (keyof Events | string | symbol)[]
    rawListeners<E extends keyof Events> (event: E): Events[E][]
    listeners<E extends keyof Events> (event: E): Events[E][]
    listenerCount<E extends keyof Events> (event: E): number

    getMaxListeners (): number
    setMaxListeners (maxListeners: number): this
}

declare type Update = SyncUpdate<Name>;

declare namespace util {
    export {
        assert,
        console_2 as console,
        concatBuffers,
        crypto_2 as crypto,
        delay,
        asUint8Array,
        asDataView,
        Closer,
        Closers,
        timingSafeEqual,
        sha256,
        trackEventListener,
        CustomEvent_2 as CustomEvent,
        safeIter,
        flatMapOnce,
        evict,
        KeyMap,
        KeyMultiMap,
        MultiMap,
        KeyMultiSet,
        toHex,
        fromHex,
        toUtf8,
        fromUtf8,
        randomJitter
    }
}
export { util }

/** Certificate validity period. */
declare class ValidityPeriod {
    static decodeFrom(decoder: Decoder): ValidityPeriod;
    constructor();
    constructor(notBefore: ValidityPeriod.TimestampInput, notAfter: ValidityPeriod.TimestampInput);
    notBefore: number;
    notAfter: number;
    encodeTo(encoder: Encoder): void;
    /** Determine whether the specified timestamp is within validity period. */
    includes(t: ValidityPeriod.TimestampInput): boolean;
    /** Determine whether this validity period equals another. */
    equals({ notBefore, notAfter }: ValidityPeriod): boolean;
    /** Compute the intersection of this and other validity periods. */
    intersect(...validityPeriods: ValidityPeriod[]): ValidityPeriod;
    toString(): string;
}

declare namespace ValidityPeriod {
    type TimestampInput = number | Date;
    /** A very long ValidityPeriod. */
    const MAX: ValidityPeriod;
    /** Construct ValidityPeriod for n days from now. */
    function daysFromNow(n: number): ValidityPeriod;
    /** Retrieve ValidityPeriod from SigInfo. */
    function get(si: SigInfo): ValidityPeriod | undefined;
    /** Assign ValidityPeriod onto SigInfo. */
    function set(si: SigInfo, v?: ValidityPeriod): void;
}

/** High level verifier, such as a named public key. */
declare interface Verifier {
    /**
     * Verify a packet.
     * @returns a Promise is resolved upon good signature/policy or rejected upon bad signature/policy.
     */
    verify: (pkt: Verifier.Verifiable) => Promise<void>;
}

declare namespace Verifier {
    interface Verifiable extends Readonly<PacketWithSignature>, LLVerify.Verifiable {
    }
    /** Throw if packet does not have expected SigType. */
    function checkSigType(pkt: Readonly<PacketWithSignature>, expectedSigType: number): void;
    /** Throw bad signature error if not OK. */
    function throwOnBadSig(ok: boolean): asserts ok;
}

declare interface WasmFS {
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
    readFile(path: string, opts: {
        encoding: "binary";
        flags?: string | undefined;
    }): Uint8Array;
    readFile(path: string, opts: {
        encoding: "utf8";
        flags?: string | undefined;
    }): string;
    readFile(path: string, opts?: {
        flags?: string | undefined;
    }): Uint8Array;
    writeFile(path: string, data: string | ArrayBufferView, opts?: {
        flags?: string | undefined;
    }): void;
    cwd(): string;
    chdir(path: string): void;
}

declare namespace ws_transport {
    export {
        WsTransport
    }
}
export { ws_transport }

/** WebSocket transport. */
declare class WsTransport extends Transport {
    private readonly sock;
    private readonly opts;
    readonly rx: Transport.Rx;
    private readonly highWaterMark;
    private readonly lowWaterMark;
    constructor(sock: WebSocket, opts: WsTransport.Options);
    close(): void;
    get mtu(): number;
    readonly tx: (iterable: AsyncIterable<Uint8Array>) => Promise<void>;
    private waitForTxBuffer;
    reopen(): Promise<WsTransport>;
}

declare namespace WsTransport {
    interface Options {
        /** Connect timeout (in milliseconds). */
        connectTimeout?: number;
        /** AbortSignal that allows canceling connection attempt via AbortController. */
        signal?: AbortSignal;
        /** Buffer amount (in bytes) to start TX throttling. */
        highWaterMark?: number;
        /** Buffer amount (in bytes) to stop TX throttling. */
        lowWaterMark?: number;
    }
    /**
     * Create a transport and connect to remote endpoint.
     * @param uri server URI or WebSocket object.
     * @param opts other options.
     */
    function connect(uri: string | WebSocket | WsWebSocket, opts?: WsTransport.Options): Promise<WsTransport>;
    /** Create a transport and add to forwarder. */
    const createFace: L3Face.CreateFaceFunc<WsTransport, [uri: string | WebSocket | WsWebSocket, opts?: Options | undefined]>;
}

export { }
