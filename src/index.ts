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
  ["iu", 0],
  ["oi", 0],
  ["ôi", 0],
  ["ơi", 0],
  ["ui", 0],
  ["uy", 0],
  ["ưi", 0],
  ["ưu", 0],
  // nucleus at index 1
  ["ia", 1],
  ["iê", 1],
  ["iêu", 1],
  ["oa", 1],
  ["oai", 1],
  ["oao", 1],
  ["oă", 1],
  ["oe", 1],
  ["oeo", 1],
  ["oo", 1],
  ["ua", 1],
  ["uâ", 1],
  ["uê", 1],
  ["uô", 1],
  ["uya", 1],
  ["ưa", 1],
  ["ươ", 1],
  ["yêu", 1],
  // nucleus at index 2
  ["uyê", 2],
]);

const VOWELS = new Set("aăâeêioôơuưy");

// ASCII letters present in the Vietnamese 29-letter alphabet (excludes f, j, w, z)
const VIETNAMESE_LETTERS = new Set("abcdeghiklmnopqrstuvxy");

// Valid Vietnamese syllable-final consonant sequences; empty string = open syllable
const VALID_FINAL_CONSONANTS = new Set([
  "",
  "c",
  "ch",
  "m",
  "n",
  "ng",
  "nh",
  "p",
  "t",
]);

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
function applyTone(word: string, combiningMark: string): string {
  if (!combiningMark) return word; // neutral tone — no mark

  // Find the vowel cluster: longest run of vowels
  const lower = word.toLowerCase();
  let clusterStart = -1;
  let clusterEnd = -1;
  let i = 0;
  while (i < lower.length) {
    if (isVowel(lower.charAt(i))) {
      const start = i;
      while (i < lower.length && isVowel(lower.charAt(i))) i++;
      if (i - start > clusterEnd - clusterStart) {
        clusterStart = start;
        clusterEnd = i;
      }
    } else {
      i++;
    }
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

function isVietnamese(word: string, strictTones = false): boolean {
  const s = word.toLowerCase();

  // Digraph escape sequences are always decoded regardless of syllable structure.
  for (let i = 0; i + 2 < s.length; i++) {
    if (DIGRAPHS.has(s.slice(i, i + 2)) && s.charAt(i + 2) === s.charAt(i + 1))
      return true;
  }

  let pos = 0;

  if (!SIMPLE_VOWELS.has(s.charAt(0))) {
    const match = INITIAL_CONSONANTS.find((c) => s.startsWith(c));
    if (!match) return false;
    pos = match.length;
    if (pos === s.length) return true; // consonant-only word (dd → đ)
  }

  // Greedy vowel cluster: try VOWEL_DIGRAPHS first at each position, then
  // simple vowels. This supports diphthongs and triphthongs (e.g. Nguyeenx).
  let hadVowel = false;
  while (pos < s.length) {
    const vDg = VOWEL_DIGRAPHS.find((d) => s.startsWith(d, pos));
    if (vDg) {
      pos += vDg.length;
      hadVowel = true;
    } else if (SIMPLE_VOWELS.has(s.charAt(pos))) {
      pos += 1;
      hadVowel = true;
    } else if (!strictTones && hadVowel && TONE_MARKERS.has(s.charAt(pos))) {
      pos += 1;
    } else {
      break;
    }
  }
  if (!hadVowel) return false;

  const fc = FINAL_CONSONANTS.find((c) => s.startsWith(c, pos));
  if (fc) pos += fc.length;

  while (pos < s.length && TONE_MARKERS.has(s.charAt(pos))) pos++;

  return pos === s.length;
}

/**
 * Options for {@link decode}.
 */
export interface DecodeOptions {
  /**
   * When `true`, enables strict Vietnamese word validation:
   *
   * - ASCII characters not in the Vietnamese 29-letter alphabet (e.g. `f`, `j`,
   *   `w`, `z`) are silently discarded from the output.
   * - Digraph escape sequences (e.g. `ooo`→`oo`) are only honored when the
   *   escaped pair is a recognized Vietnamese vowel cluster (one of `a`, `aw`,
   *   `aa`, `e`, `ee`, `i`, `o`, `oo`, `ow`, `u`, `uw`, `uo`);
   *   otherwise the digraph is decoded normally and the trailing escape character
   *   is subject to the same discarding rule above. Of the seven Telex digraphs,
   *   only the `oo` escape produces a valid Vietnamese sequence and is honored.
   * - After decoding, any trailing consonants that do not form a valid
   *   Vietnamese syllable-final sequence (`c`, `ch`, `m`, `n`, `ng`, `nh`,
   *   `p`, `t`, or open syllable) are trimmed.
   *
   * Tone letters (`f`, `j`, `z`) at the end of a word are consumed by the
   * tone-detection pass before strict rules apply and are never discarded.
   *
   * @defaultValue `false`
   */
  strictWords?: boolean;
  /**
   * When `true`, tone mark letters (`f`, `j`, `r`, `s`, `x`, `z`) are only
   * allowed at the end of a word. A tone letter appearing mid-word after a
   * vowel will cause the word to fail the Vietnamese syllable check and be
   * returned as-is.
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
 * - A tone letter at the end of the word (`s` sắc, `f` huyền, `r` hỏi, `x` ngã,
 *   `j` nặng, `z` ngang) is consumed and the corresponding diacritic is placed on
 *   the nucleus vowel of the syllable. When multiple tone letters appear, the last
 *   one wins; `z` removes any previously specified tone.
 * - Doubling the second character of a digraph or tone letter escapes it, producing
 *   the literal characters instead (e.g. `ooo`→`oo`, `catss`→`cats`).
 *
 * @param text - ASCII text using Telex encoding
 * @param options - Optional decoding options; see {@link DecodeOptions}
 * @returns Vietnamese Unicode text in NFC form
 */
export function decode(text: string, options?: DecodeOptions): string {
  const strictWords = options?.strictWords ?? false;
  const strictTones = options?.strictTones ?? false;
  // Tokenize into alternating [word, separator, word, ...] segments
  const tokens = text.split(/([^a-zA-Z]+)/);
  return tokens
    .map((token) => {
      if (!token || /[^a-zA-Z]/.test(token)) return token; // separator
      return decodeWord(token, strictWords, strictTones);
    })
    .join("");
}

// After decoding, trim any trailing characters that do not form a valid
// Vietnamese syllable-final consonant sequence. Operates on undecorated
// (pre-tone) text so that isVowel matches correctly.
// Returns the trimmed word and any tone marker found while trimming.
function trimFinalConsonants(word: string): {
  word: string;
  tone: string | null;
} {
  const lower = word.toLowerCase();
  let clusterStart = -1;
  let clusterEnd = -1;
  let i = 0;
  while (i < lower.length) {
    if (isVowel(lower.charAt(i))) {
      const start = i;
      while (i < lower.length && isVowel(lower.charAt(i))) i++;
      if (i - start > clusterEnd - clusterStart) {
        clusterStart = start;
        clusterEnd = i;
      }
    } else {
      i++;
    }
  }
  if (clusterStart === -1) return { word, tone: null }; // no vowel — nothing to trim
  let suffix = word.slice(clusterEnd);
  let embeddedTone: string | null = null;
  while (!VALID_FINAL_CONSONANTS.has(suffix.toLowerCase())) {
    const lastChar = suffix.charAt(suffix.length - 1).toLowerCase();
    if (embeddedTone === null && TONES.has(lastChar)) embeddedTone = lastChar;
    suffix = suffix.slice(0, -1);
  }
  return { word: word.slice(0, clusterEnd) + suffix, tone: embeddedTone };
}

function decodeWord(
  word: string,
  strictWords: boolean,
  strictTones = false,
): string {
  if (!strictWords && !isVietnamese(word, strictTones)) return word;
  // Detect tone letter at end (may be escaped by doubling)
  let tone: string | null = null;
  let raw = word;

  // Scan from end for tone letters. Last tone wins; z clears.
  // Keep stripping tone letters from the end until we hit a non-tone char
  // or an escaped pair.
  let escaped = false;
  while (raw.length >= 1) {
    const last = raw.charAt(raw.length - 1).toLowerCase();
    if (!TONES.has(last)) break;

    // Check for escape: second-to-last is same letter
    if (raw.length >= 2 && raw.charAt(raw.length - 2).toLowerCase() === last) {
      // Escaped tone letter — strip one copy and output one literal; no tone
      raw = raw.slice(0, -1);
      tone = null; // escape cancels tone
      escaped = true;
      break;
    }

    // Only the rightmost tone letter wins; keep the first one found (right-to-left scan)
    if (tone === null) tone = last;
    raw = raw.slice(0, -1);
  }

  // Unless strict tones, also scan for tone markers appearing mid-word
  // between vowels. Only markers that have a vowel somewhere after them are
  // treated as tones (markers with no following vowel are final consonants or
  // already handled by the trailing scan above). The last such marker wins,
  // but only when no trailing tone was already found.
  //
  // In strict words mode, only non-Vietnamese tone letters (f, j, z) qualify — the
  // Vietnamese-alphabet markers (s, r, x) are valid consonants in strict words mode
  // and must flow through trimFinalConsonants instead.
  if (!strictTones && tone === null && !escaped) {
    const eligibleTones = strictWords
      ? new Set([...TONE_MARKERS].filter((c) => !VIETNAMESE_LETTERS.has(c)))
      : TONE_MARKERS;
    let midTone: string | null = null;
    let newRaw = "";
    let hadVowel = false;
    for (let k = 0; k < raw.length; k++) {
      const ch = raw.charAt(k).toLowerCase();
      if (SIMPLE_VOWELS.has(ch)) {
        hadVowel = true;
        newRaw += raw.charAt(k);
      } else if (hadVowel && eligibleTones.has(ch)) {
        const hasVowelAfter = raw
          .slice(k + 1)
          .split("")
          .some((c) => SIMPLE_VOWELS.has(c.toLowerCase()));
        if (hasVowelAfter) {
          midTone = ch; // last mid-word tone wins
        } else {
          newRaw += raw.charAt(k); // trailing marker — keep as-is
        }
      } else {
        newRaw += raw.charAt(k);
      }
    }
    if (midTone !== null) {
      tone = midTone;
      raw = newRaw;
    }
  }

  // Decode digraphs in the remaining token
  let result = "";
  // In strict words mode, track the first inline tone marker (f, j, z) that is not
  // in the Vietnamese alphabet. When found, record the result length at that
  // point so we can truncate everything after it (it marks the end of the
  // syllable body) and use it as a fallback tone if no end-of-word tone exists.
  let inlineToneChar: string | null = null;
  let inlineToneTruncPos = -1;
  let i = 0;
  while (i < raw.length) {
    const digraph = raw.slice(i, i + 2).toLowerCase();
    const decoded = DIGRAPHS.get(digraph);
    if (decoded !== undefined) {
      const isUpper =
        raw.charAt(i) === raw.charAt(i).toUpperCase() &&
        raw.charAt(i) !== raw.charAt(i).toLowerCase();
      if (
        i + 2 < raw.length &&
        raw.charAt(i + 2).toLowerCase() === raw.charAt(i + 1).toLowerCase()
      ) {
        // escape candidate: only honor if not strict, or if the pair is a
        // recognized Vietnamese vowel cluster (only "oo" qualifies among the
        // seven Telex digraphs)
        if (!strictWords || NUCLEI.has(digraph)) {
          result += raw.charAt(i) + raw.charAt(i + 1);
          i += 3;
        } else {
          // escape rejected: decode digraph and discard the escape character
          result += isUpper ? decoded.toUpperCase() : decoded;
          i += 3;
        }
      } else {
        // digraph match: decode and preserve case of first char
        result += isUpper ? decoded.toUpperCase() : decoded;
        i += 2;
      }
    } else {
      const ch = raw.charAt(i).toLowerCase();
      if (!strictWords || VIETNAMESE_LETTERS.has(ch)) {
        result += raw.charAt(i);
      } else if (strictWords && inlineToneTruncPos === -1 && TONES.has(ch)) {
        // Non-Vietnamese tone marker (f, j, z) after a vowel signals the end
        // of the syllable body; record the truncation point and capture as a
        // potential tone. Markers before any vowel are simply discarded.
        if (result.length > 0 && isVowel(result.charAt(result.length - 1))) {
          inlineToneTruncPos = result.length;
          inlineToneChar = ch;
        }
      }
      i += 1;
    }
  }

  // In strict words mode, apply any inline tone truncation found during decoding
  if (strictWords && inlineToneTruncPos !== -1) {
    result = result.slice(0, inlineToneTruncPos);
    if (tone === null) tone = inlineToneChar;
  }

  // Trim invalid final consonants before tone application so isVowel works on
  // undecorated characters
  if (strictWords) {
    const trimmed = trimFinalConsonants(result);
    result = trimmed.word;
    // Use any tone marker found in the trimmed suffix if none was detected at word end
    if (tone === null) tone = trimmed.tone;
  }

  // Apply tone
  if (tone !== null) {
    result = applyTone(result, TONES.get(tone) ?? "");
  }

  return result;
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
    if (contextChar && DIGRAPHS.has(potDigraph)) {
      result += ch; // duplicate second char to trigger decode's escape mechanism
      contextChar = "";
    } else {
      contextChar = ch;
    }
    result += ch;
    i++;
  }

  return result + toneChar;
}
