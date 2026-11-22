import fs from "node:fs";

export function ensureRuntimeFiles(inputFile, outputFile) {
  if (!fs.existsSync(inputFile)) fs.writeFileSync(inputFile, "");
  if (!fs.existsSync(outputFile)) fs.writeFileSync(outputFile, "");
}

export function readNames(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function writeNames(filePath, names) {
  fs.writeFileSync(filePath, names.length ? `${names.join("\n")}\n` : "");
}
