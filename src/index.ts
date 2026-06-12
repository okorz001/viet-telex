const DIGRAPHS: Map<string, string> = new Map([
  ["aw", "ă"],
  ["aa", "â"],
  ["dd", "đ"],
  ["ee", "ê"],
  ["oo", "ô"],
  ["ow", "ơ"],
  ["uw", "ư"],
]);

// Tone letters in Telex and their Unicode combining marks (NFD form)
const TONES: Map<string, string> = new Map([
  ["s", "́"], // sắc ´
  ["f", "̀"], // huyền `
  ["r", "̉"], // hỏi ̉
  ["x", "̃"], // ngã ~
  ["j", "̣"], // nặng .
  ["z", ""], // ngang (neutral — removes any tone)
]);

const ENCODE_TONE: Map<string, string> = new Map(
  [...TONES.entries()].filter(([, v]) => v !== "").map(([k, v]) => [v, k]),
);

// Vietnamese syllable structure components for Telex-encoded input.
// Lists are ordered longest-first so Array.find picks the greedy match.
const INITIAL_CONSONANTS = [
  "ngh",
  "ch",
  "gh",
  "gi",
  "kh",
  "ng",
  "nh",
  "ph",
  "qu",
  "th",
  "tr",
  "dd",
  "b",
  "c",
  "d",
  "g",
  "h",
  "k",
  "l",
  "m",
  "n",
  "p",
  "q",
  "r",
  "s",
  "t",
  "v",
  "x",
];
const VOWEL_DIGRAPHS = ["aw", "aa", "ee", "oo", "ow", "uw"];
const SIMPLE_VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);
const FINAL_CONSONANTS = ["ch", "ng", "nh", "c", "m", "n", "p", "t"];
const TONE_MARKERS = new Set(["s", "f", "r", "x", "j", "z"]);
// Maps vowel cluster (lowercase) to index of nucleus vowel within that cluster.
// Unlisted clusters fall back to: last vowel before any trailing consonant.
// Entries are ordered by nucleus index, then Vietnamese alphabetical order
// (a ă â e ê i o ô ơ u ư y) within each group.
const NUCLEI: Map<string, number> = new Map([
  // nucleus at index 0
  ["ai", 0],
  ["ao", 0],
  ["au", 0],
  ["ay", 0],
  ["âu", 0],
  ["ây", 0],
  ["eo", 0],
  ["êu", 0],
  ["ia", 0],
  ["iu", 0],
  ["oi", 0],
  ["ôi", 0],
  ["ơi", 0],
  ["ua", 0],
  ["ui", 0],
  ["ưa", 0],
  ["ưi", 0],
  ["ưu", 0],
  // nucleus at index 1
  ["iê", 1],
  ["iêu", 1],
  ["oa", 1],
  ["oai", 1],
  ["oao", 1],
  ["oă", 1],
  ["oe", 1],
  ["oeo", 1],
  ["oo", 1],
  ["uâ", 1],
  ["uê", 1],
  ["uô", 1],
  ["uy", 1],
  ["uya", 1],
  ["ươ", 1],
  ["yêu", 1],
  // nucleus at index 2
  ["uyê", 2],
]);

const VOWELS = new Set("aăâeêioôơuưy");

// Maps each extended Vietnamese vowel letter to its two-character Telex digraph.
const VOWEL_TO_TELEX: Map<string, string> = new Map([
  ["ă", "aw"],
  ["â", "aa"],
  ["ê", "ee"],
  ["ô", "oo"],
  ["ơ", "ow"],
  ["ư", "uw"],
]);

// All Telex vowel-cluster strings that are a prefix of some valid Vietnamese
// nucleus encoding. Used in parseVowel to reject infeasible vowel extensions
// early (before the extension could ever reach a valid nucleus).
//
// Derived by converting every entry in VOWELS and NUCLEI to its Telex form and
// collecting all prefixes. For example "iê" → "iee" contributes {"i","ie","iee"},
// so "ie" is marked feasible even though it is not yet a valid cluster on its own.
const VALID_TELEX_VOWEL_PREFIXES: Set<string> = (() => {
  const toTelex = (s: string) =>
    [...s].map((c) => VOWEL_TO_TELEX.get(c) ?? c).join("");
  const prefixes = new Set<string>();
  const addPrefixes = (telex: string) => {
    for (let i = 1; i <= telex.length; i++) prefixes.add(telex.slice(0, i));
  };
  for (const v of VOWELS) addPrefixes(toTelex(v));
  for (const [nucleus] of NUCLEI) addPrefixes(toTelex(nucleus));
  return prefixes;
})();

function isVowel(ch: string): boolean {
  return VOWELS.has(ch.toLowerCase());
}

// Find the index within `vowelCluster` (lowercase) of the nucleus vowel.
function nucleusIndex(cluster: string): number {
  const ni = NUCLEI.get(cluster);
  if (ni !== undefined) return ni;
  // Fallback: last vowel (index length - 1)
  return cluster.length - 1;
}

// Apply a combining tone mark to the nucleus vowel within a decoded word.
// vowelStart: position where the vowel cluster search begins (used to skip
// the terminal vowel letter of "gi"/"qu" initial consonants). When no vowel
// cluster is found at or after vowelStart, falls back to searching the full word.
function applyTone(
  word: string,
  combiningMark: string,
  vowelStart = 0,
): string {
  if (!combiningMark) return word; // neutral tone — no mark

  // Scan for vowel runs. For each run [runStart, runEnd):
  //   - If the run starts at or after vowelStart, consider it as-is (preferred).
  //   - If the run starts before vowelStart but extends past it, truncate its
  //     effective start to vowelStart (e.g. "ia" in "gia" with vowelStart=2 → "a").
  //   - If the run lies entirely before vowelStart (e.g. "i" in "gi"), keep it
  //     as a fallback used only when no preferred cluster exists.
  const lower = word.toLowerCase();
  let clusterStart = -1;
  let clusterEnd = -1;
  let fbStart = -1;
  let fbEnd = -1;
  let i = 0;
  while (i < lower.length) {
    if (isVowel(lower.charAt(i))) {
      const runStart = i;
      while (i < lower.length && isVowel(lower.charAt(i))) i++;
      const runEnd = i;
      const effStart = Math.max(runStart, vowelStart);
      if (effStart < runEnd) {
        // Run extends into or starts within the preferred zone.
        if (runEnd - effStart > clusterEnd - clusterStart) {
          clusterStart = effStart;
          clusterEnd = runEnd;
        }
      } else {
        // Run lies entirely before vowelStart — save as fallback.
        if (runEnd - runStart > fbEnd - fbStart) {
          fbStart = runStart;
          fbEnd = runEnd;
        }
      }
    } else {
      i++;
    }
  }

  if (clusterStart === -1) {
    clusterStart = fbStart;
    clusterEnd = fbEnd;
  }

  if (clusterStart === -1) return word; // no vowel found — shouldn't happen

  const cluster = lower.slice(clusterStart, clusterEnd);
  const ni = nucleusIndex(cluster);
  const nucleusPos = clusterStart + ni;

  // Compose the mark onto the nucleus character
  const before = word.slice(0, nucleusPos);
  const nucleus = word.charAt(nucleusPos);
  const after = word.slice(nucleusPos + 1);
  return (
    before +
    (nucleus + combiningMark).normalize("NFC") +
    after
  ).normalize("NFC");
}

/**
 * A parsed Vietnamese syllable with each part stored in its Telex (encoded) form
 * rather than decoded Unicode. Telex keeps parsing cheap — escapes are just a
 * doubled character (e.g. `dd` for đ, `uaa` for uâ) — and keeps the model easy to
 * read when logging. {@link render} decodes it to Unicode.
 */
interface Word {
  /** Initial consonant in Telex, e.g. `b`, `dd` (đ), `ng`, `qu`. */
  initialConsonant?: string;
  /** Vowel cluster in Telex, e.g. `a`, `uw` (ư), `uaa` (uâ). */
  vowel?: string;
  /** Final consonant, e.g. `c`, `ch`, `ng`, `t`. */
  finalConsonant?: string;
  /**
   * Telex tone letter (`s`|`f`|`r`|`x`|`j`); absent means ngang (no mark). `z` is
   * never stored — it clears the tone, leaving this field undefined.
   */
  tone?: string;
}

// Decodes Telex digraphs (aw→ă, aa→â, dd→đ, ee→ê, oo→ô, ow→ơ, uw→ư) within a
// string, preserving the case of the first character. A doubled second character
// escapes the digraph, yielding the two literal characters (e.g. "ooo"→"oo",
// "aww"→"aw"). Other characters pass through unchanged.
function decodeTelex(s: string): string {
  let result = "";
  let i = 0;
  while (i < s.length) {
    const digraph = s.slice(i, i + 2).toLowerCase();
    const decoded = DIGRAPHS.get(digraph);
    if (decoded === undefined) {
      result += s.charAt(i);
      i += 1;
      continue;
    }
    const isUpper =
      s.charAt(i) === s.charAt(i).toUpperCase() &&
      s.charAt(i) !== s.charAt(i).toLowerCase();
    if (
      i + 2 < s.length &&
      s.charAt(i + 2).toLowerCase() === s.charAt(i + 1).toLowerCase()
    ) {
      // Escaped digraph: emit the two literal characters, skip the escape char.
      result += s.charAt(i) + s.charAt(i + 1);
      i += 3;
    } else {
      result += isUpper ? decoded.toUpperCase() : decoded;
      i += 2;
    }
  }
  return result;
}

/**
 * Renders a parsed Vietnamese syllable into proper Unicode text (NFC).
 *
 * Each part of the {@link Word} is Telex-encoded; this decodes the digraphs
 * (e.g. `dd`→đ, `uw`→ư, with a doubled character escaping the digraph) and then
 * places the tone mark on the nucleus vowel via {@link applyTone}, using a
 * consonant length of 2 for `gi`/`qu` initials so the mark lands past the
 * consonant's trailing vowel letter.
 *
 * @param word - A parsed syllable with Telex-encoded parts; see {@link Word}
 * @returns The syllable as Unicode Vietnamese text in NFC form
 */
function render(word: Word): string {
  const initial = word.initialConsonant ?? "";
  const vowel = word.vowel ?? "";
  const li = initial.toLowerCase();
  const lv = vowel.toLowerCase();

  // When gi/qu's trailing vowel letter is already the first letter of the vowel
  // field (the complete vowel is stored there), emit only the leading consonant
  // letter so the output isn't doubled (e.g. qu + uyee → q + uyee = "quyee").
  // consonantLen=1 tells applyTone the vowel cluster begins right after that letter.
  let consonantPart: string;
  let consonantLen: number;
  if (
    (li === "gi" && lv.startsWith("i")) ||
    (li === "qu" && lv.startsWith("u"))
  ) {
    consonantPart = initial.charAt(0);
    consonantLen = 1;
  } else if (li === "gi" || li === "qu") {
    consonantPart = initial;
    consonantLen = 2;
  } else {
    consonantPart = initial;
    consonantLen = 0;
  }

  const body = decodeTelex(consonantPart + vowel + (word.finalConsonant ?? ""));
  if (!word.tone) return body.normalize("NFC");
  return applyTone(body, TONES.get(word.tone) ?? "", consonantLen);
}

/**
 * Reports whether a parsed syllable is structurally valid Vietnamese.
 *
 * The check is intentionally lenient: it mirrors the structural rules the
 * decoder relies on, not the full spelling rules in docs/vietnamese.md. In
 * particular it does NOT enforce which vowel clusters must, may, or may not take
 * a final consonant — enforcing those would reject valid open-syllable forms the
 * decoder must still render (e.g. `uyế`, `ướ`). A word is valid when:
 *
 * - the initial consonant is empty or a known Telex initial (incl. `dd`, `gi`,
 *   `qu`);
 * - the final consonant is empty or a valid Vietnamese final;
 * - the vowel decodes to a single Vietnamese vowel or a cluster in `NUCLEI` — and
 *   for `gi`/`qu` the consonant's trailing i/u may complete that cluster.
 *
 * A vowel-less token is accepted only as `gi`/`qu` (whose i/u is the nucleus) or
 * a bare initial consonant such as `dd` (đ), matching how whole-consonant tokens
 * decode.
 *
 * @param word - A parsed syllable with Telex-encoded parts; see {@link Word}
 * @returns `true` if the syllable is structurally valid Vietnamese
 */
function validate(word: Word): boolean {
  const initial = (word.initialConsonant ?? "").toLowerCase();
  if (initial !== "" && !INITIAL_CONSONANTS.includes(initial)) return false;

  const final = (word.finalConsonant ?? "").toLowerCase();
  if (final !== "" && !FINAL_CONSONANTS.includes(final)) return false;

  const giqu = initial === "gi" || initial === "qu";
  const vowel = decodeTelex(word.vowel ?? "").toLowerCase();
  if (vowel === "") {
    // No explicit vowel: valid as "gi"/"qu" (the i/u is the nucleus) or a bare
    // initial consonant (e.g. "đ" from "dd"); a final still needs a real vowel.
    return giqu || (initial !== "" && final === "");
  }
  if (vowel.length === 1) return VOWELS.has(vowel);
  if (NUCLEI.has(vowel)) return true;
  // "gi"/"qu": prepend the consonant's trailing vowel letter to complete the
  // cluster (e.g. qu + "yê" → "uyê").
  const prefix = initial === "qu" ? "u" : initial === "gi" ? "i" : "";
  return prefix !== "" && NUCLEI.has(prefix + vowel);
}

// The four states of the syllable parser. A Vietnamese syllable is walked in
// order: an optional initial consonant, the vowel cluster, then an optional
// final consonant. INVALID is terminal — the buffered letters cannot form a
// structurally valid Vietnamese syllable.
type ParseState = "INITIAL_CONSONANT" | "VOWEL" | "FINAL_CONSONANT" | "INVALID";

// The evolving state of the parse reducer as it walks a word one letter at a
// time. A context is a Word in progress — the Telex-encoded syllable parts
// recognized so far — plus the machine state and the raw input consumed.
// state and input are optional so an empty {} is a valid starting context.
interface ParseContext extends Word {
  /**
   * The parser's current position in the syllable; see {@link ParseState}.
   * Absent on a fresh context — {@link parse} defaults it to `INITIAL_CONSONANT`.
   */
  state?: ParseState;
  /**
   * The raw user input consumed so far, in its original case. Absent on a fresh
   * context — {@link parse} defaults it to the empty string.
   */
  input?: string;
  /**
   * The literal output text for an escaped, non-Vietnamese token (e.g. `ddd` → `dd`,
   * `ass` → `as`). Set when a digraph or tone escape fires: at that point the token is
   * no longer a valid syllable, so parsing drops to `INVALID`, the partial `Word` parts
   * are abandoned, and this pre-resolved literal is what the render step returns. Its
   * presence is also what distinguishes an escaped literal from a plain invalid token.
   */
  decoded?: string;
}

function parse(
  ctx: ParseContext,
  letter: string,
  options?: DecodeOptions,
): ParseContext {
  const state = ctx.state ?? "INITIAL_CONSONANT";
  const input = (ctx.input ?? "") + letter;
  const base: ParseContext = { ...ctx, input };
  if (state === "INVALID") {
    // An escaped literal keeps growing its tail; a plain invalid token only keeps
    // raw input for passthrough.
    const decoded =
      ctx.decoded === undefined ? undefined : ctx.decoded + letter;
    return { ...base, state: "INVALID", decoded };
  }
  if (state === "INITIAL_CONSONANT")
    return parseInitialConsonant(base, letter, options);
  if (state === "VOWEL") return parseVowel(base, letter, options);
  return parseFinalConsonant(base, letter, options);
}

// INITIAL_CONSONANT state: build up the leading consonant cluster, then hand off
// to the VOWEL state once a vowel arrives. The consonant is stored in its original
// case (so render can reproduce "Ngo", "Phở", …); only a lowercase copy is used to
// match against the (lowercase) INITIAL_CONSONANTS table.
function parseInitialConsonant(
  ctx: ParseContext,
  letter: string,
  options?: DecodeOptions,
): ParseContext {
  const strictWords = options?.strictWords ?? false;
  const ic = (ctx.initialConsonant ?? "").toLowerCase();
  const l = letter.toLowerCase();
  // Digraph escape: "dd" + "d" → literal "dd". This is no longer a valid syllable, so
  // resolve the literal (decodeTelex collapses the doubled "d"), drop the Word part, and
  // fall to INVALID. ctx.input already includes this letter, so it is the full escape
  // sequence (e.g. "ddd" → "dd"). In strictWords mode the escape char is discarded
  // instead, leaving IC="dd" which renders as "đ".
  if (ic === "dd" && l === "d") {
    if (strictWords) return ctx;
    return {
      ...ctx,
      initialConsonant: undefined,
      decoded: decodeTelex(ctx.input ?? ""),
      state: "INVALID",
    };
  }
  // Greedily extend while the accumulated prefix is a prefix of some IC entry.
  // Every prefix built this way (n→ng→ngh, g→gi, q→qu, d→dd) is itself a valid
  // INITIAL_CONSONANTS entry, so a non-empty initial is always a complete one.
  if (INITIAL_CONSONANTS.some((c) => c.startsWith(ic + l))) {
    return {
      ...ctx,
      initialConsonant: (ctx.initialConsonant ?? "") + letter,
      state: "INITIAL_CONSONANT",
    };
  }
  // For "gi"/"qu" the trailing i/u is the implicit nucleus. An explicit i (after
  // "gi") or u (after "qu") would duplicate it, which is not a valid syllable. In
  // strictWords mode the duplicate letter is discarded, leaving the bare "gi"/"qu".
  if ((ic === "gi" && l === "i") || (ic === "qu" && l === "u")) {
    if (strictWords) return ctx;
    return { ...ctx, state: "INVALID" };
  }
  // A vowel ends the (possibly empty) initial; reprocess it in the VOWEL state.
  if (SIMPLE_VOWELS.has(l)) {
    return parseVowel({ ...ctx, state: "VOWEL" }, letter, options);
  }
  // For "gi"/"qu" the trailing i/u is itself the nucleus, so a directly following
  // tone or final consonant (no further vowel) is parsed as if the vowel were
  // already complete: "gif" → gì, "gin" → gin, "ginf" → gìn.
  if (ic === "gi" || ic === "qu") {
    return parseVowel({ ...ctx, state: "VOWEL" }, letter, options);
  }
  // Any other letter cannot begin or extend a Vietnamese syllable here.
  if (strictWords) return ctx;
  return { ...ctx, state: "INVALID" };
}

// VOWEL state: accumulate the vowel cluster (kept in Telex form, decoded by render),
// record the tone, and resolve vowel digraph escapes. A real consonant ends the vowel
// and hands off to the FINAL_CONSONANT state.
function parseVowel(
  ctx: ParseContext,
  letter: string,
  options?: DecodeOptions,
): ParseContext {
  const strictTones = options?.strictTones ?? false;
  const strictWords = options?.strictWords ?? false;
  const vowel = ctx.vowel ?? "";
  const lv = vowel.toLowerCase();
  const l = letter.toLowerCase();

  // strictTones: a tone is honored only at the end of the word. Once a tone has been
  // set, any further non-tone letter means it was mid-word, so the whole token is
  // non-Vietnamese and passes through unchanged (INVALID). A following tone letter is
  // still allowed (trailing tones, last wins) and is handled below.
  if (strictTones && ctx.tone !== undefined && !TONE_MARKERS.has(l)) {
    return { ...ctx, state: "INVALID" };
  }

  // Tone letters (s/f/r/x/j/z) set the tone rather than extend the cluster. Doubling a
  // tone letter escapes it (e.g. "ass", "azz"): the first set the tone, the second
  // reverts it and leaves a literal, non-Vietnamese letter behind.
  if (TONE_MARKERS.has(l)) {
    const input = ctx.input ?? "";
    if (input.slice(-2, -1).toLowerCase() === l) {
      // strictWords discards the doubled tone letter, keeping the tone already set.
      if (strictWords) return ctx;
      const literal = input.slice(0, -2) + input.slice(-1);
      return {
        ...ctx,
        vowel: undefined,
        tone: undefined,
        decoded: decodeTelex(literal),
        state: "INVALID",
      };
    }
    // "z" is the neutral tone and clears any mark; the rest set one (last wins).
    return { ...ctx, tone: l === "z" ? undefined : l, state: "VOWEL" };
  }

  // Vowel digraph escape: the cluster ends in a Telex digraph and this letter doubles
  // its second character (e.g. "oo" + "o", "aa" + "a"). The literal pair is a valid
  // vowel only for "oo" (a nucleus, as in "xoong"); the others ("aa", "aw", "ee",
  // "ow", "uw") are non-Vietnamese and pass through literally. In strictWords mode the
  // escape character is discarded instead so the digraph decodes normally ("aaa" → "â").
  if (VOWEL_DIGRAPHS.includes(lv.slice(-2)) && l === lv.slice(-1)) {
    const literal = decodeTelex(vowel + letter);
    if (NUCLEI.has(literal.toLowerCase())) {
      return { ...ctx, vowel: vowel + letter, state: "VOWEL" };
    }
    if (strictWords) return ctx;
    return {
      ...ctx,
      vowel: undefined,
      decoded: decodeTelex(ctx.input ?? ""),
      state: "INVALID",
    };
  }

  // A vowel letter, or a "w" completing "aw"/"ow"/"uw", extends the cluster — but only
  // if the result is a feasible Telex prefix (i.e. could eventually decode to a valid
  // Vietnamese nucleus). Infeasible extensions ("ea", "aaw", …) are dropped here rather
  // than propagating to a validate() failure at finalize time.
  if (
    SIMPLE_VOWELS.has(l) ||
    (l === "w" && ["a", "o", "u"].includes(lv.slice(-1)))
  ) {
    const newVowelLower = lv + l;
    if (!VALID_TELEX_VOWEL_PREFIXES.has(newVowelLower)) {
      if (strictWords) return ctx;
      return { ...ctx, state: "INVALID" };
    }
    return { ...ctx, vowel: vowel + letter, state: "VOWEL" };
  }

  // Any real consonant ends the vowel; reprocess it in the FINAL_CONSONANT state.
  return parseFinalConsonant(
    { ...ctx, state: "FINAL_CONSONANT" },
    letter,
    options,
  );
}

// FINAL_CONSONANT state: accumulate the final consonant via greedy prefix match over
// FINAL_CONSONANTS (which includes the digraphs "ch"/"ng"/"nh"). A tone letter sets the
// tone rather than extending the final and does not end it, so a tone may sit within a
// final digraph (e.g. "thicsh" → thích); doubling a tone letter escapes it (e.g.
// "banss" → "bans"). Any letter that neither extends the final nor is a tone ends the
// syllable as INVALID — a second final consonant or a trailing vowel cannot follow.
function parseFinalConsonant(
  ctx: ParseContext,
  letter: string,
  options?: DecodeOptions,
): ParseContext {
  const strictTones = options?.strictTones ?? false;
  const strictWords = options?.strictWords ?? false;
  const final = ctx.finalConsonant ?? "";
  const l = letter.toLowerCase();

  // strictTones: a tone is honored only at the end of the word (see parseVowel). Once
  // set, a further non-tone letter (e.g. the "h" of "thicsh") means it was mid-word.
  if (strictTones && ctx.tone !== undefined && !TONE_MARKERS.has(l)) {
    return { ...ctx, state: "INVALID" };
  }

  // Tone letters set the tone; doubling one escapes it, abandoning the syllable for the
  // literal pair (e.g. "banss" → "bans").
  if (TONE_MARKERS.has(l)) {
    const input = ctx.input ?? "";
    if (input.slice(-2, -1).toLowerCase() === l) {
      // strictWords discards the doubled tone letter, keeping the tone already set.
      if (strictWords) return ctx;
      const literal = input.slice(0, -2) + input.slice(-1);
      return {
        ...ctx,
        vowel: undefined,
        finalConsonant: undefined,
        tone: undefined,
        decoded: decodeTelex(literal),
        state: "INVALID",
      };
    }
    // "z" is the neutral tone and clears any mark; the rest set one (last wins).
    return {
      ...ctx,
      tone: l === "z" ? undefined : l,
      state: "FINAL_CONSONANT",
    };
  }

  // Extend while the accumulated final is a prefix of some valid final consonant.
  if (FINAL_CONSONANTS.some((c) => c.startsWith(final + l))) {
    return {
      ...ctx,
      finalConsonant: (ctx.finalConsonant ?? "") + letter,
      state: "FINAL_CONSONANT",
    };
  }

  // Anything else cannot continue the syllable.
  if (strictWords) return ctx;
  return { ...ctx, state: "INVALID" };
}

// Renders a fully-parsed context to output text. An escaped token returns its
// pre-resolved `decoded` literal; an INVALID parse, or a structurally invalid
// word, passes through as the raw input; a valid word is rendered from its Word parts.
function finalize(ctx: ParseContext): string {
  const input = ctx.input ?? "";
  if (ctx.decoded !== undefined) return ctx.decoded;
  if (ctx.state === "INVALID") return input;
  if (!validate(ctx)) return input;
  return render(ctx);
}

/**
 * Options for {@link decode}. All fields are optional and default to `false`,
 * giving fully lenient decoding. Pass this object as the second argument to
 * {@link decode} to tighten which inputs are recognized as Vietnamese.
 */
export interface DecodeOptions {
  /**
   * When `true`, reduces each token to its largest valid Vietnamese skeleton
   * rather than passing unrecognized tokens through unchanged:
   *
   * - A letter that cannot be placed at the current parse position is silently
   *   discarded and parsing continues, rather than marking the whole token
   *   invalid (e.g. `fox`→`õ`, `show`→`sơ`, `odd`→`o`, `bant`→`ban`).
   * - Digraph escape sequences are not honored; the escape character is discarded
   *   and the digraph decodes normally (e.g. `aaa`→`â`, `uww`→`ư`). The sole
   *   exception is `oo`: `ooo` still decodes to `oo` because `oo` is itself a
   *   valid Vietnamese nucleus (the loanword vowel in `xoong`).
   * - A letter that cannot extend the current final-consonant cluster is
   *   discarded, leaving only the valid portion (e.g. `odd`→`o`, `bant`→`ban`).
   * - A letter that would duplicate the implicit `gi`/`qu` nucleus (the `i` in
   *   `gii`, the `u` in `quu`) is discarded, leaving the bare initial consonant.
   *
   * A tone letter following the vowel is consumed as the word's tone rather than
   * discarded, even when it is not a Vietnamese-alphabet letter (`f`, `j`, `z`).
   * Doubling a tone letter escapes it; as with a digraph escape, the extra letter
   * is then discarded (`ass`→`á`).
   *
   * @defaultValue `false`
   */
  strictWords?: boolean;
  /**
   * When `true`, tone mark letters (`f`, `j`, `r`, `s`, `x`, `z`) are only
   * honored at the end of a word. A tone letter appearing mid-word causes the
   * token to be treated as non-Vietnamese and returned unchanged.
   *
   * When `false` (the default), tone mark letters are allowed anywhere in the
   * input after a vowel, so inputs like `mafu` decode as `màu` even though the
   * tone letter appears mid-word rather than at the end.
   *
   * Has no effect on the position of the tone mark in the output — the last
   * tone letter in the word still determines the tone, as usual.
   *
   * @defaultValue `false`
   */
  strictTones?: boolean;
}

/**
 * Decodes ASCII Telex input into Unicode Vietnamese text (NFC).
 *
 * Input is split on word boundaries; each word token is processed independently
 * while separators (spaces, punctuation, digits) pass through unchanged.
 *
 * Within each word:
 * - Digraphs (`aw`→ă, `aa`→â, `dd`→đ, `ee`→ê, `oo`→ô, `ow`→ơ, `uw`→ư) are
 *   replaced with their Vietnamese letter, preserving the case of the first character.
 * - A tone letter following the vowel (`s` sắc, `f` huyền, `r` hỏi, `x` ngã,
 *   `j` nặng, `z` ngang) is consumed and the corresponding diacritic is placed on
 *   the nucleus vowel of the syllable. When multiple tone letters appear, the last
 *   one wins; `z` removes any previously specified tone.
 * - Doubling the second character of a digraph or tone letter escapes it, producing
 *   the literal characters instead (e.g. `ooo`→`oo`, `catss`→`cats`).
 * - Tokens that do not form a valid Vietnamese syllable pass through unchanged.
 *
 * @param text - ASCII text using Telex encoding
 * @param options - Optional decoding options; see {@link DecodeOptions}
 * @returns Vietnamese Unicode text in NFC form
 */
export function decode(text: string, options?: DecodeOptions): string {
  const tokens = text.split(/([^a-zA-Z]+)/);
  return tokens
    .map((token) => {
      if (!token || /[^a-zA-Z]/.test(token)) return token;
      let ctx: ParseContext = {};
      for (const ch of token) ctx = parse(ctx, ch, options);
      return finalize(ctx);
    })
    .join("");
}

/**
 * Encodes Unicode Vietnamese text (NFC) into ASCII Telex.
 *
 * Input is split on word boundaries; each word token is processed independently
 * while separators (spaces, punctuation, digits) pass through unchanged.
 *
 * Within each word:
 * - Extended Vietnamese letters (ă, â, đ, ê, ô, ơ, ư) are replaced with their
 *   two-character Telex digraphs, preserving the case of the first character.
 * - Tone diacritics are removed from vowels and a single tone letter is appended
 *   at the end of the word (`s` sắc, `f` huyền, `r` hỏi, `x` ngã, `j` nặng).
 * - ASCII pairs that form a Telex digraph (e.g. `oo`, `aw`, `ow`) are escaped by
 *   repeating the second character (e.g. `ooo`, `aww`, `oww`) so that a subsequent
 *   `decode` call does not misinterpret them as extended letters.
 *
 * `decode(encode(text)) === text` for any NFC Vietnamese text.
 *
 * @param text - Vietnamese Unicode text in NFC form
 * @returns ASCII text using Telex encoding
 */
export function encode(text: string): string {
  // Process word by word; emit tone letter at end of each word
  const tokens = text.split(
    /([^a-zA-ZăâđêôơưĂÂĐÊÔƠƯàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵắặẳẵằấậẩẫầếệểễềốộổỗồớợởỡờứựửữừ]+)/u,
  );
  return tokens
    .map((token) => {
      if (!token) return token;
      // Check if token contains any letter (Vietnamese or ASCII)
      if (
        /[^a-zA-ZăâđêôơưĂÂĐÊÔƠƯàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵắặẳẵằấậẩẫầếệểễềốộổỗồớợởỡờứựửữừ]/u.test(
          token,
        ) &&
        !/[a-zA-ZăâđêôơưĂÂĐÊÔƠƯàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵắặẳẵằấậẩẫầếệểễềốộổỗồớợởỡờứựửữừ]/u.test(
          token,
        )
      ) {
        return token; // pure separator
      }
      return encodeWord(token);
    })
    .join("");
}

function encodeWord(word: string): string {
  // Decompose to NFD so combining marks become separate code points
  const nfd = word.normalize("NFD");
  let result = "";
  let toneChar = "";
  let contextChar = ""; // last plain ASCII char decode would see at the current position
  let i = 0;

  while (i < nfd.length) {
    const ch = nfd.charAt(i);

    // Combining tone mark
    const encodedTone = ENCODE_TONE.get(ch);
    if (encodedTone !== undefined) {
      toneChar = encodedTone;
      i++;
      continue;
    }

    // Skip other combining marks (e.g. circumflex, breve that form extended letters)
    if (ch >= "̀" && ch <= "ͯ") {
      i++;
      continue;
    }

    const lower = ch.toLowerCase();
    const isUpper = ch !== lower && ch === ch.toUpperCase();

    // Extended Latin base letters (after NFD decomposition, ô→o+̂, ă→a+̆, etc.)
    // We need to detect the base+modifier combos that form extended letters.
    // After NFD, extended Vietnamese letters decompose as:
    //   ă → a + ̆ (breve)
    //   â → a + ̂ (circumflex)
    //   ê → e + ̂
    //   ô → o + ̂
    //   ơ → o + ̛ (horn)
    //   ư → u + ̛
    //   đ → đ (does not decompose further)
    const next = nfd.charAt(i + 1);
    const digraphKey = (() => {
      if (lower === "a" && next === "̆") return "aw"; // ă
      if (lower === "a" && next === "̂") return "aa"; // â
      if (lower === "e" && next === "̂") return "ee"; // ê
      if (lower === "o" && next === "̂") return "oo"; // ô
      if (lower === "o" && next === "̛") return "ow"; // ơ
      if (lower === "u" && next === "̛") return "uw"; // ư
      return null;
    })();

    if (lower === "đ" || lower === "đ") {
      result += isUpper ? "Dd" : "dd";
      contextChar = ""; // decode consumes "dd" atomically
      i++;
      continue;
    }

    if (digraphKey !== null) {
      result += isUpper
        ? digraphKey[0].toUpperCase() + digraphKey[1]
        : digraphKey;
      contextChar = ""; // decode consumes the digraph atomically
      i += 2; // consume base + modifier
      continue;
    }

    // Plain ASCII — escape if this char would form an unescaped digraph with the preceding one
    const potDigraph = contextChar.toLowerCase() + lower;
    const needsEscape = contextChar !== "" && DIGRAPHS.has(potDigraph);
    if (needsEscape) {
      contextChar = "";
    } else {
      contextChar = ch;
    }
    result += ch;
    if (needsEscape) result += lower; // lowercase escape follows the actual char
    i++;
  }

  // Escape a trailing tone marker so decode won't misinterpret it as a tone.
  // Only needed when no real Vietnamese tone was encoded (toneChar is empty).
  if (
    toneChar === "" &&
    result.length > 0 &&
    TONE_MARKERS.has(result.charAt(result.length - 1).toLowerCase())
  ) {
    result += result.charAt(result.length - 1).toLowerCase();
  }

  return result + toneChar;
}
