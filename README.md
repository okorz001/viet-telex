# viet-telex

A TypeScript module for encoding and decoding Vietnamese text using the Telex input method.

Vietnamese requires diacritical marks to distinguish letters and indicate tone. Telex represents these marks using basic Latin digraphs, making Vietnamese text typeable on any keyboard. See [docs/telex.md](docs/telex.md) for the full encoding rules.

## Features

- **Decode**: convert Telex basic Latin input into proper Vietnamese text; supports an optional strict mode that enforces pure Vietnamese output
- **Encode**: convert proper Vietnamese text back into Telex basic Latin

## API

### `decode(text: string, options?: DecodeOptions): string`

Takes basic Latin text using Telex digraphs and returns proper Vietnamese text.

```ts
decode("owng");   // → "ơng"
decode("Ddowng"); // → "Đông"
```

By default, words that don't match Vietnamese syllable structure pass through unchanged. Strict mode processes every word instead, discarding characters outside the Vietnamese alphabet and trimming invalid final consonants:

```ts
decode("za");                    // → "za"  (z is not a valid initial consonant)
decode("za", { strict: true });  // → "a"   (z discarded)

decode("cad");                    // → "cad" (d is not a valid final consonant)
decode("cad", { strict: true });  // → "ca"  (d trimmed)
```

### `encode(text: string): string`

Takes proper Vietnamese text and returns basic Latin text using Telex digraphs.

```ts
encode("ơng");  // → "owng"
encode("Đông"); // → "Ddowng"
```

## Development

**Prerequisites**: Node.js and npm.

```sh
# Install dependencies
npm install

# Run all checks (format, lint, type-check, tests)
npm run verify

# Build the project (type-check and compile to dist/)
npm run build

# Run tests only
npm test
```

## Telex

See [docs/telex.md](docs/telex.md) for the Telex encoding rules.
