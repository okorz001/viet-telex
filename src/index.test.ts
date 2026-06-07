import { describe, it, expect } from "vitest";
import { encode, decode } from "./index.js";

// all tests should have a single assertion
// test names should be either "<input> → <output>"

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
