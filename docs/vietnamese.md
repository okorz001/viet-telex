# Vietnamese

This document briefly explains how words are structured in the Vietnamese language.

## Letters

The Vietnamese alphabet has 29 letters:

> a ă â b c d đ e ê g h i k l m n o ô ơ p q r s t u ư v x y

4 letters from the basic Latin alphabet are not used in Vietnamese:

> f j w z

## Word Structure

A Vietnamese word consists of:

* An optional initial consonant
* A vowel
* An optional final consonant

## Consonants

The following Vietnamese letters are consonants:

> b c d đ g h k l m n p q r s t v x

Vietnamese also has consonant digraphs and trigraphs:

> ch gh gi kh ng ngh nh ph qu th tr

Note that i and u are individually not consonants, but are part of consonant digraphs (gi and qu).

### Final Consonants

All consonants are valid initial consonants. However, only the following are valid final consonants:

> c ch m n ng nh p t

## Vowels

The following Vietnamese letters are vowels:

> a ă â e ê i o ô ơ u ư y

Vietnamese also has many diphthongs and triphthongs. They can be divided into three groups based on spelling rules.

These are never used with a final consonant:

> ai ao au ay âu ây eo êu ia iêu iu oai oao oeo oi ôi ơi ua ui uya ưa ưi ưu yêu

These may be used with a final consonant:

> oa oe uê uy

These must be used with a final consonant:

> iê oă oo uâ uô uyê ươ

Any other combinations of vowels is invalid.

## Tones

Vietnamese has 6 tones. Every Vietnamese word has a tone.

Tone | Example
--- | ---
ngang | ma
sắc | má
huyền | mà
hỏi | mả
ngã | mã
nặng | mạ

Note that only 5 tone marks are used, and the ngang tone is indicated by the lack of any other mark.

## Tone Mark Placement

Tone marks are always placed on vowels.

There are multiple conventions for where to place tone marks on compound vowels. The following describes the "new style" (kiểu mới).

Tone marks are placed on the first letter of the following:

> ai ao au ay âu ây eo êu ia iu oi ôi ơi ua ui ưa ưi ưu

Tone marks are placed on the second letter of the following:

> iê iêu oa oai oao oă oe oeo oo uâ uê uô uy uya ươ yêu

Tone marks are placed on the third letter of the following:

> uyê

### Old-Style Placement (Kiểu Cũ)

The old style applies the following rules in order:

1. If the vowel cluster contains any extended-diacritic vowel (ă â ê ô ơ ư), place the mark on the last such letter.
2. Otherwise, let the "rhyme" = vowel cluster + final consonant. Find the center index of the rhyme (i.e. `(length − 1) / 2`). Place the mark on the vowel letter in the cluster closest to that index; if two vowels are equidistant, choose the first.

Examples where new and old style differ:

New Style | Old Style | Vowel | Final
--- | --- | --- | ---
hoá | hóa | oa | (none)
oé | óe | oe | (none)
uý | úy | uy | (none)

Examples where new and old style agree (extended vowel present):

New Style | Old Style | Vowel | Final
--- | --- | --- | ---
uế | uế | uê | (none)
iế | iế | iê | (none)
ướ | ướ | ươ | (none)

Examples where new and old style agree (center of rhyme lands on same vowel):

New Style | Old Style | Vowel | Final
--- | --- | --- | ---
toàn | toàn | oa | n
buýt | buýt | uy | t

## "gi-" & "qu-" Spelling Rules

"gi" and "qu" are consonant digraphs, even though "i" and "u" are individually vowels. This allows the construction of words that appear to contain invalid vowel clusters.

Word | Initial Consonant | Vowel | Final Consonant
--- | --- | --- | ---
giờ | gi | ơ | (none)
quét | qu | e | t

When combined with a vowel cluster that starts with the same vowel, the duplicate vowel letter is dropped.

Word | Initial Consonant | Vowel | Final Consonant
--- | --- | --- | ---
gì | gi | i | (none)
giết | gi | iê | t
quyển | qu | uyê | n

When ambiguous, the consonant and vowel are fully separate. This is important for tone mark placement.

Word | Initial Consonant | Vowel | Final Consonant
--- | --- | --- | ---
giá | gi | a | (none)

## Links

* [Vietnamese alphabet](https://en.wikipedia.org/wiki/Vietnamese_alphabet) on Wikipedia
* [Vietnamese phonology](https://en.wikipedia.org/wiki/Vietnamese_phonology) on Wikipedia
* [Quy tắc đặt dấu thanh của chữ Quốc ngữ](https://vi.wikipedia.org/wiki/Quy_t%E1%BA%AFc_%C4%91%E1%BA%B7t_d%E1%BA%A5u_thanh_c%E1%BB%A7a_ch%E1%BB%AF_Qu%E1%BB%91c_ng%E1%BB%AF) on Wikipedia (VI)
