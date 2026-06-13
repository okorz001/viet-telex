import { decode } from "../src/index.ts";

const input = document.getElementById("input");
const output = document.getElementById("output");
const strictWords = document.getElementById("strictWords");
const strictTones = document.getElementById("strictTones");
const tonePlacement = document.getElementById("tonePlacement");

function update() {
  output.textContent = decode(input.value, {
    strictWords: strictWords.checked,
    strictTones: strictTones.checked,
    tonePlacement: tonePlacement.value,
  });
}

input.addEventListener("input", update);
strictWords.addEventListener("change", update);
strictTones.addEventListener("change", update);
tonePlacement.addEventListener("change", update);
