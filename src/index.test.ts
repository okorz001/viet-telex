import { describe, it, expect } from "vitest";
import { encode, decode } from "./index.js";

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

  describe("extended Latin digraphs", () => {
    it("encodes aw → ă", () => {
      expect(encode("aw")).toBe("ă");
    });

    it("encodes aa → â", () => {
      expect(encode("aa")).toBe("â");
    });

    it("encodes dd → đ", () => {
      expect(encode("dd")).toBe("đ");
    });

    it("encodes ee → ê", () => {
      expect(encode("ee")).toBe("ê");
    });

    it("encodes oo → ô", () => {
      expect(encode("oo")).toBe("ô");
    });

    it("encodes ow → ơ", () => {
      expect(encode("ow")).toBe("ơ");
    });

    it("encodes uw → ư", () => {
      expect(encode("uw")).toBe("ư");
    });
  });

  describe("escape sequences", () => {
    it("ooo → oo", () => {
      expect(encode("ooo")).toBe("oo");
    });

    it("oww → ow", () => {
      expect(encode("oww")).toBe("ow");
    });

    it("aww → aw", () => {
      expect(encode("aww")).toBe("aw");
    });

    it("aaa → aa", () => {
      expect(encode("aaa")).toBe("aa");
    });

    it("ddd → dd", () => {
      expect(encode("ddd")).toBe("dd");
    });

    it("eee → ee", () => {
      expect(encode("eee")).toBe("ee");
    });

    it("uww → uw", () => {
      expect(encode("uww")).toBe("uw");
    });
  });

  describe("case handling", () => {
    it("uppercase first char produces uppercase encoded char", () => {
      expect(encode("Aw")).toBe("Ă");
      expect(encode("Aa")).toBe("Â");
      expect(encode("Dd")).toBe("Đ");
      expect(encode("Ee")).toBe("Ê");
      expect(encode("Oo")).toBe("Ô");
      expect(encode("Ow")).toBe("Ơ");
      expect(encode("Uw")).toBe("Ư");
    });

    it("lowercase first char produces lowercase encoded char", () => {
      expect(encode("ow")).toBe("ơ");
    });

    it("escape preserves literal characters as-is", () => {
      expect(encode("Oww")).toBe("Ow");
    });
  });

  describe("digraphs in context", () => {
    it("encodes digraph within a word", () => {
      expect(encode("dow")).toBe("dơ");
    });

    it("encodes oo then passes through trailing char", () => {
      expect(encode("oow")).toBe("ôw");
    });

    it("encodes digraph at start of word", () => {
      expect(encode("owng")).toBe("ơng");
    });
  });
});

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

  describe("extended Latin chars", () => {
    it("decodes ă → aw", () => {
      expect(decode("ă")).toBe("aw");
    });

    it("decodes â → aa", () => {
      expect(decode("â")).toBe("aa");
    });

    it("decodes đ → dd", () => {
      expect(decode("đ")).toBe("dd");
    });

    it("decodes ê → ee", () => {
      expect(decode("ê")).toBe("ee");
    });

    it("decodes ô → oo", () => {
      expect(decode("ô")).toBe("oo");
    });

    it("decodes ơ → ow", () => {
      expect(decode("ơ")).toBe("ow");
    });

    it("decodes ư → uw", () => {
      expect(decode("ư")).toBe("uw");
    });
  });

  describe("case handling", () => {
    it("uppercase char produces uppercase first digraph char", () => {
      expect(decode("Ă")).toBe("Aw");
      expect(decode("Â")).toBe("Aa");
      expect(decode("Đ")).toBe("Dd");
      expect(decode("Ê")).toBe("Ee");
      expect(decode("Ô")).toBe("Oo");
      expect(decode("Ơ")).toBe("Ow");
      expect(decode("Ư")).toBe("Uw");
    });

    it("lowercase char produces lowercase digraph", () => {
      expect(decode("ơ")).toBe("ow");
    });
  });

  describe("chars in context", () => {
    it("decodes char within a word", () => {
      expect(decode("dơ")).toBe("dow");
    });

    it("decodes char at start of word", () => {
      expect(decode("ơng")).toBe("owng");
    });

    it("passes through non-Vietnamese chars alongside decoded chars", () => {
      expect(decode("ôw")).toBe("oow");
    });
  });

  describe("roundtrip", () => {
    it("encode(decode(x)) === x for Vietnamese text", () => {
      expect(encode(decode("ơng"))).toBe("ơng");
      expect(encode(decode("Đông"))).toBe("Đông");
    });

    it("decode(encode(x)) === x for Telex input", () => {
      expect(decode(encode("owng"))).toBe("owng");
      expect(decode(encode("Ddowng"))).toBe("Ddowng");
    });
  });
});
