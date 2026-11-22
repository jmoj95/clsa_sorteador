import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCandidatesRouter } from "./server/routes/candidates.js";
import { createShuffleRouter } from "./server/routes/shuffle.js";
import { ensureRuntimeFiles } from "./server/fileStore.js";

const port = Number(process.env.PORT || 3001);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputFile = path.join(__dirname, "input.txt");
const outputFile = path.join(__dirname, "output.txt");

ensureRuntimeFiles(inputFile, outputFile);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));
app.use("/api/candidates", createCandidatesRouter({ inputFile, outputFile }));
app.use("/api/shuffle", createShuffleRouter({ inputFile, outputFile }));

app.listen(port, () => {
  console.log(`Sorteador rodando em http://localhost:${port}`);
});
