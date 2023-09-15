import * as fs from "fs";
import * as readline from "readline";
import { Inflector } from "en-inflectors";
import wordDict from "./data/oxford-3000-words-parts.json";

type PartOfSpeech = number;
export const NOUN: PartOfSpeech = 0;
export const VERB: PartOfSpeech = 1;
export const ADJECTIVE: PartOfSpeech = 2;
export const PREPOSITION: PartOfSpeech = 3;
export const ADVERB: PartOfSpeech = 4;
export const CONJUNCTION: PartOfSpeech = 5;
export const PRONOUN: PartOfSpeech = 6;
export const EXCLAMATION: PartOfSpeech = 7;
const partOfSpeechToString: Map<PartOfSpeech, string> = new Map([
    [NOUN, "n."],
    [VERB, "v."],
    [ADJECTIVE, "adj."],
    [PREPOSITION, "prep."],
    [ADVERB, "adv."],
    [CONJUNCTION, "conj."],
    [PRONOUN, "pron."],
    [EXCLAMATION, "exclam."],
]);
const stringToPartOfSpeech: Map<string, PartOfSpeech> = new Map(
    Array.from(partOfSpeechToString, (a) => [a[1], a[0]])
);

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

// Map of the rhyming portion of a word to the set of words that rhyme
// e.g. { 'essed' => Set('blessed','stressed') }
let rhymingWords: Map<string, Set<string>> = new Map();
let partsOfSpeech: Map<string, Set<PartOfSpeech>> = new Map();
let wordsByPart: Map<PartOfSpeech, Array<string>> = new Map();
let loaded = false;
function load() {
    if (loaded) {
        return;
    }
    partsOfSpeech = loadPartsOfSpeech();
    wordsByPart = splitByValue(partsOfSpeech);
    loaded = true;
}

async function loadWordPhonemes(
    filter: Set<string>
): Promise<Map<string, Array<string>>> {
    const wordPhonemes: Map<string, Array<string>> = new Map();
    const rhymeLineStream = fs.createReadStream(
        "src/data/cmudict-0.7b",
        "utf-8"
    );
    const rl = readline.createInterface({
        input: rhymeLineStream,
        crlfDelay: Infinity,
    });
    for await (let line of rl) {
        line = line.trim();
        if (line.startsWith(";;;")) {
            continue;
        }
        const args = line.split(" ").filter((val) => val.length != 0);
        if (args.length < 2) {
            continue;
        }
        const word = args.shift().toLowerCase();
        const phonemes = args; // After removing first element, rest are phonemes
        if (!filter.has(word)) {
            continue;
        }
        wordPhonemes.set(word, phonemes);
    }
    return wordPhonemes;
}

async function findRhymedWords(
    wordPhonemes: Map<string, Array<string>>
): Promise<Map<string, Set<string>>> {
    const rhymedWords: Map<string, Set<string>> = new Map();
    for (const [word, phonemes] of wordPhonemes.entries()) {
        for (let i = 0; i < phonemes.length; i++) {
            // The phoneme that ends in 1 is the stressed syllable
            if (phonemes[i].endsWith("1")) {
                // Two words rhyme if they share the same phonemes after the stressed syllable
                const rhymingPortion = phonemes.slice(i).join(" ");
                const rhymedWords = rhymingWords.get(rhymingPortion);
                if (!rhymedWords) {
                    rhymingWords.set(rhymingPortion, new Set([word]));
                } else {
                    rhymedWords.add(word);
                }
                break;
            }
        }
    }
    return rhymedWords;
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

export function getPassphrase(partTypes: PartOfSpeech[]): {
    passphrase: string;
    entropy: number;
} {
    let totalEntropy = 0.0;
    const parts = [];
    for (const partType of partTypes) {
        let [part, entropy] = getRandomWord(partType);
        if (partType === VERB) {
            part = makePastTense(part);
        }
        part = capitalizeFirst(part);
        parts.push(part);
        totalEntropy += entropy;
    }
    const passphrase = parts.join("");
    return { passphrase, entropy: totalEntropy };
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
    console.log(getPassphrase([ADJECTIVE, NOUN, VERB, NOUN]));
}

main();
