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

    it("decodes oo then passes through trailing char", () => {
      expect(decode("oow")).toBe("ôw");
    });

    it("decodes digraph at start of word", () => {
      expect(decode("owng")).toBe("ơng");
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

  describe("roundtrip", () => {
    it("decode(encode(x)) === x for Vietnamese text", () => {
      expect(decode(encode("ơng"))).toBe("ơng");
      expect(decode(encode("Đông"))).toBe("Đông");
    });

    it("encode(decode(x)) === x for Telex input", () => {
      expect(encode(decode("owng"))).toBe("owng");
      expect(encode(decode("Ddowng"))).toBe("Ddowng");
    });
  });
});
