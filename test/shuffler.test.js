import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readNames, shuffleArray, shuffleFile } from "../shuffler.js";

test("shuffleArray keeps all names without changing the source array", () => {
  const names = ["Ana", "Bruno", "Carlos"];
  const shuffled = shuffleArray(names);

  assert.deepEqual([...shuffled].sort(), [...names].sort());
  assert.deepEqual(names, ["Ana", "Bruno", "Carlos"]);
});

test("shuffleFile creates output and reads trimmed names", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "clsa-"));
  const inputFile = path.join(directory, "input.txt");
  const outputFile = path.join(directory, "output.txt");

  fs.writeFileSync(inputFile, " Ana \n\nBruno\nCarlos\n");
  const shuffled = shuffleFile(inputFile, outputFile);

  assert.deepEqual([...shuffled].sort(), ["Ana", "Bruno", "Carlos"]);
  assert.deepEqual(readNames(outputFile).sort(), ["Ana", "Bruno", "Carlos"]);
});
