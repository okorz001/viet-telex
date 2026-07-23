import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decode, encode } from "./index.js";

// Words confirmed by manual triage to be legitimately out of scope for the
// round-trip invariant (loanwords, abbreviations, etc.), not parser bugs.
// Do not add an entry here without first checking docs/vietnamese.md and
// whether the failure is actually fixable in NUCLEI / *_CONSONANTS (see the
// #58/#59 precedent).
const SKIP_LIST = new Set<string>([]);

describe("dictionary round-trip", () => {
  const path = new URL("../data/Viet22K.txt", import.meta.url);
  const words = readFileSync(path, "utf-8")
    .split("\n")
    .map((line) => line.trim().normalize("NFC"))
    .filter((word) => word.length > 0 && !SKIP_LIST.has(word));

  it(`decode(encode(word)) === word for all ${words.length} dictionary entries`, () => {
    const failures = words
      .map(
        (word) =>
          [word, decode(encode(word), { tonePlacement: "old" })] as const,
      )
      .filter(([word, actual]) => actual !== word);
    expect(failures).toEqual([]);
  });
});
