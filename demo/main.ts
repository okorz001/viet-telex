import {
  decode,
  parse,
  validate,
  decodeTelex,
  ParseContext,
} from "../src/index.ts";

const input = document.getElementById("input");
const output = document.getElementById("output");
const parseEl = document.getElementById("parse");
const strictWords = document.getElementById("strictWords");
const strictTones = document.getElementById("strictTones");
const tonePlacement = document.getElementById("tonePlacement");

function getOptions() {
  return {
    strictWords: strictWords.checked,
    strictTones: strictTones.checked,
    tonePlacement: tonePlacement.value,
  };
}

function buildParseViz(inputText, options) {
  const frag = document.createDocumentFragment();
  const tokens = inputText.split(/([^a-zA-Z]+)/);
  for (const token of tokens) {
    if (!token) continue;
    if (/[^a-zA-Z]/.test(token)) {
      frag.appendChild(document.createTextNode(token));
      continue;
    }
    let ctx: ParseContext = {};
    for (const ch of token) ctx = parse(ctx, ch, options);
    const rendered = decode(token, options);
    const isValid =
      ctx.state !== "INVALID" && ctx.decoded === undefined && validate(ctx);

    const span = document.createElement("span");
    span.className = "word-token";

    if (!isValid) {
      span.textContent = rendered;
      frag.appendChild(span);
      continue;
    }

    const ic = ctx.initialConsonant ?? "";
    const vowel = ctx.vowel ?? "";
    const fc = ctx.finalConsonant ?? "";
    const li = ic.toLowerCase();
    const lv = vowel.toLowerCase();

    const consonantPart =
      (li === "gi" && lv.startsWith("i")) || (li === "qu" && lv.startsWith("u"))
        ? ic.charAt(0)
        : ic;

    const initialChars = decodeTelex(consonantPart).length;
    const finalChars = decodeTelex(fc).length;
    const vowelChars = rendered.length - initialChars - finalChars;
    const isGiQu = vowel === "" && (li === "gi" || li === "qu");

    let pos = 0;
    for (let i = 0; i < initialChars; i++) {
      const charSpan = document.createElement("span");
      charSpan.className =
        isGiQu && i === initialChars - 1
          ? "char char-initial char-vowel char-overlap"
          : "char char-initial";
      charSpan.textContent = rendered.charAt(pos++);
      span.appendChild(charSpan);
    }
    for (let i = 0; i < vowelChars; i++) {
      const charSpan = document.createElement("span");
      charSpan.className = "char char-vowel";
      charSpan.textContent = rendered.charAt(pos++);
      span.appendChild(charSpan);
    }
    for (let i = 0; i < finalChars; i++) {
      const charSpan = document.createElement("span");
      charSpan.className = "char char-final";
      charSpan.textContent = rendered.charAt(pos++);
      span.appendChild(charSpan);
    }
    frag.appendChild(span);
  }
  return frag;
}

function update() {
  const options = getOptions();
  output.textContent = decode(input.value, options);
  parseEl.replaceChildren(buildParseViz(input.value, options));
}

input.addEventListener("input", update);
strictWords.addEventListener("change", update);
strictTones.addEventListener("change", update);
tonePlacement.addEventListener("change", update);
