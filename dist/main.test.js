"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
describe("index.ts", () => {
    test("getPassphrase returns a passphrase and entropy", () => {
        const { passphrase, entropy } = (0, _1.getPassphrase)([
            _1.PartOfSpeech.NOUN,
            _1.PartOfSpeech.NOUN,
            _1.PartOfSpeech.NOUN,
            _1.PartOfSpeech.NOUN,
        ]);
        expect(passphrase).not.toBeFalsy();
        expect(entropy).toBeGreaterThan(0);
    });
    test("getPassphrase returns rhyming passphrase", () => {
        const { passphrase, entropy } = (0, _1.getPassphrase)([
            _1.PartOfSpeech.NOUN,
            _1.PartOfSpeech.NOUN,
            _1.PartOfSpeech.NOUN,
            _1.PartOfSpeech.NOUN,
        ], [1, 2, 1, 2]);
        expect(passphrase).not.toBeFalsy();
        expect(entropy).toBeGreaterThan(0);
    });
    test("getPassphrase returns words of different types", () => {
        const { passphrase, entropy } = (0, _1.getPassphrase)([
            _1.PartOfSpeech.ADJECTIVE,
            _1.PartOfSpeech.NOUN,
            _1.ComplexType.PAST_TENSE_VERB,
            _1.PartOfSpeech.NOUN,
        ], [1, 2, 3, 2]);
        expect(passphrase).not.toBeFalsy();
        expect(entropy).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=main.test.js.map