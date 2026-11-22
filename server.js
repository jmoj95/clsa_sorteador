import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";

const app = express();
const port = 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputFile = path.join(__dirname, "input.txt");
const outputFile = path.join(__dirname, "output.txt");
const shufflerFile = path.join(__dirname, "shuffler.js");

function ensureRuntimeFiles() {
  if (!fs.existsSync(inputFile)) {
    fs.writeFileSync(inputFile, "");
  }
  if (!fs.existsSync(outputFile)) {
    fs.writeFileSync(outputFile, "");
  }
}

ensureRuntimeFiles();

app.use(express.static(path.join(__dirname, "dist")));
app.use(express.json());

function readNames(file) {
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);
}

app.get("/api/candidates", (_request, response) => {
  try {
    ensureRuntimeFiles();
    response.json({ candidates: readNames(inputFile) });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

app.put("/api/candidates", (request, response) => {
  if (!Array.isArray(request.body.candidates)) {
    response.status(400).json({ error: "A lista de candidatos é inválida." });
    return;
  }

  const candidates = request.body.candidates
    .map((name) => String(name).trim())
    .filter(Boolean);

  try {
    fs.writeFileSync(inputFile, candidates.join("\n") + (candidates.length ? "\n" : ""));
    response.json({ candidates });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/shuffle", (_request, response) => {
  execFile(
    process.execPath,
    [shufflerFile, inputFile, outputFile],
    (error, _stdout, stderr) => {
      if (error) {
        response.status(500).json({ error: stderr || error.message });
        return;
      }

      try {
        response.json({ names: readNames(outputFile) });
      } catch (readError) {
        response.status(500).json({ error: readError.message });
      }
    },
  );
});

app.listen(port, () => {
  console.log(`Sorteador rodando em http://localhost:${port}`);
});
