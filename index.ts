import * as fs from "fs";
import * as readline from "readline";

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

let wordPhonemes: Map<string, Array<string>> = new Map();
// Map of the rhyming portion of a word to the set of words that rhyme
// e.g. { 'essed' => Set('blessed','stressed') }
let rhymingWords: Map<string, Set<string>> = new Map();
let commonWords: Set<string> = new Set();
let partsOfSpeech: Map<string, string> = new Map();
async function load() {
    commonWords = await loadCommonWords();
    wordPhonemes = await loadWordPhonemes(commonWords);
    rhymingWords = await findRhymedWords(wordPhonemes);
    partsOfSpeech = await loadPartsOfSpeech();
}

async function loadCommonWords(): Promise<Set<string>> {
    const commonWords: Set<string> = new Set();
    const commonWordsStream = fs.createReadStream(
        "data/common-words.txt",
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
    const rhymeLineStream = fs.createReadStream("data/cmudict-0.7b", "utf-8");
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

async function loadPartsOfSpeech(): Promise<Map<string, string>> {
    const partsOfSpeech = new Map();
    const rhymeLineStream = fs.createReadStream(
        "data/oxford-3000-words-parts.txt",
        "utf-8"
    );
    const rl = readline.createInterface({
        input: rhymeLineStream,
        crlfDelay: Infinity,
    });
    for await (let line of rl) {
        const split = line.lastIndexOf(" ");
        if (split < 0) {
            continue;
        }
        const word = line.substring(0, split);
        const part = line.substring(split + 1);
        // If a word is multiple parts of speech, just keep the latest one
        partsOfSpeech.set(word, part);
    }
    return partsOfSpeech;
}

async function main() {
    await load();
    let counts = new Array(100).fill(0);
    for (const [rhymingPortion, words] of rhymingWords.entries()) {
        if (words.size >= 2) {
            counts[words.size]++;
            // console.log(`${rhymingPortion} => ${[...words].join(" ")}`);
        }
    }
    console.log("Number of rhyming sets:", counts);
    let partsCount = new Map();
    for (const [word, part] of partsOfSpeech.entries()) {
        if (partsCount.has(part)) {
            partsCount.set(part, partsCount.get(part) + 1);
        } else {
            partsCount.set(part, 1);
        }
    }
    console.log("Count of each part of speech:", partsCount);
}

main();
