#!/usr/bin/python3
import sys

part_of_speech_tags = [
    "v.",
    "adj.",
    "n.",
    "adv.",
    "det.",
    "pron.",
    "exclaim.",
    "prep.",
    "conj.",
]

input_filename = sys.argv[1]
output_filename = sys.argv[2]
input_file = open(input_filename).read()
print(input_file)
output_file = open(output_filename, "w")
for line in input_file.split("\n"):
    args = line.strip().split(" ", 1)
    if len(args) < 2:
        continue
    word = args[0].strip()
    part_infos = args[1].strip().split(",")
    for part_info in part_infos:
        args = part_info.strip().split(" ", 2)
        part_of_speech = args[0].strip()
        output_file.write(f"{word} {part_of_speech}\n")
output_file.close()
