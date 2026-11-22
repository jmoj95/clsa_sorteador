import { useEffect, useState } from "react";
import { getCandidates, updateCandidates } from "../services/candidateApi.js";

export function useCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCandidates() {
      try {
        setCandidates(await getCandidates());
        setError("");
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    loadCandidates();
    const intervalId = window.setInterval(loadCandidates, 2000);
    return () => window.clearInterval(intervalId);
  }, []);

  async function saveCandidates(nextCandidates) {
    try {
      setCandidates(await updateCandidates(nextCandidates));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return { candidates, error, setError, saveCandidates };
}
