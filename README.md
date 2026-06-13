# viet-telex

A TypeScript module for Telex encoding of Vietnamese text.

Vietnamese requires diacritical marks to distinguish letters and indicate tone. Telex represents these marks using basic Latin letters, making Vietnamese text typeable on the common QWERTY keyboard.

## Demo

Try the latest build in your browser with the [live demo](https://okorz001.github.io/viet-telex/).

## Features

- **Decode**: convert Telex basic Latin input into proper Vietnamese text

  ```ts
  import { decode } from "viet-telex";

  decode("phowr"); // "phở"
  decode("Xin chaof"); // "Xin chào"

  // handles "gi" and "qu" tone placement
  decode("gif"); // "gì"
  decode("gias"); // "giá"
  decode("quyeenr"); // "quyển"

  // Non-Vietnamese words pass through unchanged
  decode("show me the banhs mif"); // "show me the bánh mì"
  ```

- **Encode**: convert proper Vietnamese text back into Telex basic Latin

  ```ts
  import { encode } from "viet-telex";

  encode("phở"); // "phowr"
  encode("Xin chào"); // "Xin chaof"

  // decode and encode are inverses
  decode(encode(text)) === text; // true for any Vietnamese text
  ```

## API

[Typedoc](https://okorz001.github.io/viet-telex/docs/) is published after every build.

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
