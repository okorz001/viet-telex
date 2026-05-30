const DIGRAPHS: Record<string, string> = {
  aw: "ă",
  aa: "â",
  dd: "đ",
  ee: "ê",
  oo: "ô",
  ow: "ơ",
  uw: "ư",
};

const ENCODE: Record<string, string> = Object.fromEntries(
  Object.entries(DIGRAPHS).map(([k, v]) => [v, k]),
);

/**
 * Decodes ASCII Telex input into Unicode Vietnamese text.
 *
 * @param text - ASCII text using Telex digraphs
 * @returns Vietnamese Unicode text
 */
export function decode(text: string): string {
  let result = "";
  let i = 0;
  while (i < text.length) {
    const digraph = text.slice(i, i + 2).toLowerCase();
    const decoded = DIGRAPHS[digraph];
    if (decoded !== undefined) {
      if (text[i + 2] === text[i + 1]) {
        // escape: repeated second char cancels decoding, e.g. "ooo" → "oo"
        result += text[i] + text[i + 1];
        i += 3;
      } else {
        // digraph match: decode and preserve case of first char
        const isUpper =
          text[i] === text[i].toUpperCase() &&
          text[i] !== text[i].toLowerCase();
        result += isUpper ? decoded.toUpperCase() : decoded;
        i += 2;
      }
    } else {
      // no digraph match: pass through unchanged
      result += text[i];
      i += 1;
    }
  }
  return result;
}

/**
 * Encodes Unicode Vietnamese text into ASCII Telex.
 *
 * @param text - Vietnamese Unicode text
 * @returns ASCII text using Telex digraphs
 */
export function encode(text: string): string {
  let result = "";
  for (const char of text) {
    const lower = char.toLowerCase();
    const digraph = ENCODE[lower];
    if (digraph !== undefined) {
      const isUpper = char !== lower;
      result += isUpper ? digraph[0].toUpperCase() + digraph[1] : digraph;
    } else {
      result += char;
    }
  }
  return result;
}
