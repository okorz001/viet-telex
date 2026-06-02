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

// Maps vowel cluster (lowercase) to index of nucleus vowel within that cluster.
// Unlisted clusters fall back to: last vowel before any trailing consonant.
const NUCLEI: Record<string, number> = {
  // Off-glide diphthongs: nucleus is first vowel
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
  ưi: 0,
  ưu: 0,
  // On-glide diphthongs: nucleus is second vowel
  ia: 1,
  oa: 1,
  oe: 1,
  ua: 1,
  uê: 1,
  ưa: 1,
  // Special
  uy: 0,
  // Triphthongs
  oai: 1,
  oao: 1,
  oeo: 1,
  iêu: 1,
  yêu: 1,
  uya: 1,
  // Clusters requiring final consonant (nucleus is long vowel at index 1)
  iê: 1,
  uyê: 2,
  uâ: 1,
  uô: 1,
  ươ: 1,
  oă: 1,
};

const VOWELS = new Set("aăâeêioôơuưy");

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

/**
 * Decodes ASCII Telex input into Unicode Vietnamese text.
 */
export function decode(text: string): string {
  // Tokenize into alternating [word, separator, word, ...] segments
  const tokens = text.split(/([^a-zA-Z]+)/);
  return tokens
    .map((token) => {
      if (!token || /[^a-zA-Z]/.test(token)) return token; // separator
      return decodeWord(token);
    })
    .join("");
}

function decodeWord(word: string): string {
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
      if (
        raw[i + 2] !== undefined &&
        raw[i + 2].toLowerCase() === raw[i + 1].toLowerCase()
      ) {
        // escape: repeated second char cancels decoding, e.g. "ooo" → "oo"
        result += raw[i] + raw[i + 1];
        i += 3;
      } else {
        // digraph match: decode and preserve case of first char
        const isUpper =
          raw[i] === raw[i].toUpperCase() && raw[i] !== raw[i].toLowerCase();
        result += isUpper ? decoded.toUpperCase() : decoded;
        i += 2;
      }
    } else {
      result += raw[i];
      i += 1;
    }
  }

  // Apply tone
  if (tone !== null) {
    result = applyTone(result, TONES[tone]);
  }

  return result;
}

/**
 * Encodes Unicode Vietnamese text into ASCII Telex.
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
      i++;
      continue;
    }

    if (digraphKey !== null) {
      result += isUpper
        ? digraphKey[0].toUpperCase() + digraphKey[1]
        : digraphKey;
      i += 2; // consume base + modifier
      continue;
    }

    // Plain 'o' followed by another plain 'o' (not a Vietnamese extended letter)
    // needs escaping so decode doesn't turn them into ô
    if (lower === "o" && !next) {
      // single o at end, fine
      result += ch;
      i++;
      continue;
    }
    if (lower === "o" && nfd[i + 1] !== undefined) {
      const nextLower = nfd[i + 1].toLowerCase();
      if (nextLower === "o" && nfd[i + 2] !== "̂") {
        // two plain o's — emit escape
        result += ch + nfd[i + 1] + nfd[i + 1];
        i += 2;
        continue;
      }
    }

    result += ch;
    i++;
  }

  return result + toneChar;
}
