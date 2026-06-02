# viet-telex

A TypeScript module for Telex encoding of Vietnamese text.

Vietnamese requires diacritical marks to distinguish letters and indicate tone. Telex represents these marks using basic Latin letters, making Vietnamese text typeable on the common QWERTY keyboard.

## Features

- **Decode**: convert Telex basic Latin input into proper Vietnamese text; supports an optional strict mode that enforces pure Vietnamese output
- **Encode**: convert proper Vietnamese text back into Telex basic Latin

## API

### `decode(text: string, options?: DecodeOptions): string`

Converts basic Latin text using Telex encoding to proper Vietnamese text.

```ts
decode("hoongf"); // → "hồng"
```

By default, words that don't match Vietnamese syllable structure pass through unchanged. Strict mode processes every word instead, discarding characters outside the Vietnamese alphabet and trimming invalid final consonants:

```ts
decode("za");                     // → "za"   (z is not a valid initial consonant)
decode("za", { strict: true });   // → "a"    (z discarded)

decode("cad");                    // → "cad"  (d is not a valid final consonant)
decode("cad", { strict: true });  // → "ca"   (d trimmed)

decode("case");                    // → "case" (not a Vietnamese syllable)
decode("case", { strict: true });  // → "ca"   (s and e trimmed)
```

### `encode(text: string): string`

Converts Vietnamese text into basic Latin text using Telex encoding.

```ts
encode("hồng"); // → "hoongf"
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
