# viet-telex

A TypeScript module for Telex encoding of Vietnamese text.

Vietnamese requires diacritical marks to distinguish letters and indicate tone. Telex represents these marks using basic Latin letters, making Vietnamese text typeable on the common QWERTY keyboard.

## Features

- **Decode**: convert Telex basic Latin input into proper Vietnamese text
- **Strict mode**: enforces pure Vietnamese output by discarding characters outside the Vietnamese alphabet and trimming invalid final consonants:

  Input Sequence | Default Mode | Strict Mode
  --- | --- | ---
  `za` | `za` | `a`
  `cad` | `cad` | `ca`
  `case` | `case` | `cá`

- **Encode**: convert proper Vietnamese text back into Telex basic Latin

## API

### `decode(text: string, options?: DecodeOptions): string`

Converts basic Latin text using Telex encoding to proper Vietnamese text. `DecodeOptions` accepts:

- `strict` (`boolean`, default `false`) — enables strict mode; see [Features](#features)

```ts
decode("hoongf"); // → "hồng"
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
