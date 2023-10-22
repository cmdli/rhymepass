import { ComplexType, PartOfSpeech, getPassphrase } from ".";

describe("index.ts", () => {
    test("getPassphrase returns a passphrase and entropy", () => {
        const { passphrase, entropy } = getPassphrase([
            PartOfSpeech.NOUN,
            PartOfSpeech.NOUN,
            PartOfSpeech.NOUN,
            PartOfSpeech.NOUN,
        ]);
        expect(passphrase).not.toBeFalsy();
        expect(entropy).toBeGreaterThan(0);
    });

    test("getPassphrase returns rhyming passphrase", () => {
        const { passphrase, entropy } = getPassphrase(
            [
                PartOfSpeech.NOUN,
                PartOfSpeech.NOUN,
                PartOfSpeech.NOUN,
                PartOfSpeech.NOUN,
            ],
            [1, 2, 1, 2]
        );
        expect(passphrase).not.toBeFalsy();
        expect(entropy).toBeGreaterThan(0);
    });

    test("getPassphrase returns words of different types", () => {
        const { passphrase, entropy } = getPassphrase(
            [
                PartOfSpeech.ADJECTIVE,
                PartOfSpeech.NOUN,
                ComplexType.PAST_TENSE_VERB,
                PartOfSpeech.NOUN,
            ],
            [1, 2, 3, 2]
        );
        expect(passphrase).not.toBeFalsy();
        expect(entropy).toBeGreaterThan(0);
    });
});
