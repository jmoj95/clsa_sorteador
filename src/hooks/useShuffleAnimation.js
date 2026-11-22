import { useEffect, useRef, useState } from "react";
import { runShuffleRequest } from "../services/candidateApi.js";

export function useShuffleAnimation(candidates) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [rollingName, setRollingName] = useState("");
  const [error, setError] = useState("");
  const reelInterval = useRef(null);
  const stopTimeout = useRef(null);
  const revealTimeout = useRef(null);

  useEffect(() => {
    return () => {
      window.clearInterval(reelInterval.current);
      window.clearTimeout(stopTimeout.current);
      window.clearTimeout(revealTimeout.current);
    };
  }, []);

  async function runShuffle() {
    if (loading) return;

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const names = await runShuffleRequest();
      let reelIndex = 0;
      const reelNames = [...candidates, ...names];
      setRollingName(reelNames[0] ?? "");

      reelInterval.current = window.setInterval(() => {
        reelIndex = (reelIndex + 1) % reelNames.length;
        setRollingName(reelNames[reelIndex]);
      }, 90);

      stopTimeout.current = window.setTimeout(() => {
        window.clearInterval(reelInterval.current);
        setRollingName(names[0] ?? "");
      }, 900);

      revealTimeout.current = window.setTimeout(() => {
        setRollingName("");
        setResults(names);
        setLoading(false);
      }, 1250);
    } catch (requestError) {
      setError(requestError.message);
      setLoading(false);
    }
  }

  return { loading, results, rollingName, error, setError, runShuffle };
}
