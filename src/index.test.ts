import { describe, it, expect } from "vitest";
import { encode, decode } from "./index.js";

describe("decode", () => {
  describe("non-decoded text", () => {
    it("returns plain ASCII unchanged", () => {
      expect(decode("hello")).toBe("hello");
    });

    it("returns empty string unchanged", () => {
      expect(decode("")).toBe("");
    });

    it("returns single characters unchanged", () => {
      expect(decode("a")).toBe("a");
      expect(decode("o")).toBe("o");
    });
  });

  describe("extended Latin digraphs", () => {
    it("decodes aw → ă", () => {
      expect(decode("aw")).toBe("ă");
    });

    it("decodes aa → â", () => {
      expect(decode("aa")).toBe("â");
    });

    it("decodes dd → đ", () => {
      expect(decode("dd")).toBe("đ");
    });

    it("decodes ee → ê", () => {
      expect(decode("ee")).toBe("ê");
    });

    it("decodes oo → ô", () => {
      expect(decode("oo")).toBe("ô");
    });

    it("decodes ow → ơ", () => {
      expect(decode("ow")).toBe("ơ");
    });

    it("decodes uw → ư", () => {
      expect(decode("uw")).toBe("ư");
    });
  });

  describe("escape sequences", () => {
    it("ooo → oo", () => {
      expect(decode("ooo")).toBe("oo");
    });

    it("oww → ow", () => {
      expect(decode("oww")).toBe("ow");
    });

    it("aww → aw", () => {
      expect(decode("aww")).toBe("aw");
    });

    it("aaa → aa", () => {
      expect(decode("aaa")).toBe("aa");
    });

    it("ddd → dd", () => {
      expect(decode("ddd")).toBe("dd");
    });

    it("eee → ee", () => {
      expect(decode("eee")).toBe("ee");
    });

    it("uww → uw", () => {
      expect(decode("uww")).toBe("uw");
    });
  });

  describe("case handling", () => {
    it("uppercase first char produces uppercase decoded char", () => {
      expect(decode("Aw")).toBe("Ă");
      expect(decode("Aa")).toBe("Â");
      expect(decode("Dd")).toBe("Đ");
      expect(decode("Ee")).toBe("Ê");
      expect(decode("Oo")).toBe("Ô");
      expect(decode("Ow")).toBe("Ơ");
      expect(decode("Uw")).toBe("Ư");
    });

    it("lowercase first char produces lowercase decoded char", () => {
      expect(decode("ow")).toBe("ơ");
    });

    it("escape preserves literal characters as-is", () => {
      expect(decode("Oww")).toBe("Ow");
    });
  });

  describe("digraphs in context", () => {
    it("decodes digraph within a word", () => {
      expect(decode("dow")).toBe("dơ");
    });

    it("oow passes through unchanged (ôw is not valid Vietnamese)", () => {
      expect(decode("oow")).toBe("oow");
    });

    it("decodes digraph at start of word", () => {
      expect(decode("owng")).toBe("ơng");
    });
  });
});

describe("non-Vietnamese passthrough", () => {
  it("show → show (sh is not a valid initial consonant)", () => {
    expect(decode("show")).toBe("show");
  });
  it("odd → odd (dd is not a valid final consonant)", () => {
    expect(decode("odd")).toBe("odd");
  });
  it("zero → zero (z is not a valid initial consonant)", () => {
    expect(decode("zero")).toBe("zero");
  });
  it("three → three (thr: r is not a vowel after th)", () => {
    expect(decode("three")).toBe("three");
  });
  it("jeff → jeff (j is not a valid initial consonant)", () => {
    expect(decode("jeff")).toBe("jeff");
  });
  it("war → war (w is not a valid initial consonant)", () => {
    expect(decode("war")).toBe("war");
  });
  it("still decodes Vietnamese words in mixed input", () => {
    expect(decode("show owng")).toBe("show ơng");
  });
});

describe("decode strict words mode", () => {
  describe("non-strict words is unchanged", () => {
    it("decode(za) → za (z passes through without strict words)", () => {
      expect(decode("za")).toBe("za");
    });

    it("decode(cad) → cad (d not trimmed without strict words)", () => {
      expect(decode("cad")).toBe("cad");
    });
  });

  describe("character discarding", () => {
    it("za → a (z is not a Vietnamese letter)", () => {
      expect(decode("za", { strictWords: true })).toBe("a");
    });

    it("fam → am (f is not a Vietnamese letter)", () => {
      expect(decode("fam", { strictWords: true })).toBe("am");
    });

    it("tone letters at end are not discarded: maj → mạ", () => {
      expect(decode("maj", { strictWords: true })).toBe("mạ");
    });

    it("tone letters at end are not discarded: maf → mà", () => {
      expect(decode("maf", { strictWords: true })).toBe("mà");
    });
  });

  describe("escape sequences", () => {
    it("ooo → oo (oo is a valid Vietnamese vowel cluster)", () => {
      expect(decode("ooo", { strictWords: true })).toBe("oo");
    });

    it("xooong → xoong (oo escape honored mid-word)", () => {
      expect(decode("xooong", { strictWords: true })).toBe("xoong");
    });

    it("oww → ơ (ow not a Vietnamese cluster, w discarded)", () => {
      expect(decode("oww", { strictWords: true })).toBe("ơ");
    });

    it("aww → ă (aw not a Vietnamese cluster, w discarded)", () => {
      expect(decode("aww", { strictWords: true })).toBe("ă");
    });

    it("uww → ư (uw not a Vietnamese cluster, w discarded)", () => {
      expect(decode("uww", { strictWords: true })).toBe("ư");
    });

    it("owwr → ở (ow decoded, w discarded, tone r applied)", () => {
      expect(decode("owwr", { strictWords: true })).toBe("ở");
    });

    it("aaa → â (aa not a Vietnamese cluster, escape and trigger discarded)", () => {
      expect(decode("aaa", { strictWords: true })).toBe("â");
    });

    it("ddd → đ (dd not a Vietnamese cluster, escape and trigger discarded)", () => {
      expect(decode("ddd", { strictWords: true })).toBe("đ");
    });

    it("eee → ê (ee not a Vietnamese cluster, escape and trigger discarded)", () => {
      expect(decode("eee", { strictWords: true })).toBe("ê");
    });
  });

  describe("final consonant trimming", () => {
    it("cad → ca (d is not a valid final consonant)", () => {
      expect(decode("cad", { strictWords: true })).toBe("ca");
    });

    it("cads → cá (d trimmed, then tone s applied)", () => {
      expect(decode("cads", { strictWords: true })).toBe("cá");
    });

    it("case → cá (tone s in suffix recovered while trimming e)", () => {
      expect(decode("case", { strictWords: true })).toBe("cá");
    });

    it("cafes → cá (end tone s wins over embedded tone f, e trimmed)", () => {
      expect(decode("cafes", { strictWords: true })).toBe("cá");
    });

    it("cang → cang (ng is a valid final consonant)", () => {
      expect(decode("cang", { strictWords: true })).toBe("cang");
    });

    it("canh → canh (nh is a valid final consonant)", () => {
      expect(decode("canh", { strictWords: true })).toBe("canh");
    });

    it("cach → cach (ch is a valid final consonant)", () => {
      expect(decode("cach", { strictWords: true })).toBe("cach");
    });
  });

  describe("strict tones", () => {
    it("mafu → màu (tone letter after vowel, more vowels follow)", () => {
      expect(decode("mafu")).toBe("màu");
    });

    it("mfau → mfau (tone letter before any vowel, not Vietnamese)", () => {
      expect(decode("mfau")).toBe("mfau");
    });

    it("mafu → màu when strict words (f is mid-word tone, u is vowel)", () => {
      expect(decode("mafu", { strictWords: true })).toBe("màu");
    });

    it("mafu → mafu when strict tones (explicit opt-in)", () => {
      expect(decode("mafu", { strictTones: true })).toBe("mafu");
    });

    it("mafsu → máu (last tone wins: s after f)", () => {
      expect(decode("mafsu")).toBe("máu");
    });
  });
});

describe("encode", () => {
  describe("non-encoded text", () => {
    it("returns plain ASCII unchanged", () => {
      expect(encode("hello")).toBe("hello");
    });

    it("returns empty string unchanged", () => {
      expect(encode("")).toBe("");
    });

    it("returns single characters unchanged", () => {
      expect(encode("a")).toBe("a");
      expect(encode("o")).toBe("o");
    });
  });

  describe("extended Latin chars", () => {
    it("encodes ă → aw", () => {
      expect(encode("ă")).toBe("aw");
    });

    it("encodes â → aa", () => {
      expect(encode("â")).toBe("aa");
    });

    it("encodes đ → dd", () => {
      expect(encode("đ")).toBe("dd");
    });

    it("encodes ê → ee", () => {
      expect(encode("ê")).toBe("ee");
    });

    it("encodes ô → oo", () => {
      expect(encode("ô")).toBe("oo");
    });

    it("encodes ơ → ow", () => {
      expect(encode("ơ")).toBe("ow");
    });

    it("encodes ư → uw", () => {
      expect(encode("ư")).toBe("uw");
    });
  });

  describe("case handling", () => {
    it("uppercase char produces uppercase first digraph char", () => {
      expect(encode("Ă")).toBe("Aw");
      expect(encode("Â")).toBe("Aa");
      expect(encode("Đ")).toBe("Dd");
      expect(encode("Ê")).toBe("Ee");
      expect(encode("Ô")).toBe("Oo");
      expect(encode("Ơ")).toBe("Ow");
      expect(encode("Ư")).toBe("Uw");
    });

    it("lowercase char produces lowercase digraph", () => {
      expect(encode("ơ")).toBe("ow");
    });
  });

  describe("chars in context", () => {
    it("encodes char within a word", () => {
      expect(encode("dơ")).toBe("dow");
    });

    it("encodes char at start of word", () => {
      expect(encode("ơng")).toBe("owng");
    });

    it("passes through non-Vietnamese chars alongside encoded chars", () => {
      expect(encode("ôw")).toBe("oow");
    });
  });

  describe("escape sequences", () => {
    it("aw → aww", () => {
      expect(encode("aw")).toBe("aww");
    });

    it("aa → aaa", () => {
      expect(encode("aa")).toBe("aaa");
    });

    it("dd → ddd", () => {
      expect(encode("dd")).toBe("ddd");
    });

    it("ee → eee", () => {
      expect(encode("ee")).toBe("eee");
    });

    it("oo → ooo", () => {
      expect(encode("oo")).toBe("ooo");
    });

    it("ow → oww", () => {
      expect(encode("ow")).toBe("oww");
    });

    it("uw → uww", () => {
      expect(encode("uw")).toBe("uww");
    });
  });

  describe("roundtrip", () => {
    it("decode(encode(x)) === x for Vietnamese text", () => {
      expect(decode(encode("ơng"))).toBe("ơng");
      expect(decode(encode("Đông"))).toBe("Đông");
    });

    it("encode(decode(x)) === x for Telex input", () => {
      expect(encode(decode("owng"))).toBe("owng");
      expect(encode(decode("Ddowng"))).toBe("Ddowng");
    });

    it("decode(encode(x)) === x for digraph sequences", () => {
      expect(decode(encode("aw"))).toBe("aw");
      expect(decode(encode("aa"))).toBe("aa");
      expect(decode(encode("dd"))).toBe("dd");
      expect(decode(encode("ee"))).toBe("ee");
      expect(decode(encode("oo"))).toBe("oo");
      expect(decode(encode("ow"))).toBe("ow");
      expect(decode(encode("uw"))).toBe("uw");
    });
  });
});

describe("decode tones", () => {
  describe("basic tones", () => {
    it("decodes sắc: mas → má", () => {
      expect(decode("mas")).toBe("má");
    });

    it("decodes huyền: maf → mà", () => {
      expect(decode("maf")).toBe("mà");
    });

    it("decodes hỏi: mar → mả", () => {
      expect(decode("mar")).toBe("mả");
    });

    it("decodes ngã: max → mã", () => {
      expect(decode("max")).toBe("mã");
    });

    it("decodes nặng: maj → mạ", () => {
      expect(decode("maj")).toBe("mạ");
    });
  });

  describe("tone clear", () => {
    it("maz → ma (z removes tone)", () => {
      expect(decode("maz")).toBe("ma");
    });

    it("masz → ma (s then z: z clears)", () => {
      expect(decode("masz")).toBe("ma");
    });
  });

  describe("tone overwrite", () => {
    it("mafs → má (f then s: last wins)", () => {
      expect(decode("mafs")).toBe("má");
    });

    it("mazs → má (z then s: last wins)", () => {
      expect(decode("mazs")).toBe("má");
    });
  });

  describe("tone escape", () => {
    it("catss → cats (doubled s = literal s)", () => {
      expect(decode("catss")).toBe("cats");
    });
  });

  describe("consonant letters not consumed as tones", () => {
    it("sao → sao (s before vowel is a consonant)", () => {
      expect(decode("sao")).toBe("sao");
    });

    it("sang → sang", () => {
      expect(decode("sang")).toBe("sang");
    });
  });

  describe("tone with final consonant (tone at end of word)", () => {
    it("hoongf → hồng (ô + ng + huyền)", () => {
      expect(decode("hoongf")).toBe("hồng");
    });
  });

  describe("tone placement on diphthongs", () => {
    it("mais → mái (ai: tone on a, index 0)", () => {
      expect(decode("mais")).toBe("mái");
    });

    it("hoas → hoá (oa: tone on a, index 1)", () => {
      expect(decode("hoas")).toBe("hoá");
    });
  });

  describe("tone placement on triphthongs", () => {
    it("Nguyeenx → Nguyễn (uyê: tone on ê, index 2)", () => {
      expect(decode("Nguyeenx")).toBe("Nguyễn");
    });
  });
});

describe("encode tones", () => {
  it("encodes sắc: má → mas", () => {
    expect(encode("má")).toBe("mas");
  });

  it("encodes huyền: mà → maf", () => {
    expect(encode("mà")).toBe("maf");
  });

  it("encodes hỏi: mả → mar", () => {
    expect(encode("mả")).toBe("mar");
  });

  it("encodes ngã: mã → max", () => {
    expect(encode("mã")).toBe("max");
  });

  it("encodes nặng: mạ → maj", () => {
    expect(encode("mạ")).toBe("maj");
  });

  it("encodes hồng → hoongf (tone at end of word, after final consonant)", () => {
    expect(encode("hồng")).toBe("hoongf");
  });

  it("encodes Nguyễn → Nguyeenx (uyê: tone on ê, index 2)", () => {
    expect(encode("Nguyễn")).toBe("Nguyeenx");
  });

  describe("roundtrip with tones", () => {
    it("decode(encode(x)) === x for toned Vietnamese", () => {
      expect(decode(encode("hồng"))).toBe("hồng");
      expect(decode(encode("hoàng"))).toBe("hoàng");
    });

    it("encode(decode(x)) === x for toned Telex", () => {
      expect(encode(decode("hoongf"))).toBe("hoongf");
      expect(encode(decode("hoas"))).toBe("hoas");
    });
  });
});
