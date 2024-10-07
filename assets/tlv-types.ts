// Exports named TLV_* will be used for decoding TLVs.
// To decode TLVs as NonNegativeInteger, see the NNI section.
// Note that all names are case sensitive.
//
// You can define your custom TLV types at the end of this
// file as shown below (scroll down to the custom section).
//
// export enum TLV_CUSTOM {
//     MyType      = 285,
//     MyOtherType = 0x424,
// };
//
// In case your TLV types conflict or are repeated in multiple
// contexts, you can use the T_IN_* prefix to constrain TLVs
// to a specific context.
//
// For example, if the type MyType can only be used inside
// the content of a Data packet, you can add this constraint:
//
// export let T_IN_MyType = [TLV_V3.Content];
//
// Note that only the immediate parent TLV is considered
// as the context. So if the TLV MyType is inside a MyOtherType,
// which in turn in inside Content, then the MyType TLV
// definition will be ignored in this case.


// =============================================================
// Standard NDN TLV types. If you need to change any of these,
// you are probably doing something wrong.
// https://docs.named-data.net/NDN-packet-spec/current/types.html
// =============================================================

export enum TLV_V3 {
    Invalid                         = 0,
    Interest                        = 5,
    Data                            = 6,
    Name                            = 7,
    GenericNameComponent            = 8,
    ImplicitSha256DigestComponent   = 1,
    ParametersSha256DigestComponent = 2,
    CanBePrefix                     = 33,
    MustBeFresh                     = 18,
    ForwardingHint                  = 30,
    Nonce                           = 10,
    InterestLifetime                = 12,
    HopLimit                        = 34,
    ApplicationParameters           = 36,
    InterestSignatureInfo           = 44,
    InterestSignatureValue          = 46,
    MetaInfo                        = 20,
    Content                         = 21,
    SignatureInfo                   = 22,
    SignatureValue                  = 23,
    ContentType                     = 24,
    FreshnessPeriod                 = 25,
    FinalBlockId                    = 26,
    SignatureType                   = 27,
    KeyLocator                      = 28,
    KeyDigest                       = 29,
    SignatureNonce                  = 38,
    SignatureTime                   = 40,
    SignatureSeqNum                 = 42,
    LinkDelegation                  = 31,
    LinkPreference                  = 30,
};

export enum TLV_V2 {
    Selectors                 = 9,
    MinSuffixComponents       = 13,
    MaxSuffixComponents       = 14,
    PublisherPublicKeyLocator = 15,
    Exclude                   = 16,
    ChildSelector             = 17,
    Any                       = 19,
}

export enum TLV_NameComponent {
    KeywordNameComponent     = 32,
    SegmentNameComponent     = 50,
    ByteOffsetNameComponent  = 52,
    VersionNameComponent     = 54,
    TimestampNameComponent   = 56,
    SequenceNumNameComponent = 58,
}

export enum TLV_SignInfo {
    ValidityPeriod = 253,
    NotBefore = 254,
    NotAfter = 255,

    AdditionalDescription = 258,
    DescriptionEntry = 512,
    DescriptionKey = 513,
    DescriptionValue = 514
}

export enum TLV_NDNLPv2 {
    LpPacket = 100,
    Fragment = 80,
    Sequence = 81,
    FragIndex = 82,
    FragCount = 83,
    PitToken = 98,
    Nack = 800,
    NackReason = 801,
    NextHopFaceId = 816,
    IncomingFaceId = 817,
    CachePolicy = 820,
    CachePolicyType = 821,
    CongestionMark = 832,
    Ack = 836,
    TxSequence = 840,
    NonDiscovery = 844,
    PrefixAnnouncement = 848,
}

export enum TLV_Reserved {
    Ignore = 126,
}

// =============================================================
// If an object with BLOB_* is exported then the corresponding
// TLV will not be decoded and will be treated as a opaque blob.
// =============================================================

export let BLOB_InterestSignatureValue = 1;
export let BLOB_SignatureValue = 1;
export let BLOB_KeyDigest = 1;

// =============================================================
// If an object with TEXT_* is exported then the corresponding.
// TLV will be treated and displayed as plain text by default.
// =============================================================

export let TEXT_Name = 1;
export let TEXT_GenericNameComponent = 1;
export let TEXT_KeywordNameComponent = 1;
export let TEXT_NotBefore = 1;
export let TEXT_NotAfter = 1;

// =============================================================
// If an object with NNI_* is exported then the corresponding.
// TLV will be decoded as an NNI, with values from the enum.
// =============================================================

export let NNI_FreshnessPeriod = 1;
export let NNI_InterestLifetime = 1;
export let NNI_SignatureTime = 1;
export let NNI_SignatureSeqNum = 1;
export let NNI_SegmentNameComponent = 1;
export let NNI_ByteOffsetNameComponent = 1;
export let NNI_VersionNameComponent = 1;
export let NNI_TimestampNameComponent = 1;
export let NNI_SequenceNumNameComponent = 1;

export enum NNI_SignatureType {
    DigestSha256             = 0,
    SignatureSha256WithRsa   = 1,
    SignatureSha256WithEcdsa = 3,
    SignatureHmacWithSha256  = 4,
    NullSignature            = 200,
};

export enum NNI_ContentType {
    Blob      = 0,
    Link      = 1,
    Key       = 2,
    Nack      = 3,
    Manifest  = 4,
    PrefixAnn = 5,
    Flic      = 1024,
};

// =============================================================
// State Vector Sync TLV types.
// These types are provided as an example for custom TLVs.
// =============================================================

export enum TLV_SVS {
    StateVector = 201,
    StateVectorEntry = 202,
    SvSeqNo = 204,
}
export let T_IN_StateVector = [TLV_V3.Name];
export let T_IN_StateVectorEntry = [TLV_SVS.StateVector];
export let T_IN_SvSeqNo = [TLV_SVS.StateVectorEntry];
export let NNI_SvSeqNo = 1;

// =============================================================
// CUSTOM TLV TYPES
// =============================================================
// Everything below this line is considered custom TLV types,
// and will be persisted by your browser after compilation.
// +==+==+==+==+==+==+==+==+==+==+==+==+==+==+==+==+==+==+==+==+