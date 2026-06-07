# viet-telex

A TypeScript module for Telex encoding of Vietnamese text.

Vietnamese requires diacritical marks to distinguish letters and indicate tone. Telex represents these marks using basic Latin letters, making Vietnamese text typeable on the common QWERTY keyboard.

## Features

- **Decode**: convert Telex basic Latin input into proper Vietnamese text
- **Encode**: convert proper Vietnamese text back into Telex basic Latin

## API

[Typedoc](https://okorz001.github.io/viet-telex/) is published after every build.

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
