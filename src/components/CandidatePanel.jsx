import { useState } from "react";

export function CandidatePanel({ candidates, saveCandidates, setError }) {
  const [newName, setNewName] = useState("");

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

  function clearCandidates() {
    if (candidates.length === 0) return;
    saveCandidates([]);
  }

  return (
    <article className="panel candidates-panel">
      <header className="panel-header">
        <div>
          <p className="panel-kicker">Lista atual</p>
          <h2>Candidatos</h2>
        </div>
        <div className="candidate-actions">
          <button
            type="button"
            className="clear-candidates"
            onClick={clearCandidates}
            disabled={candidates.length === 0}
          >
            Limpar lista
          </button>
          <span className="count">{candidates.length}</span>
        </div>
      </header>

      <form className="add-candidate" onSubmit={addCandidate}>
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Adicionar candidato"
          aria-label="Nome do candidato"
        />
        <button type="submit" className="add-button" aria-label="Adicionar candidato">+</button>
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
  );
}
