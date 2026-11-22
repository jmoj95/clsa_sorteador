import { BrandHeader } from "./components/BrandHeader.jsx";
import { CandidatePanel } from "./components/CandidatePanel.jsx";
import { ResultsPanel } from "./components/ResultsPanel.jsx";
import { useCandidates } from "./hooks/useCandidates.js";
import { useShuffleAnimation } from "./hooks/useShuffleAnimation.js";

export function App() {
  const candidateState = useCandidates();
  const shuffleState = useShuffleAnimation(candidateState.candidates);
  const error = candidateState.error || shuffleState.error;

  return (
    <main className="page">
      <BrandHeader loading={shuffleState.loading} results={shuffleState.results} />

      <section className="hero">
        <p className="eyebrow">Resultado oficial</p>
        <h1>Sorteio</h1>
      </section>

      <section className="grid">
        <CandidatePanel
          candidates={candidateState.candidates}
          saveCandidates={candidateState.saveCandidates}
          setError={candidateState.setError}
        />
        <ResultsPanel
          results={shuffleState.results}
          rollingName={shuffleState.rollingName}
        />
      </section>

      {error && <div className="error">{error}</div>}

      <footer>
        <button
          type="button"
          onClick={shuffleState.runShuffle}
          disabled={shuffleState.loading || candidateState.candidates.length === 0}
        >
          <span>{shuffleState.loading ? "Sorteando..." : "Realizar sorteio"}</span>
          <span className="arrow">→</span>
        </button>
      </footer>
    </main>
  );
}
