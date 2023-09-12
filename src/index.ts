import * as fs from "fs";
import * as readline from "readline";
import { Inflector } from "en-inflectors";
import wordDict from "./data/oxford-3000-words-parts.json";

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

// Map of the rhyming portion of a word to the set of words that rhyme
// e.g. { 'essed' => Set('blessed','stressed') }
let rhymingWords: Map<string, Set<string>> = new Map();
let partsOfSpeech: Map<string, Set<string>> = new Map();
let wordsByPart: Map<string, Array<string>> = new Map();
async function load() {
    partsOfSpeech = await loadPartsOfSpeech();
    wordsByPart = splitByValue(partsOfSpeech);
}

async function loadCommonWords(): Promise<Set<string>> {
    const commonWords: Set<string> = new Set();
    const commonWordsStream = fs.createReadStream(
        "src/data/common-words.txt",
        "utf-8"
    );
    const rl = readline.createInterface({
        input: commonWordsStream,
        crlfDelay: Infinity,
    });
    for await (let line of rl) {
        commonWords.add(line.toLowerCase());
    }
    return commonWords;
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

async function loadPartsOfSpeech(): Promise<Map<string, Set<string>>> {
    const partsOfSpeech: Map<string, Set<string>> = new Map();
    for (const [word, part] of Object.entries(wordDict)) {
        partsOfSpeech.set(word, new Set(part));
    }
    return partsOfSpeech;
}

function splitByValue(
    map: Map<string, Set<string>>
): Map<string, Array<string>> {
    const split: Map<string, Array<string>> = new Map();
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

function getRandomWord(partOfSpeech: string): string {
    const words = wordsByPart.get(partOfSpeech);
    if (!words) {
        return "";
    }
    return words[randomInt(0, words.length)];
}

function makePastTense(verb: string): string {
    const inflector = new Inflector(verb);
    return inflector.toPast();
}

function phrase(): string {
    function capitalizeFirst(val: string): string {
        return val[0].toUpperCase() + val.substring(1);
    }
    const word1 = capitalizeFirst(getRandomWord("adj."));
    const word2 = capitalizeFirst(getRandomWord("n."));
    const word3 = capitalizeFirst(makePastTense(getRandomWord("v.")));
    const word4 = capitalizeFirst(getRandomWord("n."));
    return word1 + word2 + word3 + word4;
}

async function main() {
    await load();
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
    console.log(phrase());
}

main();
