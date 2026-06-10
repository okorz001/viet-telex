import { describe, it, expect } from "vitest";
import {
  encode,
  decode,
  decode2,
  render,
  validate,
  parseWord,
  Decoder,
  type Word,
} from "./index.js";

// all tests should have a single assertion
// test names should be either "<input> → <output>"

describe("render", () => {
  const cases: [Word, string][] = [
    // plain concatenation of parts
    [{ initialConsonant: "b", vowel: "a" }, "ba"],
    [{ initialConsonant: "b", vowel: "a", finalConsonant: "nh" }, "banh"],
    // Telex digraph decoding
    [{ initialConsonant: "dd", vowel: "a" }, "đa"],
    [{ vowel: "uw" }, "ư"],
    [{ vowel: "uaa" }, "uâ"],
    // escaped digraph (doubled second character → literal)
    [{ vowel: "ooo" }, "oo"],
    // tone marks on a single vowel
    [{ vowel: "a", tone: "s" }, "á"],
    [{ vowel: "a", tone: "f" }, "à"],
    [{ vowel: "a", tone: "r" }, "ả"],
    [{ vowel: "a", tone: "x" }, "ã"],
    [{ vowel: "a", tone: "j" }, "ạ"],
    // no tone leaves the vowel bare
    [{ vowel: "a" }, "a"],
    // nucleus placement on compound vowels
    [{ vowel: "oa", tone: "s" }, "oá"],
    [{ vowel: "uyee", tone: "s" }, "uyế"],
    // gi/qu place the tone past the consonant's trailing vowel letter
    [{ initialConsonant: "gi", vowel: "a", tone: "s" }, "giá"],
    [{ initialConsonant: "gi", tone: "f" }, "gì"],
    [
      { initialConsonant: "qu", vowel: "uyee", finalConsonant: "n", tone: "r" },
      "quyển",
    ],
    // full syllable with a final consonant and tone
    [
      { initialConsonant: "b", vowel: "a", finalConsonant: "nh", tone: "s" },
      "bánh",
    ],
  ];

  it.for(cases)("%j → %s", ([word, output]) => {
    expect(render(word)).toBe(output);
  });
});

describe("validate", () => {
  const cases: [Word, boolean][] = [
    // minimal valid syllables
    [{ vowel: "a" }, true],
    [{ initialConsonant: "b", vowel: "a" }, true],
    [{ initialConsonant: "b", vowel: "a", finalConsonant: "nh" }, true],
    [{ initialConsonant: "ngh", vowel: "ee" }, true], // nghê
    // Telex digraph vowels decode before checking
    [{ vowel: "uw" }, true], // ư
    [{ vowel: "uaa" }, true], // uâ
    // valid compound vowel clusters
    [{ vowel: "oa" }, true],
    [{ vowel: "uyee" }, true], // uyê
    // gi/qu supply their own nucleus (the i/u)
    [{ initialConsonant: "gi" }, true], // gi
    [{ initialConsonant: "gi", finalConsonant: "n" }, true], // gìn
    [{ initialConsonant: "qu", vowel: "uyee", finalConsonant: "n" }, true], // quyên
    // bare consonant token, e.g. đ from dd
    [{ initialConsonant: "dd" }, true],
    // invalid initial consonant
    [{ initialConsonant: "f", vowel: "a" }, false],
    [{ initialConsonant: "sh", vowel: "o" }, false],
    // invalid vowel cluster
    [{ initialConsonant: "t", vowel: "ea" }, false],
    // invalid final consonant
    [{ initialConsonant: "s", vowel: "ee", finalConsonant: "d" }, false],
    // a final consonant with no vowel is not a syllable
    [{ finalConsonant: "n" }, false],
    // empty word
    [{}, false],
  ];

  it.for(cases)("%j → %s", ([word, valid]) => {
    expect(validate(word)).toBe(valid);
  });
});

describe("parseWord", () => {
  const cases: [string, Word | null][] = [
    // initial consonant + vowel
    ["ba", { initialConsonant: "b", vowel: "a" }],
    ["banh", { initialConsonant: "b", vowel: "a", finalConsonant: "nh" }],
    // no initial consonant
    ["a", { vowel: "a" }],
    ["oa", { vowel: "oa" }],
    // Telex digraphs are kept in Telex form, original case preserved
    ["dda", { initialConsonant: "dd", vowel: "a" }],
    ["Ow", { vowel: "Ow" }],
    ["uw", { vowel: "uw" }],
    // escaped digraph stays as the escape sequence
    ["ooo", { vowel: "ooo" }],
    // trigraph initial
    ["nghee", { initialConsonant: "ngh", vowel: "ee" }],
    // bare consonant token (đ from dd)
    ["dd", { initialConsonant: "dd" }],
    // gi/qu without an explicit vowel
    ["gi", { initialConsonant: "gi" }],
    ["gin", { initialConsonant: "gi", finalConsonant: "n" }],
    // gi/qu with a vowel that is already a complete nucleus: no prepend
    ["gia", { initialConsonant: "gi", vowel: "a" }],
    ["que", { initialConsonant: "qu", vowel: "e" }],
    ["qua", { initialConsonant: "qu", vowel: "a" }],
    // gi/qu lending their i/u to complete the cluster
    ["quyeen", { initialConsonant: "qu", vowel: "uyee", finalConsonant: "n" }],
    // invalid: unknown initial consonant
    ["fox", null],
    // invalid: vowel cluster that is not a nucleus
    ["tea", null],
    // invalid: bad final consonant
    ["seed", null],
    // invalid: empty input
    ["", null],
  ];

  it.for(cases)("%j → %j", ([input, expected]) => {
    expect(parseWord(input)).toEqual(expected);
  });
});

describe("Decoder", () => {
  it("decodes a buffered word", () => {
    const dec = new Decoder();
    for (const ch of "banhs") dec.write(ch);
    expect(dec.read()).toBe("bánh");
  });

  it("clear resets the buffer between words", () => {
    const dec = new Decoder();
    for (const ch of "phowr") dec.write(ch);
    dec.clear();
    for (const ch of "gif") dec.write(ch);
    expect(dec.read()).toBe("gì");
  });
});

describe("decode2 matches decode (non-strict path)", () => {
  // The new Decoder pipeline must reproduce the existing decode output exactly.
  // strictWords is covered by decode2 delegating to the original pipeline, so
  // these cases exercise the default and strictTones routes.
  const inputs = [
    // digraphs and their escapes (incl. case)
    "aa",
    "aw",
    "dd",
    "ee",
    "oo",
    "ow",
    "uw",
    "Ow",
    "oW",
    "aaa",
    "aww",
    "ddd",
    "eee",
    "ooo",
    "oww",
    "uww",
    "Oww",
    "oWw",
    "owW",
    // tones, overwrite, and tone escapes
    "as",
    "af",
    "ar",
    "ax",
    "aj",
    "az",
    "afs",
    "asf",
    "azs",
    "asz",
    "ass",
    "aff",
    "arr",
    "axx",
    "ajj",
    "azz",
    // initial consonants that look like tones
    "sa",
    "ra",
    "xa",
    // tone placement on compound vowels
    "ais",
    "aos",
    "aus",
    "ays",
    "aaus",
    "aays",
    "eos",
    "eeus",
    "ias",
    "iees",
    "ieeus",
    "ius",
    "oas",
    "oais",
    "oaos",
    "oaws",
    "oes",
    "oeos",
    "ois",
    "ooos",
    "oois",
    "owis",
    "uas",
    "uees",
    "uis",
    "uoos",
    "uys",
    "uyas",
    "uyees",
    "uwas",
    "uwis",
    "uwows",
    "uwus",
    "yeeus",
    // gi / qu
    "gif",
    "gias",
    "gios",
    "quas",
    "ques",
    "quyeenr",
    // non-Vietnamese passthrough
    "fox",
    "jar",
    "war",
    "zero",
    "show",
    "teas",
    "treat",
    "treats",
    "odd",
    "seed",
    // mid-word tones
    "mafu",
    "tism",
    "thicsh",
    // multi-word with separators
    "phowr",
    "banhs mif",
    "show me the banhs mif",
    "banhs mif for me",
  ];

  describe("default options", () => {
    it.for(inputs)("%s", (input) => {
      expect(decode2(input)).toBe(decode(input));
    });
  });

  describe("with strictTones", () => {
    it.for(inputs)("%s", (input) => {
      expect(decode2(input, { strictTones: true })).toBe(
        decode(input, { strictTones: true }),
      );
    });
  });
});

describe("decode", () => {
  describe("extended Latin digraphs", () => {
    it.for([
      ["aa", "â"],
      ["aw", "ă"],
      ["dd", "đ"],
      ["ee", "ê"],
      ["oo", "ô"],
      ["ow", "ơ"],
      ["uw", "ư"],
    ])("%s → %s", ([input, output]) => {
      expect(decode(input)).toBe(output);
    });
  });

  describe("digraph case handling", () => {
    it.for([
      ["Ow", "Ơ"],
      ["oW", "ơ"],
    ])("%s → %s", ([input, output]) => {
      expect(decode(input)).toBe(output);
    });
  });

  describe("digraph escape sequences", () => {
    it.for([
      ["aaa", "aa"],
      ["aww", "aw"],
      ["ddd", "dd"],
      ["eee", "ee"],
      ["ooo", "oo"],
      ["oww", "ow"],
      ["uww", "uw"],
    ])("%s → %s", ([input, output]) => {
      expect(decode(input)).toBe(output);
    });

    describe("with strictWords option", () => {
      it.for([
        ["aaa", "â"],
        ["aww", "ă"],
        ["ddd", "đ"],
        ["eee", "ê"],
        ["ooo", "oo"], // valid Vietnamese
        ["oww", "ơ"],
        ["uww", "ư"],
      ])("%s → %s", ([input, output]) => {
        expect(decode(input, { strictWords: true })).toBe(output);
      });
    });
  });

  describe("digraph escape case handling", () => {
    it.for([
      ["Oww", "Ow"],
      ["oWw", "oW"],
      ["owW", "ow"],
    ])("%s → %s", ([input, output]) => {
      expect(decode(input)).toBe(output);
    });
  });

  describe("tone marks", () => {
    it.for([
      ["as", "á"],
      ["af", "à"],
      ["ar", "ả"],
      ["ax", "ã"],
      ["aj", "ạ"],
      ["az", "a"],
    ])("%s → %s", ([input, output]) => {
      expect(decode(input)).toBe(output);
    });
  });

  describe("tone overwrite", () => {
    it.for([
      ["afs", "á"],
      ["asf", "à"],
      ["azs", "á"],
      ["asz", "a"],
    ])("%s → %s", ([input, output]) => {
      expect(decode(input)).toBe(output);
    });
  });

  describe("tone escape sequences", () => {
    it.for([
      ["ass", "as"],
      ["aff", "af"],
      ["arr", "ar"],
      ["axx", "ax"],
      ["ajj", "aj"],
      ["azz", "az"],
    ])("%s → %s", ([input, output]) => {
      expect(decode(input)).toBe(output);
    });
  });

  describe("initial consonants are not tones", () => {
    it.for([
      ["sa", "sa"],
      ["ra", "ra"],
      ["xa", "xa"],
    ])("%s → %s", ([input, output]) => {
      expect(decode(input)).toBe(output);
    });
  });

  describe("tone mark is placed on the vowel of the word", () => {
    it.for([
      ["phowr", "phở"],
      ["banhs mif", "bánh mì"],
    ])("%s → %s", ([input, output]) => {
      expect(decode(input)).toBe(output);
    });
  });

  describe("tone mark placement on compound vowels", () => {
    it.for([
      ["ais", "ái"],
      ["aos", "áo"],
      ["aus", "áu"],
      ["ays", "áy"],
      ["aaus", "ấu"],
      ["aays", "ấy"],
      ["eos", "éo"],
      ["eeus", "ếu"],
      ["ias", "ía"],
      ["iees", "iế"],
      ["ieeus", "iếu"],
      ["ius", "íu"],
      ["oas", "oá"],
      ["oais", "oái"],
      ["oaos", "oáo"],
      ["oaws", "oắ"],
      ["oes", "oé"],
      ["oeos", "oéo"],
      ["ois", "ói"],
      ["ooos", "oó"],
      ["oois", "ối"],
      ["owis", "ới"],
      ["uas", "úa"],
      ["uees", "uế"],
      ["uis", "úi"],
      ["uoos", "uố"],
      ["uys", "uý"],
      ["uyas", "uýa"],
      ["uyees", "uyế"],
      ["uwas", "ứa"],
      ["uwis", "ứi"],
      ["uwows", "ướ"],
      ["uwus", "ứu"],
      ["yeeus", "yếu"],
    ])("%s → %s", ([input, output]) => {
      expect(decode(input)).toBe(output);
    });
  });

  describe("non-Vietnamese", () => {
    describe("passthrough by default", () => {
      describe("invalid initial consonant", () => {
        it.for([
          ["fox", "fox"],
          ["jar", "jar"],
          ["war", "war"],
          ["zero", "zero"],
          ["show", "show"],
        ])("%s → %s", ([input, output]) => {
          expect(decode(input)).toBe(output);
        });
      });

      describe("invalid vowel", () => {
        it.for([
          ["teas", "teas"],
          ["treat", "treat"],
          ["treats", "treats"],
        ])("%s → %s", ([input, output]) => {
          expect(decode(input)).toBe(output);
        });
      });

      describe("invalid final consonant", () => {
        it.for([
          ["odd", "odd"],
          ["seed", "seed"],
        ])("%s → %s", ([input, output]) => {
          expect(decode(input)).toBe(output);
        });
      });

      describe("mixed content", () => {
        it.for([
          ["show me the banhs mif", "show me the bánh mì"],
          ["banhs mif for me", "bánh mì for me"],
        ])("%s → %s", ([input, output]) => {
          expect(decode(input)).toBe(output);
        });
      });
    });

    describe("discard with strictWords option", () => {
      describe("invalid initial consonant", () => {
        it.for([
          ["fox", "õ"],
          ["jar", "ả"],
          ["war", "ả"],
          ["zero", "ẻ"],
          ["show", "sơ"],
        ])("%s → %s", ([input, output]) => {
          expect(decode(input, { strictWords: true })).toBe(output);
        });
      });

      describe("invalid vowel", () => {
        it.for([
          ["teas", "té"],
          ["treat", "tret"],
          ["treats", "trét"],
        ])("%s → %s", ([input, output]) => {
          expect(decode(input, { strictWords: true })).toBe(output);
        });
      });

      describe("invalid final consonant", () => {
        it.for([
          ["odd", "o"],
          ["seed", "sê"],
        ])("%s → %s", ([input, output]) => {
          expect(decode(input, { strictWords: true })).toBe(output);
        });
      });
    });
  });

  describe("gi and qu consonants", () => {
    it.for([
      ["gif", "gì"],
      ["gias", "giá"],
      ["gios", "gió"],
      ["quas", "quá"],
      ["ques", "qué"],
      ["quyeenr", "quyển"],
    ])("%s → %s", ([input, output]) => {
      expect(decode(input)).toBe(output);
    });
  });

  describe("tone marks mid-word", () => {
    describe("lenient by default", () => {
      it.for([
        ["mafu", "màu"],
        ["tism", "tím"],
        ["thicsh", "thích"],
      ])("%s → %s", ([input, output]) => {
        expect(decode(input)).toBe(output);
      });
    });

    describe("non-Vietnamese with strictTone option", () => {
      it.for([
        ["mafu", "mafu"],
        ["tism", "tism"],
        ["thicsh", "thicsh"],
      ])("%s → %s", ([input, output]) => {
        expect(decode(input, { strictTones: true })).toBe(output);
      });
    });
  });
});

describe("encode", () => {
  describe("extended Latin digraphs", () => {
    it.for([
      ["â", "aa"],
      ["ă", "aw"],
      ["đ", "dd"],
      ["ê", "ee"],
      ["ô", "oo"],
      ["ơ", "ow"],
      ["ư", "uw"],
    ])("%s → %s", ([input, output]) => {
      expect(encode(input)).toBe(output);
    });
  });

  describe("digraph case handling", () => {
    it("Ơ → Ow", () => {
      expect(encode("Ơ")).toBe("Ow");
    });
  });

  describe("digraph escape sequences", () => {
    it.for([
      ["aa", "aaa"],
      ["aw", "aww"],
      ["dd", "ddd"],
      ["ee", "eee"],
      ["oo", "ooo"],
      ["ow", "oww"],
      ["uw", "uww"],
    ])("%s → %s", ([input, output]) => {
      expect(encode(input)).toBe(output);
    });
  });

  describe("digraph escape case handling", () => {
    it.for([
      ["Ow", "Oww"],
      ["oW", "oWw"],
    ])("%s → %s", ([input, output]) => {
      expect(encode(input)).toBe(output);
    });
  });

  describe("tone marks", () => {
    it.for([
      ["á", "as"],
      ["à", "af"],
      ["ả", "ar"],
      ["ã", "ax"],
      ["ạ", "aj"],
    ])("%s → %s", ([input, output]) => {
      expect(encode(input)).toBe(output);
    });
  });

  describe("tone escape sequences", () => {
    it.for([
      ["as", "ass"],
      ["af", "aff"],
      ["ar", "arr"],
      ["ax", "axx"],
      ["aj", "ajj"],
      ["az", "azz"],
    ])("%s → %s", ([input, output]) => {
      expect(encode(input)).toBe(output);
    });
  });

  describe("gi and qu consonants", () => {
    it.for([
      ["gì", "gif"],
      ["giá", "gias"],
      ["quá", "quas"],
      ["qué", "ques"],
      ["quyển", "quyeenr"],
    ])("%s → %s", ([input, output]) => {
      expect(encode(input)).toBe(output);
    });
  });

  describe("tone mark is placed at the end of the word", () => {
    it.for([
      ["phở", "phowr"],
      ["bánh mì", "banhs mif"],
    ])("%s → %s", ([input, output]) => {
      expect(encode(input)).toBe(output);
    });
  });
});
