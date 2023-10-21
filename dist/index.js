"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPassphrase = exports.ComplexType = exports.PartOfSpeech = void 0;
const en_inflectors_1 = require("en-inflectors");
const oxford_3000_words_parts_json_1 = __importDefault(require("./data/oxford-3000-words-parts.json"));
const cmudict_common_json_1 = __importDefault(require("./data/cmudict-common.json"));
var PartOfSpeech;
(function (PartOfSpeech) {
    PartOfSpeech[PartOfSpeech["NOUN"] = 0] = "NOUN";
    PartOfSpeech[PartOfSpeech["VERB"] = 1] = "VERB";
    PartOfSpeech[PartOfSpeech["ADJECTIVE"] = 2] = "ADJECTIVE";
    PartOfSpeech[PartOfSpeech["PREPOSITION"] = 3] = "PREPOSITION";
    PartOfSpeech[PartOfSpeech["ADVERB"] = 4] = "ADVERB";
    PartOfSpeech[PartOfSpeech["CONJUNCTION"] = 5] = "CONJUNCTION";
    PartOfSpeech[PartOfSpeech["PRONOUN"] = 6] = "PRONOUN";
    PartOfSpeech[PartOfSpeech["EXCLAMATION"] = 7] = "EXCLAMATION";
})(PartOfSpeech || (exports.PartOfSpeech = PartOfSpeech = {}));
const partOfSpeechToString = new Map([
    [PartOfSpeech.NOUN, "n."],
    [PartOfSpeech.VERB, "v."],
    [PartOfSpeech.ADJECTIVE, "adj."],
    [PartOfSpeech.PREPOSITION, "prep."],
    [PartOfSpeech.ADVERB, "adv."],
    [PartOfSpeech.CONJUNCTION, "conj."],
    [PartOfSpeech.PRONOUN, "pron."],
    [PartOfSpeech.EXCLAMATION, "exclam."],
]);
const stringToPartOfSpeech = new Map(Array.from(partOfSpeechToString, (a) => [a[1], a[0]]));
function partTypeToPartOfSpeech(partType) {
    if (partType === ComplexType.PAST_TENSE_VERB) {
        return PartOfSpeech.VERB;
    }
    else {
        return partType;
    }
}
var ComplexType;
(function (ComplexType) {
    ComplexType["PAST_TENSE_VERB"] = "PAST_TENSE_VERB";
})(ComplexType || (exports.ComplexType = ComplexType = {}));
const vowelPhonemes = new Set([
    "AH",
    "AE",
    "AO",
    "AW",
    "EH",
    "ER",
    "EY",
    "IY",
    "IH",
    "OW",
    "OY",
    "UH",
    "UW",
]);
function isVowel(phoneme) {
    phoneme = phoneme.replace(/[0-9]/, "");
    return vowelPhonemes.has(phoneme);
}
function randomInt(lower, higher) {
    return Math.floor(Math.random() * (higher - lower)) + lower;
}
function randomChoice(arr) {
    return arr[randomInt(0, arr.length - 1)];
}
function capitalizeFirst(val) {
    if (val.length === 0) {
        return val;
    }
    if (val.length === 1) {
        return val.toUpperCase();
    }
    return val[0].toUpperCase() + val.substring(1);
}
function getRhymeEnding(phonemes) {
    for (let i = 0; i < phonemes.length; i++) {
        // The phoneme that ends in 1 is the stressed syllable
        if (phonemes[i].endsWith("1")) {
            // Two words rhyme if they share the same phonemes after the stressed syllable
            return phonemes.slice(i).join(" ");
        }
    }
    return "";
}
function splitByValue(map) {
    const split = new Map();
    for (const [key, value] of map.entries()) {
        for (const val2 of value) {
            if (split.has(val2)) {
                split.get(val2).push(key);
            }
            else {
                split.set(val2, new Array(key));
            }
        }
    }
    return split;
}
function shuffle(arr) {
    for (let i = 0; i < arr.length - 1; i++) {
        const j = Math.floor(Math.random() * (arr.length - (i + 1))) + i + 1;
        const s = arr[i];
        arr[i] = arr[j];
        arr[j] = s;
    }
}
let wordPhonemes = new Map();
// Map of the rhyming portion of a word to the set of words that rhyme
// e.g. { 'essed' => Set('blessed','stressed') }
let rhymingWords = new Map();
let pararhymes = new Map();
let partsOfSpeech = new Map();
let wordsByPart = new Map();
let loaded = false;
function load() {
    if (loaded) {
        return;
    }
    partsOfSpeech = loadPartsOfSpeech();
    wordsByPart = splitByValue(partsOfSpeech);
    wordPhonemes = loadWordPhonemes();
    rhymingWords = findRhymedWords(wordPhonemes);
    pararhymes = findPararhymes(wordPhonemes);
    loaded = true;
}
function loadWordPhonemes() {
    const wordPhonemes = new Map();
    for (const [word, phonemes] of Object.entries(cmudict_common_json_1.default)) {
        wordPhonemes.set(word, phonemes);
    }
    return wordPhonemes;
}
function findRhymedWords(wordPhonemes) {
    const rhymingWords = new Map();
    for (const [word, phonemes] of wordPhonemes.entries()) {
        const rhymingPortion = getRhymeEnding(phonemes);
        const rhymedWords = rhymingWords.get(rhymingPortion);
        if (!rhymedWords) {
            rhymingWords.set(rhymingPortion, new Set([word]));
        }
        else {
            rhymedWords.add(word);
        }
    }
    return rhymingWords;
}
function findPararhymes(wordPhonemes) {
    const pararhymeMap = new Map();
    for (let [word, phonemes] of wordPhonemes.entries()) {
        const consonants = phonemes
            .filter((phoneme) => !isVowel(phoneme))
            .join(" ");
        if (pararhymeMap.has(consonants)) {
            pararhymeMap.get(consonants).push(word);
        }
        else {
            pararhymeMap.set(consonants, [word]);
        }
    }
    return pararhymeMap;
}
function loadPartsOfSpeech() {
    const partsOfSpeech = new Map();
    for (const [word, partStrings] of Object.entries(oxford_3000_words_parts_json_1.default)) {
        const parts = partStrings
            .map((p) => stringToPartOfSpeech.get(p))
            .filter((x) => x !== undefined);
        partsOfSpeech.set(word, new Set(parts));
    }
    return partsOfSpeech;
}
function getRhymes(word) {
    const phonemes = wordPhonemes.get(word);
    if (!wordPhonemes) {
        return new Set();
    }
    const rhymedWords = rhymingWords.get(getRhymeEnding(phonemes));
    if (!rhymedWords) {
        return new Set();
    }
    const output = new Set(rhymedWords);
    output.delete(word);
    return output;
}
function isPartOfSpeech(word, part) {
    return partsOfSpeech.get(word).has(part);
}
function makePastTense(verb) {
    const inflector = new en_inflectors_1.Inflector(verb);
    return inflector.toPast();
}
function getRhymingWords(partTypes) {
    if (partTypes.length === 0) {
        return { rhymeGroup: [], rhymeEntropy: 0 };
    }
    // NOTE: This calculation of entropy is incorrect, as it
    // doesn't account for differing amounts of entropy for
    // different words. Some words will have more rhymes and
    // some will have less. However, it is an okay estimate.
    let rhymeGroup = [];
    let rhymeEntropy = 0;
    const possibleFirstWords = wordsByPart.get(partTypes[0]);
    const randomIndexes = [...new Array(possibleFirstWords.length).keys()];
    shuffle(randomIndexes);
    // Try random words until you run out of choices
    for (const randomI of randomIndexes) {
        let part = possibleFirstWords[randomI];
        const rhymes = getRhymes(part);
        let partialEntropy = 0;
        let rhymeWords = [];
        for (let i = 1; i < partTypes.length; i++) {
            if (!rhymes || rhymes.size === 0) {
                rhymeWords = null;
                break;
            }
            const matchingWords = [...rhymes].filter((word) => isPartOfSpeech(word, partTypes[i]));
            if (matchingWords.length === 0) {
                rhymeWords = null;
                break;
            }
            partialEntropy += Math.log2(matchingWords.length);
            const nextWord = randomChoice(matchingWords);
            rhymes.delete(nextWord);
            rhymeWords.push(nextWord);
        }
        if (rhymeWords !== null) {
            rhymeGroup = [part, ...rhymeWords];
            rhymeEntropy = Math.log2(possibleFirstWords.length) + rhymeEntropy;
            console.log(rhymeGroup);
            break;
        }
    }
    return { rhymeGroup, rhymeEntropy };
}
function getPassphrase(parts, rhyme, minimumEntropy) {
    if (minimumEntropy === undefined) {
        minimumEntropy = 20.0;
    }
    if (rhyme === undefined) {
        // If no rhyme, each word only needs to rhyme with itself
        rhyme = [...parts.keys()];
    }
    let totalEntropy = 0.0;
    const partStrings = new Array(parts.length).fill(null);
    for (let i = 0; i < parts.length; i++) {
        if (partStrings[i] !== null) {
            continue;
        }
        let partIndexes = rhyme
            .map((val, j) => (val === rhyme[i] ? j : null))
            .filter((x) => x !== null);
        let partsOfSpeech = partIndexes.map((i) => partTypeToPartOfSpeech(parts[i]));
        let { rhymeGroup, rhymeEntropy } = getRhymingWords(partsOfSpeech);
        if (rhymeGroup === null) {
            return { passphrase: null, entropy: 0 };
        }
        for (let j = 0; j < partIndexes.length; j++) {
            let partI = partIndexes[j];
            let partString = rhymeGroup[j];
            if (parts[partI] === ComplexType.PAST_TENSE_VERB) {
                partString = makePastTense(partString);
            }
            partString = capitalizeFirst(partString);
            partStrings[partI] = partString;
        }
        totalEntropy += rhymeEntropy;
    }
    const passphrase = partStrings.join("");
    if (totalEntropy > minimumEntropy) {
        return { passphrase, entropy: totalEntropy };
    }
    else {
        return { passphrase: null, entropy: 0 };
    }
}
exports.getPassphrase = getPassphrase;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        load();
        let partsCount = new Map();
        for (const [word, parts] of partsOfSpeech.entries()) {
            for (const part of parts) {
                if (partsCount.has(part)) {
                    partsCount.set(part, partsCount.get(part) + 1);
                }
                else {
                    partsCount.set(part, 1);
                }
            }
        }
        for (const words of wordsByPart.values()) {
            for (const word of words) {
                const phonemes = wordPhonemes.get(word);
                if (!phonemes) {
                    console.log("No phonemes for:", word);
                }
            }
        }
        console.log("Count of each part of speech:", partsCount);
        console.log(getPassphrase([
            PartOfSpeech.ADJECTIVE,
            PartOfSpeech.NOUN,
            ComplexType.PAST_TENSE_VERB,
            PartOfSpeech.NOUN,
        ], [1, 2, 3, 2]));
    });
}
//# sourceMappingURL=index.js.map