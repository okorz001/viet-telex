# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A TypeScript module for encoding/decoding Vietnamese text in Telex format. The Telex encoding rules are documented in [docs/telex.md](docs/telex.md) — read it before working on the core logic.

## Commands

```sh
npm test       # run tests with Vitest
npm run build  # compile TypeScript to dist/
```

Always verify `npm test` and `npm run build` pass before proposing a code change.

## Telex Encoding Summary

Telex maps ASCII digraphs to Vietnamese diacritical letters and tone marks:

- Extended letters: `aw`→ă, `aa`→â, `dd`→đ, `ee`→ê, `oo`→ô, `ow`→ơ, `uw`→ư
- Tones (appended after the vowel): `s`→´ (sắc), `f`→\` (huyền), `r`→? (hỏi), `x`→~ (ngã), `j`→. (nặng), `z`→neutral (removes tone)
- Escapes: repeating a trigger character a second time cancels the encoding and inserts the literal character (e.g. `ooo` → `oo`, `catss` → `cats`)
- A second tone overwrites the first; `z` clears any tone
