# Telex Encoding

Vietnamese uses a Latin-based alphabet, but requires diacritical marks to both distinguish certain letters and to indicate tone.

## Why

Diacritical marks are critical to understanding Vietnamese text. There are many word collisions without them, and it can be difficult to identify the intended word.

For example, the following words are all reduced in simple ASCII to "dau":

Vietnamese | English
--- | ---
đau | pain
đâu | where
đầu | head, first
dầu | oil

## Rules

Telex encoding solves two problems: representing the extended Latin letters, and tone marks.

### Extended Latin letters

Vietnamese has several extended Latin letters. Special character pairs are defined for each letter.

Vietnamese | ASCII input
--- | ---
ă | aw
â | aa
đ | dd
ê | ee
ô | oo
ơ | ow
ư | uw

("oo" is extremely rare, but still valid Vietnamese. To insert it, see [Escapes](#escapes) below.)

### Tones

Vietnamese words may have a single tone mark.

Vietnamese | ASCII input
--- | ---
má | mas
mà | maf
mả | mar
mã | max
mạ | maj

Although "s", "r", and "x" are common in Vietnamese, this is unambiguous because they can only appear before vowels.

A word cannot have multiple tones. Specifying a second tone overwrites any previous tone.

Additionally, "z" is reserved for the neutral tone, which has no tone mark. Thus, it can be used to remove any previous tone mark.

For example:

ASCII input | Output
--- | ---
maz | ma
masz | ma
mazs | má
mafs | má

### Escapes

To literally insert a character is used for encoding, simply repeat the character. This will also revert the encoding behavior.

For example:

ASCII input | Output
--- | ---
o | o
oo | ô
ooo | oo
ow | ơ
oww | ow
cat | cat
cats | cát
catss | cats

This is mainly used to type foreign words. In the previous examples, the only valid Vietnamese that required escaping was "oo" (as in "cái xoong").

## Links

* [Telex input](https://en.wikipedia.org/wiki/Telex_(input_method)) on Wikipedia