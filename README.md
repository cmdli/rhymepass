# Rhymepass

![Tests](https://github.com/cmdli/rhymepass/actions/workflows/test.yml/badge.svg)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/cmdli/rhymepass/blob/main/LICENSE)
![Downloads](https://img.shields.io/npm/dm/rhymepass)

Rhymepass is a simple Javascript library to build random literary passphrases, including rhyming ones.

## Usage

```javascript
import { getPassphrase, PartOfSpeech, ComplexType } from "rhymepass";

const { passphrase, entropy } = getPassphrase(
    [
        PartOfSpeech.ADJECTIVE,
        PartOfSpeech.NOUN,
        ComplexType.PAST_TENSE_VERB,
        PartOfSpeech.NOUN,
    ],
    [1, 2, 3, 2], // Rhyme Pattern
    25 // Minimum bits of entropy
);

console.log(passphrase, entropy);
// Output: HelpfulLayerFilmedPlayer 29.809370522853857
```

`getPassphrase` returns a random passphrase matching the provided requirements. If there is no passphrase matching those requirements with the minimum entropy (default 20 bits), then it returns `null`.
