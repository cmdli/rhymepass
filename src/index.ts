import * as fs from "fs";
import * as readline from "readline";
import { Inflector } from "en-inflectors";
import wordDict from "./data/oxford-3000-words-parts.json";
import pronunciations from "./data/cmudict-common.json";

export enum PartOfSpeech {
    NOUN = 0,
    VERB,
    ADJECTIVE,
    PREPOSITION,
    ADVERB,
    CONJUNCTION,
    PRONOUN,
    EXCLAMATION,
}
const partOfSpeechToString: Map<PartOfSpeech, string> = new Map([
    [PartOfSpeech.NOUN, "n."],
    [PartOfSpeech.VERB, "v."],
    [PartOfSpeech.ADJECTIVE, "adj."],
    [PartOfSpeech.PREPOSITION, "prep."],
    [PartOfSpeech.ADVERB, "adv."],
    [PartOfSpeech.CONJUNCTION, "conj."],
    [PartOfSpeech.PRONOUN, "pron."],
    [PartOfSpeech.EXCLAMATION, "exclam."],
]);
const stringToPartOfSpeech: Map<string, PartOfSpeech> = new Map(
    Array.from(partOfSpeechToString, (a) => [a[1], a[0]])
);

function partTypeToPartOfSpeech(partType: PartType): PartOfSpeech {
    if (partType === ComplexType.PAST_TENSE_VERB) {
        return PartOfSpeech.VERB;
    } else {
        return partType as PartOfSpeech;
    }
}

export enum ComplexType {
    PAST_TENSE_VERB = "PAST_TENSE_VERB",
}
export type PartType = PartOfSpeech | ComplexType;

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

function isVowel(phoneme: string): boolean {
    phoneme = phoneme.replace(/[0-9]/, "");
    return vowelPhonemes.has(phoneme);
}

function randomInt(lower: number, higher: number) {
    return Math.floor(Math.random() * (higher - lower)) + lower;
}

function capitalizeFirst(val: string): string {
    if (val.length === 0) {
        return val;
    }
    if (val.length === 1) {
        return val.toUpperCase();
    }
    return val[0].toUpperCase() + val.substring(1);
}

function getRhymeEnding(phonemes: string[]): string {
    for (let i = 0; i < phonemes.length; i++) {
        // The phoneme that ends in 1 is the stressed syllable
        if (phonemes[i].endsWith("1")) {
            // Two words rhyme if they share the same phonemes after the stressed syllable
            return phonemes.slice(i).join(" ");
        }
    }
    return "";
}

let wordPhonemes: Map<string, Array<string>> = new Map();
// Map of the rhyming portion of a word to the set of words that rhyme
// e.g. { 'essed' => Set('blessed','stressed') }
let rhymingWords: Map<string, Set<string>> = new Map();
let pararhymes: Map<string, Array<string>> = new Map();
let partsOfSpeech: Map<string, Set<PartOfSpeech>> = new Map();
let wordsByPart: Map<PartOfSpeech, Array<string>> = new Map();
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

function loadWordPhonemes(): Map<string, Array<string>> {
    const wordPhonemes: Map<string, Array<string>> = new Map();
    for (const [word, phonemes] of Object.entries(pronunciations)) {
        wordPhonemes.set(word, phonemes);
    }
    return wordPhonemes;
}

function findRhymedWords(
    wordPhonemes: Map<string, Array<string>>
): Map<string, Set<string>> {
    const rhymingWords: Map<string, Set<string>> = new Map();
    for (const [word, phonemes] of wordPhonemes.entries()) {
        const rhymingPortion = getRhymeEnding(phonemes);
        const rhymedWords = rhymingWords.get(rhymingPortion);
        if (!rhymedWords) {
            rhymingWords.set(rhymingPortion, new Set([word]));
        } else {
            rhymedWords.add(word);
        }
    }
    return rhymingWords;
}

function findPararhymes(
    wordPhonemes: Map<string, Array<string>>
): Map<string, Array<string>> {
    const pararhymeMap: Map<string, [string]> = new Map();
    for (let [word, phonemes] of wordPhonemes.entries()) {
        const consonants = phonemes
            .filter((phoneme) => !isVowel(phoneme))
            .join(" ");
        if (pararhymeMap.has(consonants)) {
            pararhymeMap.get(consonants).push(word);
        } else {
            pararhymeMap.set(consonants, [word]);
        }
    }
    return pararhymeMap;
}

function loadPartsOfSpeech(): Map<string, Set<PartOfSpeech>> {
    const partsOfSpeech: Map<string, Set<PartOfSpeech>> = new Map();
    for (const [word, partStrings] of Object.entries(wordDict)) {
        const parts = partStrings
            .map((p) => stringToPartOfSpeech.get(p))
            .filter((x) => x !== undefined);
        partsOfSpeech.set(word, new Set(parts));
    }
    return partsOfSpeech;
}

function splitByValue(
    map: Map<string, Set<PartOfSpeech>>
): Map<PartOfSpeech, Array<string>> {
    const split: Map<PartOfSpeech, Array<string>> = new Map();
    for (const [key, value] of map.entries()) {
        for (const val2 of value) {
            if (split.has(val2)) {
                split.get(val2).push(key);
            } else {
                split.set(val2, new Array(key));
            }
        }
    }
    return split;
}

function getRhymes(word: string): Set<string> {
    const phonemes = wordPhonemes.get(word);
    const rhymedWords = rhymingWords.get(getRhymeEnding(phonemes));
    if (!rhymedWords) {
        return new Set();
    }
    const output = new Set<string>(rhymedWords);
    output.delete(word);
    return output;
}

function getRandomWord(partOfSpeech: PartOfSpeech): [string, number] {
    const words = wordsByPart.get(partOfSpeech);
    if (!words) {
        return ["", 0];
    }
    const entropy = Math.log2(words.length);
    return [words[randomInt(0, words.length)], entropy];
}

function makePastTense(verb: string): string {
    const inflector = new Inflector(verb);
    return inflector.toPast();
}

function getRhymingWords(partTypes: PartOfSpeech[]): {
    parts: string[] | null;
    entropy: number;
} {
    // NOTE: This calculation of entropy is incorrect, as it
    // doesn't account for differing amounts of entropy for
    // different words. Some words will have more rhymes and
    // some will have less. However, it is an okay estimate.
    let parts = [];
    let entropy = 0;
    const possibleFirstWords = wordsByPart.get(partTypes[0]);
    entropy += Math.log2(possibleFirstWords.length);
    parts.push(possibleFirstWords[randomInt(0, possibleFirstWords.length)]);
    const rhymes = getRhymes(parts[0]);
    for (let i = 1; i < partTypes.length; i++) {
        if (!rhymes || rhymes.size === 0) {
            return { parts: null, entropy: 0 };
        }
        const matchingWords = Array.from(rhymes).filter((word) =>
            partsOfSpeech.get(word).has(partTypes[i])
        );
        entropy += Math.log2(matchingWords.length);
        const nextWord = matchingWords[randomInt(0, matchingWords.length)];
        rhymes.delete(nextWord);
        parts.push(nextWord);
    }
    return { parts, entropy };
}

export function getPassphrase(
    parts: PartType[],
    rhyme?: number[],
    minimumEntropy?: number
): {
    passphrase: string | null;
    entropy: number;
} {
    if (minimumEntropy === undefined) {
        minimumEntropy = 30.0; // Minimum 30 bits of entropy
    }
    let totalEntropy = 0.0;
    const partStrings = new Array<string | null>(parts.length).fill(null);
    for (let i = 0; i < parts.length; i++) {
        if (partStrings[i] !== null) {
            continue;
        }
        let partIndexes = [i]; // Part indexes to update
        if (rhyme !== undefined) {
            partIndexes = rhyme
                .map((val, j) => (val === rhyme[i] ? j : null))
                .filter((x) => x !== null);
        }
        let partsOfSpeech = partIndexes.map((i) =>
            partTypeToPartOfSpeech(parts[i])
        );
        let result = getRhymingWords(partsOfSpeech);
        if (result.parts === null) {
            return { passphrase: null, entropy: 0 };
        }
        for (let j = 0; j < partIndexes.length; j++) {
            let partI = partIndexes[j];
            let partString = result.parts[j];
            if (parts[partI] === ComplexType.PAST_TENSE_VERB) {
                partString = makePastTense(partString);
            }
            partString = capitalizeFirst(partString);
            partStrings[partI] = partString;
        }
        totalEntropy += result.entropy;
    }
    const passphrase = partStrings.join("");
    if (totalEntropy > minimumEntropy) {
        return { passphrase, entropy: totalEntropy };
    } else {
        return { passphrase: null, entropy: 0 };
    }
}

async function main() {
    load();
    let partsCount = new Map();
    for (const [word, parts] of partsOfSpeech.entries()) {
        for (const part of parts) {
            if (partsCount.has(part)) {
                partsCount.set(part, partsCount.get(part) + 1);
            } else {
                partsCount.set(part, 1);
            }
        }
    }
    console.log("Count of each part of speech:", partsCount);
    console.log(
        getPassphrase(
            [
                PartOfSpeech.ADJECTIVE,
                PartOfSpeech.NOUN,
                ComplexType.PAST_TENSE_VERB,
                PartOfSpeech.NOUN,
            ],
            [1, 2, 3, 2]
        )
    );
}

main();
