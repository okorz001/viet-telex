# viet-telex

A TypeScript module for encoding and decoding Vietnamese text using the Telex input method.

Vietnamese requires diacritical marks to distinguish letters and indicate tone. Telex represents these marks using simple basic Latin digraphs, making Vietnamese text typeable on any keyboard. See [docs/telex.md](docs/telex.md) for the full encoding rules.

## Features

- **Decode**: convert Telex basic Latin input into Vietnamese Unicode text
- **Encode**: convert Vietnamese Unicode text back into Telex basic Latin

## API

### `decode(text: string): string`

Takes basic Latin text using Telex digraphs and returns Vietnamese Unicode text.

```ts
decode("owng"); // → "ơng"
decode("Ddowng"); // → "Đông"
```

### `encode(text: string): string`

Takes Vietnamese Unicode text and returns basic Latin text using Telex digraphs.

```ts
encode("ơng"); // → "owng"
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
