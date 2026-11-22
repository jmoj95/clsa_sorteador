import fs from "node:fs";
import path from "node:path";
import { randomInt } from "node:crypto";
import { pathToFileURL } from "node:url";

export function shuffleArray(array) {
  const shuffled = [...array];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(0, index + 1);
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export function readNames(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function writeNames(filePath, names) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, names.length ? `${names.join("\n")}\n` : "");
}

export function shuffleFile(inputFile, outputFile) {
  if (!fs.existsSync(inputFile)) {
    writeNames(inputFile, []);
  }

  const shuffled = shuffleArray(readNames(inputFile));
  writeNames(outputFile, shuffled);
  return shuffled;
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  const inputFile = process.argv[2] || "input.txt";
  const outputFile = process.argv[3] || "output.txt";

  try {
    shuffleFile(inputFile, outputFile);
  } catch (error) {
    console.error(`Cannot shuffle ${inputFile}: ${error.message}`);
    process.exitCode = 1;
  }
}
