# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A TypeScript module for encoding/decoding Vietnamese text in Telex format. The Telex encoding rules are documented in [docs/telex.md](docs/telex.md) — read it before working on the core logic.

## Commands

```sh
npm run format        # format with Prettier
npm run format:check  # check formatting without writing
npm run lint          # lint with ESLint
npm run build         # type-check and compile TypeScript to dist/
npm test              # run tests with Vitest (uses esbuild, does not type-check)
npm run verify        # run all of the above checks in sequence
```

Always verify `npm run verify` passes before proposing a code change.

## GitHub

After creating a pull request, always subscribe to it with `subscribe_pr_activity` without asking first.

When checking CI results, always fetch annotations even on passing runs — a green conclusion can still carry warnings that need attention.

## Telex Encoding Summary

Telex maps ASCII digraphs to Vietnamese diacritical letters and tone marks:

- Extended letters: `aw`→ă, `aa`→â, `dd`→đ, `ee`→ê, `oo`→ô, `ow`→ơ, `uw`→ư
- Tones (appended after the vowel): `s`→´ (sắc), `f`→\` (huyền), `r`→? (hỏi), `x`→~ (ngã), `j`→. (nặng), `z`→neutral (removes tone)
- Escapes: repeating a trigger character a second time cancels the encoding and inserts the literal character (e.g. `ooo` → `oo`, `catss` → `cats`)
- A second tone overwrites the first; `z` clears any tone
