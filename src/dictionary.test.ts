import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decode, encode } from "./index.js";

// Words confirmed by manual triage to be legitimately out of scope for the
// round-trip invariant (loanwords, abbreviations, etc.), not parser bugs.
// Do not add an entry here without first checking docs/vietnamese.md and
// whether the failure is actually fixable in NUCLEI / *_CONSONANTS (see the
// #58/#59 precedent).
const SKIP_LIST = new Set<string>([
  "Blowing dust and wind.", // not Vietnamese; junk entry in the source data
  "hắc buá", // source typo, tone mark on wrong vowel (should be "hắc búa")
  "hết viá", // source typo, tone mark on wrong vowel (should be "hết vía")
  "kịch muá", // source typo, tone mark on wrong vowel (should be "kịch múa")
  "ngư tiêù", // source typo, tone mark on wrong vowel (should be "ngư tiều")
  "hũu sản", // source typo, tone mark on wrong vowel (should be "hữu sản")
]);

describe("dictionary round-trip", () => {
  const path = new URL("../data/Viet22K.txt", import.meta.url);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is a fixed, hardcoded relative fixture path, not external input
  const words = readFileSync(path, "utf-8")
    .split("\n")
    .map((line) => line.trim().normalize("NFC"))
    .filter((word) => word.length > 0 && !SKIP_LIST.has(word));

  // Old-style vs. new-style tone mark placement (docs/vietnamese.md) is
  // deterministic, not ambiguous — but this dictionary is a data quality
  // problem: it's inconsistent about which convention individual entries
  // use. Old-style is checked first since it's the more common convention
  // in this dictionary; a word round-trips if either convention reproduces
  // it exactly.
  it(`decode(encode(word)) === word for all ${words.length} dictionary entries, trying old- and new-style tone placement`, () => {
    const failures = words
      .map((word) => {
        const encoded = encode(word);
        const old = decode(encoded, { tonePlacement: "old" });
        const nw = decode(encoded, { tonePlacement: "new" });
        return [word, old, nw] as const;
      })
      .filter(([word, old, nw]) => old !== word && nw !== word);
    expect(failures).toEqual([]);
  });
});
