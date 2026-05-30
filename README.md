# viet-telex

A TypeScript module for decoding Telex input into Vietnamese text.

Telex encodes the diacritical marks necessary for Vietnamese in simple ASCII.

## API

### `decode(text: string): string`

Takes ASCII text using Telex digraphs and returns Vietnamese Unicode text.

```ts
decode("owng"); // → "ơng"
decode("Ddowng"); // → "Đông"
```

### `encode(text: string): string`

Takes Vietnamese Unicode text and returns ASCII text using Telex digraphs.

```ts
encode("ơng"); // → "owng"
encode("Đông"); // → "Ddowng"
```

## Telex

See [docs/telex.md](docs/telex.md) for the Telex encoding rules.
