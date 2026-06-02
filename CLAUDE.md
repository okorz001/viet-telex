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

## Docs Style

All Markdown section headers and table headers must use title case.

## Code Style

All exported symbols must have a full TSDoc comment describing what the function does, its parameters (`@param`), and its return value (`@returns`). One-line summaries are not sufficient for exported API.

## Links

- [docs/telex.md](docs/telex.md) — Telex encoding rules
- [docs/vietnamese.md](docs/vietnamese.md) — Vietnamese language and word structure
