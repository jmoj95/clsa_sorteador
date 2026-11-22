import { Router } from "express";
import { ensureRuntimeFiles, readNames, writeNames } from "../fileStore.js";

export function createCandidatesRouter({ inputFile, outputFile }) {
  const router = Router();

  router.get("/", (_request, response) => {
    try {
      ensureRuntimeFiles(inputFile, outputFile);
      response.json({ candidates: readNames(inputFile) });
    } catch (error) {
      response.status(500).json({ error: error.message });
    }
  });

  router.put("/", (request, response) => {
    if (!Array.isArray(request.body.candidates)) {
      response.status(400).json({ error: "A lista de candidatos é inválida." });
      return;
    }

    const candidates = request.body.candidates
      .map((name) => String(name).trim())
      .filter(Boolean);

    try {
      ensureRuntimeFiles(inputFile, outputFile);
      writeNames(inputFile, candidates);
      response.json({ candidates });
    } catch (error) {
      response.status(500).json({ error: error.message });
    }
  });

  return router;
}
