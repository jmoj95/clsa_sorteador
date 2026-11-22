import fs from "node:fs";
import { randomInt } from "node:crypto";

/**
 * Shuffles an array and returns a new shuffled array.
 * @param {Array} array - The original array to shuffle.
 * @returns {Array} A new array with elements in random order.
 */
function shuffleArray(array) {
  const newArray = [...array];

  // Fisher-Yates Shuffle Algorithm
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }

  return newArray;
}

const inputFile = process.argv[2] || "input.txt";
const outputFile = process.argv[3] || "output.txt";

if (!fs.existsSync(inputFile)) {
  fs.writeFileSync(inputFile, "");
}

let lines;
try {
  lines = fs
    .readFileSync(inputFile, "utf8")
    .split(/\r?\n/)
    .filter(l => l.trim());
} catch {
  console.error(`Cannot read ${inputFile}`);
  process.exit(1);
}

const shuffled = shuffleArray(lines);
fs.writeFileSync(outputFile, shuffled.join("\n") + "\n");
