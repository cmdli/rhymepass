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

function randomChoice<T>(arr: T[]): T {
    return arr[randomInt(0, arr.length - 1)];
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

function splitByValue<T, K>(map: Map<T, Set<K>>): Map<K, Array<T>> {
    const split: Map<K, Array<T>> = new Map();
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

function shuffle<T>(arr: Array<T>) {
    for (let i = 0; i < arr.length - 1; i++) {
        const j = Math.floor(Math.random() * (arr.length - (i + 1))) + i + 1;
        const s = arr[i];
        arr[i] = arr[j];
        arr[j] = s;
    }
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

function getRhymes(word: string): Set<string> {
    const phonemes = wordPhonemes.get(word);
    if (!wordPhonemes) {
        return new Set();
    }
    const rhymedWords = rhymingWords.get(getRhymeEnding(phonemes));
    if (!rhymedWords) {
        return new Set();
    }
    const output = new Set<string>(rhymedWords);
    output.delete(word);
    return output;
}

function isPartOfSpeech(word: string, part: PartOfSpeech): boolean {
    return partsOfSpeech.get(word).has(part);
}

function makePastTense(verb: string): string {
    const inflector = new Inflector(verb);
    return inflector.toPast();
}

function getRhymingWords(partTypes: PartOfSpeech[]): {
    rhymeGroup: string[] | null;
    rhymeEntropy: number;
} {
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
            const matchingWords = [...rhymes].filter((word) =>
                isPartOfSpeech(word, partTypes[i])
            );
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

export function getPassphrase(
    parts: PartType[],
    rhyme?: number[],
    minimumEntropy?: number
): {
    passphrase: string | null;
    entropy: number;
} {
    if (minimumEntropy === undefined) {
        minimumEntropy = 20.0;
    }
    if (rhyme === undefined) {
        // If no rhyme, each word only needs to rhyme with itself
        rhyme = [...parts.keys()];
    }

    let totalEntropy = 0.0;
    const partStrings = new Array<string | null>(parts.length).fill(null);
    for (let i = 0; i < parts.length; i++) {
        if (partStrings[i] !== null) {
            continue;
        }
        let partIndexes = rhyme
            .map((val, j) => (val === rhyme[i] ? j : null))
            .filter((x) => x !== null);
        let partsOfSpeech = partIndexes.map((i) =>
            partTypeToPartOfSpeech(parts[i])
        );
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
    for (const words of wordsByPart.values()) {
        for (const word of words) {
            const phonemes = wordPhonemes.get(word);
            if (!phonemes) {
                console.log("No phonemes for:", word);
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
