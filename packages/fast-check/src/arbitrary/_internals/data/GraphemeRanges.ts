/** @internal */
export type GraphemeRange = [number] | [number, number];

/** @internal */
export const asciiAlphabetRanges: GraphemeRange[] = [[0x00, 0x7f]];

/** @internal */
export const fullAlphabetRanges: GraphemeRange[] = [[0x0000, 0x10ffff]];

/**
 * Ranges of Graphemes safe to be combined together without any risks to interract between each others.
 * 779 ranges, gathering 31828 code-points over the 34931 being declared by http://unicode.org/Public/UNIDATA/UnicodeData.txt on the 17th of August 2024
 * @internal
 */
export const autonomousGraphemeRanges: GraphemeRange[] = [
  [0x20, 0x7e],
  [0xa0, 0xac],
  [0xae, 0x2ff],
  [0x370, 0x377],
  [0x37a, 0x37f],
  [0x384, 0x38a],
  [0x38c],
  [0x38e, 0x3a1],
  [0x3a3, 0x482],
  [0x48a, 0x52f],
  [0x531, 0x556],
  [0x559, 0x58a],
  [0x58d, 0x58f],
  [0x5be],
  [0x5c0],
  [0x5c3],
  [0x5c6],
  [0x5d0, 0x5ea],
  [0x5ef, 0x5f4],
  [0x606, 0x60f],
  [0x61b],
  [0x61d, 0x64a],
  [0x660, 0x66f],
  [0x671, 0x6d5],
  [0x6de],
  [0x6e5, 0x6e6],
  [0x6e9],
  [0x6ee, 0x70d],
  [0x710],
  [0x712, 0x72f],
  [0x74d, 0x7a5],
  [0x7b1],
  [0x7c0, 0x7ea],
  [0x7f4, 0x7fa],
  [0x7fe, 0x815],
  [0x81a],
  [0x824],
  [0x828],
  [0x830, 0x83e],
  [0x840, 0x858],
  [0x85e],
  [0x860, 0x86a],
  [0x870, 0x88e],
  [0x8a0, 0x8c9],
  [0x904, 0x939],
  [0x93d],
  [0x950],
  [0x958, 0x961],
  [0x964, 0x980],
  [0x985, 0x98c],
  [0x98f, 0x990],
  [0x993, 0x9a8],
  [0x9aa, 0x9b0],
  [0x9b2],
  [0x9b6, 0x9b9],
  [0x9bd],
  [0x9ce],
  [0x9dc, 0x9dd],
  [0x9df, 0x9e1],
  [0x9e6, 0x9fd],
  [0xa05, 0xa0a],
  [0xa0f, 0xa10],
  [0xa13, 0xa28],
  [0xa2a, 0xa30],
  [0xa32, 0xa33],
  [0xa35, 0xa36],
  [0xa38, 0xa39],
  [0xa59, 0xa5c],
  [0xa5e],
  [0xa66, 0xa6f],
  [0xa72, 0xa74],
  [0xa76],
  [0xa85, 0xa8d],
  [0xa8f, 0xa91],
  [0xa93, 0xaa8],
  [0xaaa, 0xab0],
  [0xab2, 0xab3],
  [0xab5, 0xab9],
  [0xabd],
  [0xad0],
  [0xae0, 0xae1],
  [0xae6, 0xaf1],
  [0xaf9],
  [0xb05, 0xb0c],
  [0xb0f, 0xb10],
  [0xb13, 0xb28],
  [0xb2a, 0xb30],
  [0xb32, 0xb33],
  [0xb35, 0xb39],
  [0xb3d],
  [0xb5c, 0xb5d],
  [0xb5f, 0xb61],
  [0xb66, 0xb77],
  [0xb83],
  [0xb85, 0xb8a],
  [0xb8e, 0xb90],
  [0xb92, 0xb95],
  [0xb99, 0xb9a],
  [0xb9c],
  [0xb9e, 0xb9f],
  [0xba3, 0xba4],
  [0xba8, 0xbaa],
  [0xbae, 0xbb9],
  [0xbd0],
  [0xbe6, 0xbfa],
  [0xc05, 0xc0c],
  [0xc0e, 0xc10],
  [0xc12, 0xc28],
  [0xc2a, 0xc39],
  [0xc3d],
  [0xc58, 0xc5a],
  [0xc5d],
  [0xc60, 0xc61],
  [0xc66, 0xc6f],
  [0xc77, 0xc80],
  [0xc84, 0xc8c],
  [0xc8e, 0xc90],
  [0xc92, 0xca8],
  [0xcaa, 0xcb3],
  [0xcb5, 0xcb9],
  [0xcbd],
  [0xcdd, 0xcde],
  [0xce0, 0xce1],
  [0xce6, 0xcef],
  [0xcf1, 0xcf2],
  [0xd04, 0xd0c],
  [0xd0e, 0xd10],
  [0xd12, 0xd3a],
  [0xd3d],
  [0xd4f],
  [0xd54, 0xd56],
  [0xd58, 0xd61],
  [0xd66, 0xd7f],
  [0xd85, 0xd96],
  [0xd9a, 0xdb1],
  [0xdb3, 0xdbb],
  [0xdbd],
  [0xdc0, 0xdc6],
  [0xde6, 0xdef],
  [0xdf4],
  [0xe01, 0xe30],
  [0xe32],
  [0xe3f, 0xe46],
  [0xe4f, 0xe5b],
  [0xe81, 0xe82],
  [0xe84],
  [0xe86, 0xe8a],
  [0xe8c, 0xea3],
  [0xea5],
  [0xea7, 0xeb0],
  [0xeb2],
  [0xebd],
  [0xec0, 0xec4],
  [0xec6],
  [0xed0, 0xed9],
  [0xedc, 0xedf],
  [0xf00, 0xf17],
  [0xf1a, 0xf34],
  [0xf36],
  [0xf38],
  [0xf3a, 0xf3d],
  [0xf40, 0xf47],
  [0xf49, 0xf6c],
  [0xf85],
  [0xf88, 0xf8c],
  [0xfbe, 0xfc5],
  [0xfc7, 0xfcc],
  [0xfce, 0xfda],
  [0x1000, 0x102a],
  [0x103f, 0x1055],
  [0x105a, 0x105d],
  [0x1061],
  [0x1065, 0x1066],
  [0x106e, 0x1070],
  [0x1075, 0x1081],
  [0x108e],
  [0x1090, 0x1099],
  [0x109e, 0x10c5],
  [0x10c7],
  [0x10cd],
  [0x10d0, 0x10ff],
  [0x1200, 0x1248],
  [0x124a, 0x124d],
  [0x1250, 0x1256],
  [0x1258],
  [0x125a, 0x125d],
  [0x1260, 0x1288],
  [0x128a, 0x128d],
  [0x1290, 0x12b0],
  [0x12b2, 0x12b5],
  [0x12b8, 0x12be],
  [0x12c0],
  [0x12c2, 0x12c5],
  [0x12c8, 0x12d6],
  [0x12d8, 0x1310],
  [0x1312, 0x1315],
  [0x1318, 0x135a],
  [0x1360, 0x137c],
  [0x1380, 0x1399],
  [0x13a0, 0x13f5],
  [0x13f8, 0x13fd],
  [0x1400, 0x169c],
  [0x16a0, 0x16f8],
  [0x1700, 0x1711],
  [0x171f, 0x1731],
  [0x1735, 0x1736],
  [0x1740, 0x1751],
  [0x1760, 0x176c],
  [0x176e, 0x1770],
  [0x1780, 0x17b3],
  [0x17d4, 0x17dc],
  [0x17e0, 0x17e9],
  [0x17f0, 0x17f9],
  [0x1800, 0x180a],
  [0x1810, 0x1819],
  [0x1820, 0x1878],
  [0x1880, 0x1884],
  [0x1887, 0x18a8],
  [0x18aa],
  [0x18b0, 0x18f5],
  [0x1900, 0x191e],
  [0x1940],
  [0x1944, 0x196d],
  [0x1970, 0x1974],
  [0x1980, 0x19ab],
  [0x19b0, 0x19c9],
  [0x19d0, 0x19da],
  [0x19de, 0x1a16],
  [0x1a1e, 0x1a54],
  [0x1a80, 0x1a89],
  [0x1a90, 0x1a99],
  [0x1aa0, 0x1aad],
  [0x1b05, 0x1b33],
  [0x1b45, 0x1b4c],
  [0x1b50, 0x1b6a],
  [0x1b74, 0x1b7e],
  [0x1b83, 0x1ba0],
  [0x1bae, 0x1be5],
  [0x1bfc, 0x1c23],
  [0x1c3b, 0x1c49],
  [0x1c4d, 0x1c88],
  [0x1c90, 0x1cba],
  [0x1cbd, 0x1cc7],
  [0x1cd3],
  [0x1ce9, 0x1cec],
  [0x1cee, 0x1cf3],
  [0x1cf5, 0x1cf6],
  [0x1cfa],
  [0x1d00, 0x1dbf],
  [0x1e00, 0x1f15],
  [0x1f18, 0x1f1d],
  [0x1f20, 0x1f45],
  [0x1f48, 0x1f4d],
  [0x1f50, 0x1f57],
  [0x1f59],
  [0x1f5b],
  [0x1f5d],
  [0x1f5f, 0x1f7d],
  [0x1f80, 0x1fb4],
  [0x1fb6, 0x1fc4],
  [0x1fc6, 0x1fd3],
  [0x1fd6, 0x1fdb],
  [0x1fdd, 0x1fef],
  [0x1ff2, 0x1ff4],
  [0x1ff6, 0x1ffe],
  [0x2000, 0x200a],
  [0x2010, 0x2029],
  [0x202f, 0x205f],
  [0x2070, 0x2071],
  [0x2074, 0x208e],
  [0x2090, 0x209c],
  [0x20a0, 0x20c0],
  [0x2100, 0x218b],
  [0x2190, 0x2426],
  [0x2440, 0x244a],
  [0x2460, 0x2b73],
  [0x2b76, 0x2b95],
  [0x2b97, 0x2cee],
  [0x2cf2, 0x2cf3],
  [0x2cf9, 0x2d25],
  [0x2d27],
  [0x2d2d],
  [0x2d30, 0x2d67],
  [0x2d6f, 0x2d70],
  [0x2d80, 0x2d96],
  [0x2da0, 0x2da6],
  [0x2da8, 0x2dae],
  [0x2db0, 0x2db6],
  [0x2db8, 0x2dbe],
  [0x2dc0, 0x2dc6],
  [0x2dc8, 0x2dce],
  [0x2dd0, 0x2dd6],
  [0x2dd8, 0x2dde],
  [0x2e00, 0x2e5d],
  [0x2e80, 0x2e99],
  [0x2e9b, 0x2ef3],
  [0x2f00, 0x2fd5],
  [0x2ff0, 0x3029],
  [0x3030, 0x303f],
  [0x3041, 0x3096],
  [0x309b, 0x30ff],
  [0x3105, 0x312f],
  [0x3131, 0x318e],
  [0x3190, 0x31e3],
  [0x31ef, 0x321e],
  [0x3220, 0x3400],
  [0x4dbf, 0x4e00],
  [0x9fff, 0xa48c],
  [0xa490, 0xa4c6],
  [0xa4d0, 0xa62b],
  [0xa640, 0xa66e],
  [0xa673],
  [0xa67e, 0xa69d],
  [0xa6a0, 0xa6ef],
  [0xa6f2, 0xa6f7],
  [0xa700, 0xa7ca],
  [0xa7d0, 0xa7d1],
  [0xa7d3],
  [0xa7d5, 0xa7d9],
  [0xa7f2, 0xa801],
  [0xa803, 0xa805],
  [0xa807, 0xa80a],
  [0xa80c, 0xa822],
  [0xa828, 0xa82b],
  [0xa830, 0xa839],
  [0xa840, 0xa877],
  [0xa882, 0xa8b3],
  [0xa8ce, 0xa8d9],
  [0xa8f2, 0xa8fe],
  [0xa900, 0xa925],
  [0xa92e, 0xa946],
  [0xa95f],
  [0xa984, 0xa9b2],
  [0xa9c1, 0xa9cd],
  [0xa9cf, 0xa9d9],
  [0xa9de, 0xa9e4],
  [0xa9e6, 0xa9fe],
  [0xaa00, 0xaa28],
  [0xaa40, 0xaa42],
  [0xaa44, 0xaa4b],
  [0xaa50, 0xaa59],
  [0xaa5c, 0xaa7a],
  [0xaa7e, 0xaaaf],
  [0xaab1],
  [0xaab5, 0xaab6],
  [0xaab9, 0xaabd],
  [0xaac0],
  [0xaac2],
  [0xaadb, 0xaaea],
  [0xaaf0, 0xaaf4],
  [0xab01, 0xab06],
  [0xab09, 0xab0e],
  [0xab11, 0xab16],
  [0xab20, 0xab26],
  [0xab28, 0xab2e],
  [0xab30, 0xab6b],
  [0xab70, 0xabe2],
  [0xabeb],
  [0xabf0, 0xabf9],
  [0xac00],
  [0xd7a3],
  [0xf900, 0xfa6d],
  [0xfa70, 0xfad9],
  [0xfb00, 0xfb06],
  [0xfb13, 0xfb17],
  [0xfb1d],
  [0xfb1f, 0xfb36],
  [0xfb38, 0xfb3c],
  [0xfb3e],
  [0xfb40, 0xfb41],
  [0xfb43, 0xfb44],
  [0xfb46, 0xfbc2],
  [0xfbd3, 0xfd8f],
  [0xfd92, 0xfdc7],
  [0xfdcf],
  [0xfdf0, 0xfdff],
  [0xfe10, 0xfe19],
  [0xfe30, 0xfe52],
  [0xfe54, 0xfe66],
  [0xfe68, 0xfe6b],
  [0xfe70, 0xfe74],
  [0xfe76, 0xfefc],
  [0xff01, 0xff9d],
  [0xffa0, 0xffbe],
  [0xffc2, 0xffc7],
  [0xffca, 0xffcf],
  [0xffd2, 0xffd7],
  [0xffda, 0xffdc],
  [0xffe0, 0xffe6],
  [0xffe8, 0xffee],
  [0xfffc, 0xfffd],
  [0x10000, 0x1000b],
  [0x1000d, 0x10026],
  [0x10028, 0x1003a],
  [0x1003c, 0x1003d],
  [0x1003f, 0x1004d],
  [0x10050, 0x1005d],
  [0x10080, 0x100fa],
  [0x10100, 0x10102],
  [0x10107, 0x10133],
  [0x10137, 0x1018e],
  [0x10190, 0x1019c],
  [0x101a0],
  [0x101d0, 0x101fc],
  [0x10280, 0x1029c],
  [0x102a0, 0x102d0],
  [0x102e1, 0x102fb],
  [0x10300, 0x10323],
  [0x1032d, 0x1034a],
  [0x10350, 0x10375],
  [0x10380, 0x1039d],
  [0x1039f, 0x103c3],
  [0x103c8, 0x103d5],
  [0x10400, 0x1049d],
  [0x104a0, 0x104a9],
  [0x104b0, 0x104d3],
  [0x104d8, 0x104fb],
  [0x10500, 0x10527],
  [0x10530, 0x10563],
  [0x1056f, 0x1057a],
  [0x1057c, 0x1058a],
  [0x1058c, 0x10592],
  [0x10594, 0x10595],
  [0x10597, 0x105a1],
  [0x105a3, 0x105b1],
  [0x105b3, 0x105b9],
  [0x105bb, 0x105bc],
  [0x10600, 0x10736],
  [0x10740, 0x10755],
  [0x10760, 0x10767],
  [0x10780, 0x10785],
  [0x10787, 0x107b0],
  [0x107b2, 0x107ba],
  [0x10800, 0x10805],
  [0x10808],
  [0x1080a, 0x10835],
  [0x10837, 0x10838],
  [0x1083c],
  [0x1083f, 0x10855],
  [0x10857, 0x1089e],
  [0x108a7, 0x108af],
  [0x108e0, 0x108f2],
  [0x108f4, 0x108f5],
  [0x108fb, 0x1091b],
  [0x1091f, 0x10939],
  [0x1093f],
  [0x10980, 0x109b7],
  [0x109bc, 0x109cf],
  [0x109d2, 0x10a00],
  [0x10a10, 0x10a13],
  [0x10a15, 0x10a17],
  [0x10a19, 0x10a35],
  [0x10a40, 0x10a48],
  [0x10a50, 0x10a58],
  [0x10a60, 0x10a9f],
  [0x10ac0, 0x10ae4],
  [0x10aeb, 0x10af6],
  [0x10b00, 0x10b35],
  [0x10b39, 0x10b55],
  [0x10b58, 0x10b72],
  [0x10b78, 0x10b91],
  [0x10b99, 0x10b9c],
  [0x10ba9, 0x10baf],
  [0x10c00, 0x10c48],
  [0x10c80, 0x10cb2],
  [0x10cc0, 0x10cf2],
  [0x10cfa, 0x10d23],
  [0x10d30, 0x10d39],
  [0x10e60, 0x10e7e],
  [0x10e80, 0x10ea9],
  [0x10ead],
  [0x10eb0, 0x10eb1],
  [0x10f00, 0x10f27],
  [0x10f30, 0x10f45],
  [0x10f51, 0x10f59],
  [0x10f70, 0x10f81],
  [0x10f86, 0x10f89],
  [0x10fb0, 0x10fcb],
  [0x10fe0, 0x10ff6],
  [0x11003, 0x11037],
  [0x11047, 0x1104d],
  [0x11052, 0x1106f],
  [0x11071, 0x11072],
  [0x11075],
  [0x11083, 0x110af],
  [0x110bb, 0x110bc],
  [0x110be, 0x110c1],
  [0x110d0, 0x110e8],
  [0x110f0, 0x110f9],
  [0x11103, 0x11126],
  [0x11136, 0x11144],
  [0x11147],
  [0x11150, 0x11172],
  [0x11174, 0x11176],
  [0x11183, 0x111b2],
  [0x111c1],
  [0x111c4, 0x111c8],
  [0x111cd],
  [0x111d0, 0x111df],
  [0x111e1, 0x111f4],
  [0x11200, 0x11211],
  [0x11213, 0x1122b],
  [0x11238, 0x1123d],
  [0x1123f, 0x11240],
  [0x11280, 0x11286],
  [0x11288],
  [0x1128a, 0x1128d],
  [0x1128f, 0x1129d],
  [0x1129f, 0x112a9],
  [0x112b0, 0x112de],
  [0x112f0, 0x112f9],
  [0x11305, 0x1130c],
  [0x1130f, 0x11310],
  [0x11313, 0x11328],
  [0x1132a, 0x11330],
  [0x11332, 0x11333],
  [0x11335, 0x11339],
  [0x1133d],
  [0x11350],
  [0x1135d, 0x11361],
  [0x11400, 0x11434],
  [0x11447, 0x1145b],
  [0x1145d],
  [0x1145f, 0x11461],
  [0x11480, 0x114af],
  [0x114c4, 0x114c7],
  [0x114d0, 0x114d9],
  [0x11580, 0x115ae],
  [0x115c1, 0x115db],
  [0x11600, 0x1162f],
  [0x11641, 0x11644],
  [0x11650, 0x11659],
  [0x11660, 0x1166c],
  [0x11680, 0x116aa],
  [0x116b8, 0x116b9],
  [0x116c0, 0x116c9],
  [0x11700, 0x1171a],
  [0x11730, 0x11746],
  [0x11800, 0x1182b],
  [0x1183b],
  [0x118a0, 0x118f2],
  [0x118ff, 0x11906],
  [0x11909],
  [0x1190c, 0x11913],
  [0x11915, 0x11916],
  [0x11918, 0x1192f],
  [0x11944, 0x11946],
  [0x11950, 0x11959],
  [0x119a0, 0x119a7],
  [0x119aa, 0x119d0],
  [0x119e1, 0x119e3],
  [0x11a00],
  [0x11a0b, 0x11a32],
  [0x11a3f, 0x11a46],
  [0x11a50],
  [0x11a5c, 0x11a83],
  [0x11a9a, 0x11aa2],
  [0x11ab0, 0x11af8],
  [0x11b00, 0x11b09],
  [0x11c00, 0x11c08],
  [0x11c0a, 0x11c2e],
  [0x11c40, 0x11c45],
  [0x11c50, 0x11c6c],
  [0x11c70, 0x11c8f],
  [0x11d00, 0x11d06],
  [0x11d08, 0x11d09],
  [0x11d0b, 0x11d30],
  [0x11d50, 0x11d59],
  [0x11d60, 0x11d65],
  [0x11d67, 0x11d68],
  [0x11d6a, 0x11d89],
  [0x11d98],
  [0x11da0, 0x11da9],
  [0x11ee0, 0x11ef2],
  [0x11ef7, 0x11ef8],
  [0x11f04, 0x11f10],
  [0x11f12, 0x11f33],
  [0x11f43, 0x11f59],
  [0x11fb0],
  [0x11fc0, 0x11ff1],
  [0x11fff, 0x12399],
  [0x12400, 0x1246e],
  [0x12470, 0x12474],
  [0x12480, 0x12543],
  [0x12f90, 0x12ff2],
  [0x13000, 0x1342f],
  [0x13441, 0x13446],
  [0x14400, 0x14646],
  [0x16800, 0x16a38],
  [0x16a40, 0x16a5e],
  [0x16a60, 0x16a69],
  [0x16a6e, 0x16abe],
  [0x16ac0, 0x16ac9],
  [0x16ad0, 0x16aed],
  [0x16af5],
  [0x16b00, 0x16b2f],
  [0x16b37, 0x16b45],
  [0x16b50, 0x16b59],
  [0x16b5b, 0x16b61],
  [0x16b63, 0x16b77],
  [0x16b7d, 0x16b8f],
  [0x16e40, 0x16e9a],
  [0x16f00, 0x16f4a],
  [0x16f50],
  [0x16f93, 0x16f9f],
  [0x16fe0, 0x16fe3],
  [0x17000],
  [0x187f7],
  [0x18800, 0x18cd5],
  [0x18d00],
  [0x18d08],
  [0x1aff0, 0x1aff3],
  [0x1aff5, 0x1affb],
  [0x1affd, 0x1affe],
  [0x1b000, 0x1b122],
  [0x1b132],
  [0x1b150, 0x1b152],
  [0x1b155],
  [0x1b164, 0x1b167],
  [0x1b170, 0x1b2fb],
  [0x1bc00, 0x1bc6a],
  [0x1bc70, 0x1bc7c],
  [0x1bc80, 0x1bc88],
  [0x1bc90, 0x1bc99],
  [0x1bc9c],
  [0x1bc9f],
  [0x1cf50, 0x1cfc3],
  [0x1d000, 0x1d0f5],
  [0x1d100, 0x1d126],
  [0x1d129, 0x1d164],
  [0x1d16a, 0x1d16c],
  [0x1d183, 0x1d184],
  [0x1d18c, 0x1d1a9],
  [0x1d1ae, 0x1d1ea],
  [0x1d200, 0x1d241],
  [0x1d245],
  [0x1d2c0, 0x1d2d3],
  [0x1d2e0, 0x1d2f3],
  [0x1d300, 0x1d356],
  [0x1d360, 0x1d378],
  [0x1d400, 0x1d454],
  [0x1d456, 0x1d49c],
  [0x1d49e, 0x1d49f],
  [0x1d4a2],
  [0x1d4a5, 0x1d4a6],
  [0x1d4a9, 0x1d4ac],
  [0x1d4ae, 0x1d4b9],
  [0x1d4bb],
  [0x1d4bd, 0x1d4c3],
  [0x1d4c5, 0x1d505],
  [0x1d507, 0x1d50a],
  [0x1d50d, 0x1d514],
  [0x1d516, 0x1d51c],
  [0x1d51e, 0x1d539],
  [0x1d53b, 0x1d53e],
  [0x1d540, 0x1d544],
  [0x1d546],
  [0x1d54a, 0x1d550],
  [0x1d552, 0x1d6a5],
  [0x1d6a8, 0x1d7cb],
  [0x1d7ce, 0x1d9ff],
  [0x1da37, 0x1da3a],
  [0x1da6d, 0x1da74],
  [0x1da76, 0x1da83],
  [0x1da85, 0x1da8b],
  [0x1df00, 0x1df1e],
  [0x1df25, 0x1df2a],
  [0x1e030, 0x1e06d],
  [0x1e100, 0x1e12c],
  [0x1e137, 0x1e13d],
  [0x1e140, 0x1e149],
  [0x1e14e, 0x1e14f],
  [0x1e290, 0x1e2ad],
  [0x1e2c0, 0x1e2eb],
  [0x1e2f0, 0x1e2f9],
  [0x1e2ff],
  [0x1e4d0, 0x1e4eb],
  [0x1e4f0, 0x1e4f9],
  [0x1e7e0, 0x1e7e6],
  [0x1e7e8, 0x1e7eb],
  [0x1e7ed, 0x1e7ee],
  [0x1e7f0, 0x1e7fe],
  [0x1e800, 0x1e8c4],
  [0x1e8c7, 0x1e8cf],
  [0x1e900, 0x1e943],
  [0x1e94b],
  [0x1e950, 0x1e959],
  [0x1e95e, 0x1e95f],
  [0x1ec71, 0x1ecb4],
  [0x1ed01, 0x1ed3d],
  [0x1ee00, 0x1ee03],
  [0x1ee05, 0x1ee1f],
  [0x1ee21, 0x1ee22],
  [0x1ee24],
  [0x1ee27],
  [0x1ee29, 0x1ee32],
  [0x1ee34, 0x1ee37],
  [0x1ee39],
  [0x1ee3b],
  [0x1ee42],
  [0x1ee47],
  [0x1ee49],
  [0x1ee4b],
  [0x1ee4d, 0x1ee4f],
  [0x1ee51, 0x1ee52],
  [0x1ee54],
  [0x1ee57],
  [0x1ee59],
  [0x1ee5b],
  [0x1ee5d],
  [0x1ee5f],
  [0x1ee61, 0x1ee62],
  [0x1ee64],
  [0x1ee67, 0x1ee6a],
  [0x1ee6c, 0x1ee72],
  [0x1ee74, 0x1ee77],
  [0x1ee79, 0x1ee7c],
  [0x1ee7e],
  [0x1ee80, 0x1ee89],
  [0x1ee8b, 0x1ee9b],
  [0x1eea1, 0x1eea3],
  [0x1eea5, 0x1eea9],
  [0x1eeab, 0x1eebb],
  [0x1eef0, 0x1eef1],
  [0x1f000, 0x1f02b],
  [0x1f030, 0x1f093],
  [0x1f0a0, 0x1f0ae],
  [0x1f0b1, 0x1f0bf],
  [0x1f0c1, 0x1f0cf],
  [0x1f0d1, 0x1f0f5],
  [0x1f100, 0x1f1ad],
  [0x1f200, 0x1f202],
  [0x1f210, 0x1f23b],
  [0x1f240, 0x1f248],
  [0x1f250, 0x1f251],
  [0x1f260, 0x1f265],
  [0x1f300, 0x1f3fa],
  [0x1f400, 0x1f6d7],
  [0x1f6dc, 0x1f6ec],
  [0x1f6f0, 0x1f6fc],
  [0x1f700, 0x1f776],
  [0x1f77b, 0x1f7d9],
  [0x1f7e0, 0x1f7eb],
  [0x1f7f0],
  [0x1f800, 0x1f80b],
  [0x1f810, 0x1f847],
  [0x1f850, 0x1f859],
  [0x1f860, 0x1f887],
  [0x1f890, 0x1f8ad],
  [0x1f8b0, 0x1f8b1],
  [0x1f900, 0x1fa53],
  [0x1fa60, 0x1fa6d],
  [0x1fa70, 0x1fa7c],
  [0x1fa80, 0x1fa88],
  [0x1fa90, 0x1fabd],
  [0x1fabf, 0x1fac5],
  [0x1face, 0x1fadb],
  [0x1fae0, 0x1fae8],
  [0x1faf0, 0x1faf8],
  [0x1fb00, 0x1fb92],
  [0x1fb94, 0x1fbca],
  [0x1fbf0, 0x1fbf9],
  [0x20000],
  [0x2a6df],
  [0x2a700],
  [0x2b739],
  [0x2b740],
  [0x2b81d],
  [0x2b820],
  [0x2cea1],
  [0x2ceb0],
  [0x2ebe0],
  [0x2ebf0],
  [0x2ee5d],
  [0x2f800, 0x2fa1d],
  [0x30000],
  [0x3134a],
  [0x31350],
  [0x323af],
];

/**
 * Same as {@link autonomousGraphemeRanges} but only made of NFD decomposable graphemes.
 * We preserved only one version of each decomposition meaning that if c1.normalize('NFD') === c2.normalize('NFD')
 * we only preserved the first one to build our set of ranges.
 * As such we found 998 NFD decomposable graphemes and kept 980 of them spread into 197 ranges.
 * @internal
 */
export const autonomousDecomposableGraphemeRanges: GraphemeRange[] = [
  [0xc0, 0xc5],
  [0xc7, 0xcf],
  [0xd1, 0xd6],
  [0xd9, 0xdd],
  [0xe0, 0xe5],
  [0xe7, 0xef],
  [0xf1, 0xf6],
  [0xf9, 0xfd],
  [0xff, 0x10f],
  [0x112, 0x125],
  [0x128, 0x130],
  [0x134, 0x137],
  [0x139, 0x13e],
  [0x143, 0x148],
  [0x14c, 0x151],
  [0x154, 0x165],
  [0x168, 0x17e],
  [0x1a0, 0x1a1],
  [0x1af, 0x1b0],
  [0x1cd, 0x1dc],
  [0x1de, 0x1e3],
  [0x1e6, 0x1f0],
  [0x1f4, 0x1f5],
  [0x1f8, 0x21b],
  [0x21e, 0x21f],
  [0x226, 0x233],
  [0x385, 0x386],
  [0x388, 0x38a],
  [0x38c],
  [0x38e, 0x390],
  [0x3aa, 0x3b0],
  [0x3ca, 0x3ce],
  [0x3d3, 0x3d4],
  [0x400, 0x401],
  [0x403],
  [0x407],
  [0x40c, 0x40e],
  [0x419],
  [0x439],
  [0x450, 0x451],
  [0x453],
  [0x457],
  [0x45c, 0x45e],
  [0x476, 0x477],
  [0x4c1, 0x4c2],
  [0x4d0, 0x4d3],
  [0x4d6, 0x4d7],
  [0x4da, 0x4df],
  [0x4e2, 0x4e7],
  [0x4ea, 0x4f5],
  [0x4f8, 0x4f9],
  [0x622, 0x626],
  [0x6c0],
  [0x6c2],
  [0x6d3],
  [0x929],
  [0x931],
  [0x934],
  [0x958, 0x95f],
  [0x9dc, 0x9dd],
  [0x9df],
  [0xa33],
  [0xa36],
  [0xa59, 0xa5b],
  [0xa5e],
  [0xb5c, 0xb5d],
  [0xb94],
  [0xf43],
  [0xf4d],
  [0xf52],
  [0xf57],
  [0xf5c],
  [0xf69],
  [0x1026],
  [0x1b06],
  [0x1b08],
  [0x1b0a],
  [0x1b0c],
  [0x1b0e],
  [0x1b12],
  [0x1e00, 0x1e99],
  [0x1e9b],
  [0x1ea0, 0x1ef9],
  [0x1f00, 0x1f15],
  [0x1f18, 0x1f1d],
  [0x1f20, 0x1f45],
  [0x1f48, 0x1f4d],
  [0x1f50, 0x1f57],
  [0x1f59],
  [0x1f5b],
  [0x1f5d],
  [0x1f5f, 0x1f70],
  [0x1f72],
  [0x1f74],
  [0x1f76],
  [0x1f78],
  [0x1f7a],
  [0x1f7c],
  [0x1f80, 0x1fb4],
  [0x1fb6, 0x1fba],
  [0x1fbc],
  [0x1fc1, 0x1fc4],
  [0x1fc6, 0x1fc8],
  [0x1fca],
  [0x1fcc, 0x1fd2],
  [0x1fd6, 0x1fda],
  [0x1fdd, 0x1fe2],
  [0x1fe4, 0x1fea],
  [0x1fec, 0x1fed],
  [0x1ff2, 0x1ff4],
  [0x1ff6, 0x1ff8],
  [0x1ffa],
  [0x1ffc],
  [0x219a, 0x219b],
  [0x21ae],
  [0x21cd, 0x21cf],
  [0x2204],
  [0x2209],
  [0x220c],
  [0x2224],
  [0x2226],
  [0x2241],
  [0x2244],
  [0x2247],
  [0x2249],
  [0x2260],
  [0x2262],
  [0x226d, 0x2271],
  [0x2274, 0x2275],
  [0x2278, 0x2279],
  [0x2280, 0x2281],
  [0x2284, 0x2285],
  [0x2288, 0x2289],
  [0x22ac, 0x22af],
  [0x22e0, 0x22e3],
  [0x22ea, 0x22ed],
  [0x2adc],
  [0x304c],
  [0x304e],
  [0x3050],
  [0x3052],
  [0x3054],
  [0x3056],
  [0x3058],
  [0x305a],
  [0x305c],
  [0x305e],
  [0x3060],
  [0x3062],
  [0x3065],
  [0x3067],
  [0x3069],
  [0x3070, 0x3071],
  [0x3073, 0x3074],
  [0x3076, 0x3077],
  [0x3079, 0x307a],
  [0x307c, 0x307d],
  [0x3094],
  [0x309e],
  [0x30ac],
  [0x30ae],
  [0x30b0],
  [0x30b2],
  [0x30b4],
  [0x30b6],
  [0x30b8],
  [0x30ba],
  [0x30bc],
  [0x30be],
  [0x30c0],
  [0x30c2],
  [0x30c5],
  [0x30c7],
  [0x30c9],
  [0x30d0, 0x30d1],
  [0x30d3, 0x30d4],
  [0x30d6, 0x30d7],
  [0x30d9, 0x30da],
  [0x30dc, 0x30dd],
  [0x30f4],
  [0x30f7, 0x30fa],
  [0x30fe],
  [0xac00],
  [0xd7a3],
  [0xfb1d],
  [0xfb1f],
  [0xfb2a, 0xfb36],
  [0xfb38, 0xfb3c],
  [0xfb3e],
  [0xfb40, 0xfb41],
  [0xfb43, 0xfb44],
  [0xfb46, 0xfb4e],
  [0x1109a],
  [0x1109c],
  [0x110ab],
  [0x1d15e, 0x1d164],
  [0x1d1bb, 0x1d1c0],
];
