#!/usr/bin/python3
import json

print("Starting compilation of cmudict...")
oxford_3000 = open("src/data/oxford-3000-words-parts.txt").readlines()
words = set()
for line in oxford_3000:
    words.add(line.split(" ")[0].lower())
print("Common words loaded...")

cmudict = open("src/data/cmudict-0.7b").read()
lines = cmudict.split("\n")
pronunciations = dict()
for line in lines:
    line = line.strip()
    if line.startswith(";;;"):
        continue
    parts = [x for x in line.split(" ") if x != ""]
    if len(parts) < 2:
        continue
    word = parts[0].lower()
    if word not in words:
        continue
    phonemes = parts[1:]
    pronunciations[word] = phonemes
print("Pronunciations processed...")

output = json.dumps(pronunciations, indent=4)
f = open("src/data/cmudict-common.json", "w")
f.write(output)
f.close()
print("Written out to src/data/cmudict-common.json.")
