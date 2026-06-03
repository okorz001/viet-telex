const DIGRAPHS: Record<string, string> = {
  aw: "ă",
  aa: "â",
  dd: "đ",
  ee: "ê",
  oo: "ô",
  ow: "ơ",
  uw: "ư",
};

// Tone letters in Telex and their Unicode combining marks (NFD form)
const TONES: Record<string, string> = {
  s: "́", // sắc ´
  f: "̀", // huyền `
  r: "̉", // hỏi ̉
  x: "̃", // ngã ~
  j: "̣", // nặng .
  z: "", // ngang (neutral — removes any tone)
};

const ENCODE_TONE: Record<string, string> = Object.fromEntries(
  Object.entries(TONES)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => [v, k]),
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
const NUCLEI: Record<string, number> = {
  // nucleus at index 0
  ai: 0,
  ao: 0,
  au: 0,
  ay: 0,
  âu: 0,
  ây: 0,
  eo: 0,
  êu: 0,
  iu: 0,
  oi: 0,
  ôi: 0,
  ơi: 0,
  ui: 0,
  uy: 0,
  ưi: 0,
  ưu: 0,
  // nucleus at index 1
  ia: 1,
  iê: 1,
  iêu: 1,
  oa: 1,
  oai: 1,
  oao: 1,
  oă: 1,
  oe: 1,
  oeo: 1,
  oo: 1,
  ua: 1,
  uâ: 1,
  uê: 1,
  uô: 1,
  uya: 1,
  ưa: 1,
  ươ: 1,
  yêu: 1,
  // nucleus at index 2
  uyê: 2,
};

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
  if (NUCLEI[cluster] !== undefined) return NUCLEI[cluster];
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
    if (isVowel(lower[i])) {
      const start = i;
      while (i < lower.length && isVowel(lower[i])) i++;
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
  const nucleus = word[nucleusPos];
  const after = word.slice(nucleusPos + 1);
  return (
    before +
    (nucleus + combiningMark).normalize("NFC") +
    after
  ).normalize("NFC");
}

function isVietnamese(word: string): boolean {
  const s = word.toLowerCase();

  // Digraph escape sequences are always decoded regardless of syllable structure.
  for (let i = 0; i + 2 < s.length; i++) {
    if (DIGRAPHS[s.slice(i, i + 2)] !== undefined && s[i + 2] === s[i + 1])
      return true;
  }

  let pos = 0;

  if (!SIMPLE_VOWELS.has(s[0] ?? "")) {
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
    } else if (SIMPLE_VOWELS.has(s[pos])) {
      pos += 1;
      hadVowel = true;
    } else {
      break;
    }
  }
  if (!hadVowel) return false;

  const fc = FINAL_CONSONANTS.find((c) => s.startsWith(c, pos));
  if (fc) pos += fc.length;

  while (pos < s.length && TONE_MARKERS.has(s[pos])) pos++;

  return pos === s.length;
}

/**
 * Options for {@link decode}.
 */
export interface DecodeOptions {
  /**
   * When `true`, enables strict Vietnamese validation:
   *
   * - ASCII characters not in the Vietnamese 29-letter alphabet (e.g. `f`, `j`,
   *   `w`, `z`) are silently discarded from the output.
   * - Digraph escape sequences (e.g. `ooo`→`oo`) are only honored when the
   *   escaped pair is a recognized Vietnamese vowel cluster in {@link NUCLEI};
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
  strict?: boolean;
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
  const strict = options?.strict ?? false;
  // Tokenize into alternating [word, separator, word, ...] segments
  const tokens = text.split(/([^a-zA-Z]+)/);
  return tokens
    .map((token) => {
      if (!token || /[^a-zA-Z]/.test(token)) return token; // separator
      return decodeWord(token, strict);
    })
    .join("");
}

// After decoding, trim any trailing characters that do not form a valid
// Vietnamese syllable-final consonant sequence. Operates on undecorated
// (pre-tone) text so that isVowel matches correctly.
function trimFinalConsonants(word: string): string {
  const lower = word.toLowerCase();
  let clusterStart = -1;
  let clusterEnd = -1;
  let i = 0;
  while (i < lower.length) {
    if (isVowel(lower[i])) {
      const start = i;
      while (i < lower.length && isVowel(lower[i])) i++;
      if (i - start > clusterEnd - clusterStart) {
        clusterStart = start;
        clusterEnd = i;
      }
    } else {
      i++;
    }
  }
  if (clusterStart === -1) return word; // no vowel — nothing to trim
  let suffix = word.slice(clusterEnd);
  while (!VALID_FINAL_CONSONANTS.has(suffix.toLowerCase())) {
    suffix = suffix.slice(0, -1);
  }
  return word.slice(0, clusterEnd) + suffix;
}

function decodeWord(word: string, strict: boolean): string {
  if (!strict && !isVietnamese(word)) return word;
  // Detect tone letter at end (may be escaped by doubling)
  let tone: string | null = null;
  let raw = word;

  // Scan from end for tone letters. Last tone wins; z clears.
  // Keep stripping tone letters from the end until we hit a non-tone char
  // or an escaped pair.
  while (raw.length >= 1) {
    const last = raw[raw.length - 1].toLowerCase();
    if (!(last in TONES)) break;

    // Check for escape: second-to-last is same letter
    if (raw.length >= 2 && raw[raw.length - 2].toLowerCase() === last) {
      // Escaped tone letter — strip one copy and output one literal; no tone
      raw = raw.slice(0, -1);
      tone = null; // escape cancels tone
      break;
    }

    // Only the rightmost tone letter wins; keep the first one found (right-to-left scan)
    if (tone === null) tone = last;
    raw = raw.slice(0, -1);
  }

  // Decode digraphs in the remaining token
  let result = "";
  let i = 0;
  while (i < raw.length) {
    const digraph = raw.slice(i, i + 2).toLowerCase();
    const decoded = DIGRAPHS[digraph];
    if (decoded !== undefined) {
      const isUpper =
        raw[i] === raw[i].toUpperCase() && raw[i] !== raw[i].toLowerCase();
      if (
        raw[i + 2] !== undefined &&
        raw[i + 2].toLowerCase() === raw[i + 1].toLowerCase()
      ) {
        // escape candidate: only honor if not strict, or if the pair is a
        // recognized Vietnamese vowel cluster (only "oo" qualifies among the
        // seven Telex digraphs)
        if (!strict || NUCLEI[digraph] !== undefined) {
          result += raw[i] + raw[i + 1];
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
      if (!strict || VIETNAMESE_LETTERS.has(raw[i].toLowerCase())) {
        result += raw[i];
      }
      i += 1;
    }
  }

  // Trim invalid final consonants before tone application so isVowel works on
  // undecorated characters. If the initial tone scan found nothing (e.g. a
  // trailing vowel like the 'e' in "case" blocked it), scan the trimmed suffix
  // for an embedded tone marker so that "case" → "cá" rather than "ca".
  if (strict) {
    const preTrim = result;
    result = trimFinalConsonants(result);
    if (tone === null && result.length < preTrim.length) {
      for (const ch of preTrim.slice(result.length)) {
        const lower = ch.toLowerCase();
        if (lower in TONES) tone = lower;
      }
    }
  }

  // Apply tone
  if (tone !== null) {
    result = applyTone(result, TONES[tone]);
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
    const ch = nfd[i];

    // Combining tone mark
    if (ENCODE_TONE[ch] !== undefined) {
      toneChar = ENCODE_TONE[ch];
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
    const next = nfd[i + 1];
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
    if (contextChar && DIGRAPHS[potDigraph] !== undefined) {
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
