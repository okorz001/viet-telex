const DIGRAPHS: Record<string, string> = {
  aw: "ă",
  aa: "â",
  dd: "đ",
  ee: "ê",
  oo: "ô",
  ow: "ơ",
  uw: "ư",
};

const DECODE: Record<string, string> = Object.fromEntries(
  Object.entries(DIGRAPHS).map(([k, v]) => [v, k]),
);

/**
 * Encodes ASCII Telex input into Unicode Vietnamese text.
 *
 * @param text - ASCII text using Telex digraphs and tone markers
 * @returns Vietnamese Unicode text
 */
export function encode(text: string): string {
  let result = "";
  let i = 0;
  while (i < text.length) {
    const digraph = text.slice(i, i + 2).toLowerCase();
    const encoded = DIGRAPHS[digraph];
    if (encoded !== undefined) {
      if (text[i + 2] === text[i + 1]) {
        // escape: repeated second char cancels encoding, e.g. "ooo" → "oo"
        result += text[i] + text[i + 1];
        i += 3;
      } else {
        // digraph match: encode and preserve case of first char
        const isUpper =
          text[i] === text[i].toUpperCase() &&
          text[i] !== text[i].toLowerCase();
        result += isUpper ? encoded.toUpperCase() : encoded;
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
 * Decodes Unicode Vietnamese text into ASCII Telex input.
 *
 * @param text - Vietnamese Unicode text
 * @returns ASCII text using Telex digraphs
 */
export function decode(text: string): string {
  let result = "";
  for (const char of text) {
    const lower = char.toLowerCase();
    const digraph = DECODE[lower];
    if (digraph !== undefined) {
      const isUpper = char !== lower;
      result += isUpper ? digraph[0].toUpperCase() + digraph[1] : digraph;
    } else {
      result += char;
    }
  }
  return result;
}
