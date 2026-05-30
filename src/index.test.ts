import { describe, it, expect } from "vitest";
import { encode } from "./index.js";

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
