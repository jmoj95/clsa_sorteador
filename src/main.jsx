import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import aveMariaMonogram from "./assets/ave-maria-monogram.svg";

function Medal({ place }) {
  return (
    <span className={`medal medal-${place}`} aria-hidden="true">
      {place}
    </span>
  );
}

function App() {
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [rollingName, setRollingName] = useState("");

  useEffect(() => {
    async function loadCandidates() {
      try {
        const response = await fetch("/api/candidates");
        if (!response.ok) throw new Error("Não foi possível atualizar a lista.");
        const data = await response.json();
        setCandidates(data.candidates);
        setError("");
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    loadCandidates();
    const intervalId = window.setInterval(loadCandidates, 2000);
    return () => window.clearInterval(intervalId);
  }, []);

  async function runShuffle() {
    if (loading) return;

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await fetch("/api/shuffle", { method: "POST" });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Não foi possível realizar o sorteio.");
      }
      const data = await response.json();
      const names = data.names;

      let reelIndex = 0;
      const reelNames = [...candidates, ...names];
      setRollingName(reelNames[0] ?? "");

      const reelInterval = window.setInterval(() => {
        reelIndex = (reelIndex + 1) % reelNames.length;
        setRollingName(reelNames[reelIndex]);
      }, 90);

      window.setTimeout(() => {
        window.clearInterval(reelInterval);
        setRollingName(names[0] ?? "");
      }, 900);

      window.setTimeout(() => {
        setRollingName("");
        setResults(names);
        setLoading(false);
      }, 1250);
    } catch (requestError) {
      setError(requestError.message);
      setLoading(false);
    }
  }

  async function saveCandidates(nextCandidates) {
    try {
      const response = await fetch("/api/candidates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: nextCandidates }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Não foi possível atualizar a lista.");
      }
      const data = await response.json();
      setCandidates(data.candidates);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function addCandidate(event) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (candidates.some((candidate) => candidate.toLowerCase() === name.toLowerCase())) {
      setError("Esse candidato já está na lista.");
      return;
    }
    saveCandidates([...candidates, name]);
    setNewName("");
  }

  function removeCandidate(name) {
    saveCandidates(candidates.filter((candidate) => candidate !== name));
  }

  const podium = results?.slice(0, 3) ?? [];
  const remaining = results?.slice(3) ?? [];

  return (
    <main className="page">
      <div className="topbar">
        <div className="brand">
          <img
            className="brand-monogram"
            src={aveMariaMonogram}
            alt="Monograma Ave Maria"
          />
          <span>CLSA</span>
          <span className="brand-cross" aria-label="Cruzeiro do Clube de Literatura Santo Agostinho">✝</span>
        </div>
        <div className="status">
          <span className="status-dot" />
          {loading
            ? "Sorteando..."
            : results
              ? "Sorteio concluído"
              : "Pronto para sortear"}
        </div>
      </div>

      <section className="hero">
        <p className="eyebrow">Resultado oficial</p>
        <h1>Sorteio</h1>
      </section>

      <section className="grid">
        <article className="panel candidates-panel">
          <header className="panel-header">
            <div>
              <p className="panel-kicker">Lista atual</p>
              <h2>Candidatos</h2>
            </div>
            <span className="count">{candidates.length}</span>
          </header>

          <form className="add-candidate" onSubmit={addCandidate}>
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Adicionar candidato"
              aria-label="Nome do candidato"
            />
            <button type="submit" className="add-button" aria-label="Adicionar candidato">
              +
            </button>
          </form>

          <ol className="candidate-list">
            {candidates.map((name, index) => (
              <li key={`${name}-${index}`}>
                <span className="candidate-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="candidate-name">{name}</span>
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => removeCandidate(name)}
                  aria-label={`Remover ${name}`}
                  title={`Remover ${name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
        </article>

        <article className="panel results-panel">
          <header className="panel-header">
            <div>
              <p className="panel-kicker">Ordem sorteada</p>
              <h2>Resultado</h2>
            </div>
            {results && <span className="count complete">Finalizado</span>}
          </header>

          {!results ? (
            <div className="empty-state">
              {rollingName ? (
                <div className="reel" key={rollingName}>
                  <div className="reel-frame">
                    <span className="reel-name">{rollingName}</span>
                  </div>
                  <p>Escolhendo...</p>
                </div>
              ) : (
                <>
                  <div className="empty-icon">★</div>
                  <p>Aguardando o sorteio</p>
                  <span>Pressione o botão para sortear a lista.</span>
                </>
              )}
            </div>
          ) : (
            <div className="results">
              <div className="podium">
                {podium.map((name, index) => (
                  <div className="winner-row" key={name}>
                    <Medal place={index + 1} />
                    <div>
                      <span className="place-label">
                        {index === 0 ? "Vencedor" : `${index + 1}º lugar`}
                      </span>
                      <strong>{name}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {remaining.length > 0 && (
                <div className="remaining">
                  <p className="remaining-title">Demais posições</p>
                  <ol>
                    {remaining.map((name, index) => (
                      <li key={name}>
                        <span>{index + 4}º</span>
                        <strong>{name}</strong>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </article>
      </section>

      {error && <div className="error">{error}</div>}

      <footer>
        <button type="button" onClick={runShuffle} disabled={loading || candidates.length === 0}>
          <span>{loading ? "Sorteando..." : "Realizar sorteio"}</span>
          <span className="arrow">→</span>
        </button>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
