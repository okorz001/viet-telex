import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decode, encode } from "./index.js";

// The dictionary has some invalid entries that must be skipped.
const SKIP_LIST = new Set<string>([
  "Blowing dust and wind.", // not Vietnamese; junk entry in the source data
  "hắc buá", // source typo, tone mark on wrong vowel (should be "hắc búa")
  "hết viá", // source typo, tone mark on wrong vowel (should be "hết vía")
  "kịch muá", // source typo, tone mark on wrong vowel (should be "kịch múa")
  "ngư tiêù", // source typo, tone mark on wrong vowel (should be "ngư tiều")
  "hũu sản", // source typo, "u" instead of "ư" (should be "hữu sản")
]);

describe("dictionary round-trip", () => {
  const words = readFileSync("data/Viet22K.txt", "utf-8")
    .split("\n")
    .map((line) => line.trim().normalize("NFC"))
    .filter((word) => word.length > 0 && !SKIP_LIST.has(word));

  // The dictionary is inconsistent with tone placement. Try both
  // placements, and reject when both placements fail.
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
