import { Router } from "express";
import { shuffleFile } from "../../shuffler.js";
import { ensureRuntimeFiles } from "../fileStore.js";

export function createShuffleRouter({ inputFile, outputFile }) {
  const router = Router();
  let isShuffling = false;

  router.post("/", (_request, response) => {
    if (isShuffling) {
      response.status(409).json({ error: "Um sorteio já está em andamento." });
      return;
    }

    isShuffling = true;

    try {
      ensureRuntimeFiles(inputFile, outputFile);
      const names = shuffleFile(inputFile, outputFile);
      response.json({ names });
    } catch (error) {
      response.status(500).json({ error: error.message });
    } finally {
      isShuffling = false;
    }
  });

  return router;
}
