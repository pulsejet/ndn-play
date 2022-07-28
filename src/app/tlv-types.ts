export enum TlvV3 {
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

    NameComponentMin = 1,
    NameComponentMax = 65535,

    AppPrivateBlock1 = 128,
    AppPrivateBlock2 = 32767
};

enum TlvV2 {
    Selectors                 = 9,
    MinSuffixComponents       = 13,
    MaxSuffixComponents       = 14,
    PublisherPublicKeyLocator = 15,
    Exclude                   = 16,
    ChildSelector             = 17,
    Any                       = 19,
}

enum TlvNC {
    KeywordNameComponent     = 32,
    SegmentNameComponent     = 33,
    ByteOffsetNameComponent  = 34,
    VersionNameComponent     = 35,
    TimestampNameComponent   = 36,
    SequenceNumNameComponent = 37,
}

enum TlvSignInfo {
    ValidityPeriod = 253,
    NotBefore = 254,
    NotAfter = 255,

    AdditionalDescription = 258,
    DescriptionEntry = 512,
    DescriptionKey = 513,
    DescriptionValue = 514
}

enum NDNLPv2 {
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

// Special NNI types
export enum TlvSign {
    DigestSha256             = 0,
    SignatureSha256WithRsa   = 1,
    SignatureSha256WithEcdsa = 3,
    SignatureHmacWithSha256  = 4,
    NullSignature            = 200,
}

export enum TlvContentInfo {
    Blob      = 0,
    Link      = 1,
    Key       = 2,
    Nack      = 3,
    Manifest  = 4,
    PrefixAnn = 5,
    Flic      = 1024,
}
