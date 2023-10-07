#!/usr/bin/python3

import json

input_file = "src/data/oxford-3000-words-parts.txt"
output_file = "src/data/oxford-3000-words-parts.json"

print(f"Reading from {input_file}")
parts = dict()
word_parts = open(input_file).readlines()
for line in word_parts:
    line_parts = line.split()
    word = line_parts[0].lower()
    part = line_parts[1]
    if word in parts:
        parts[word].append(part)
    else:
        parts[word] = [part]

output = json.dumps(parts, indent=4)
f = open(output_file, "w")
f.write(output)
f.close()
print(f"Wrote output to {output_file}")
