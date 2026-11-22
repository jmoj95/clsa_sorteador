import { useEffect, useRef, useState } from "react";
import {
  addParticipant,
  clearParticipants,
  closeRaffle,
  deleteRaffle,
  getRaffle,
  removeParticipant,
  restartRaffle,
  setAnonymousRegistration,
  shuffleRaffle,
} from "../services/raffleApi.js";

export function RaffleDetail({ raffleId, isCreatorView, onBack, onError }) {
  const [raffle, setRaffle] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [rollingName, setRollingName] = useState("");
  const reelInterval = useRef(null);
  const revealTimeout = useRef(null);
  const stopTimeout = useRef(null);
  const lastAnimationVersion = useRef(null);

  async function refresh() {
    const data = await getRaffle(raffleId);
    setRaffle(data.raffle);
    setIsCreator(data.isCreator);

    if (
      lastAnimationVersion.current !== null &&
      data.raffle.animation_version !== lastAnimationVersion.current &&
      data.raffle.results
    ) {
      startReel(data.raffle.results, data.raffle.participants);
    }
    lastAnimationVersion.current = data.raffle.animation_version;
  }

  function startReel(results, participants) {
    window.clearInterval(reelInterval.current);
    window.clearTimeout(stopTimeout.current);
    window.clearTimeout(revealTimeout.current);

    let reelIndex = 0;
    const reelNames = [
      ...participants.map((participant) => participant.name),
      ...results,
    ];
    setRollingName(reelNames[0] || results[0] || "");

    reelInterval.current = window.setInterval(() => {
      reelIndex = (reelIndex + 1) % reelNames.length;
      setRollingName(reelNames[reelIndex]);
    }, 90);

    stopTimeout.current = window.setTimeout(() => {
      window.clearInterval(reelInterval.current);
      setRollingName(results[0] || "");
    }, 900);

    revealTimeout.current = window.setTimeout(() => {
      setRollingName("");
    }, 1250);
  }

  useEffect(() => {
    refresh().catch((error) => onError(error.message));
    const intervalId = window.setInterval(() => {
      refresh().catch((error) => onError(error.message));
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
      window.clearInterval(reelInterval.current);
      window.clearTimeout(stopTimeout.current);
      window.clearTimeout(revealTimeout.current);
    };
  }, [raffleId]);

  async function run(action) {
    setLoading(true);
    try {
      await action();
      await refresh();
    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitName(event) {
    event.preventDefault();
    if (!name.trim()) return;
    await run(async () => {
      await addParticipant(raffleId, name.trim());
      setName("");
    });
  }

  async function deleteCurrentRaffle() {
    if (!window.confirm(`Excluir permanentemente o sorteio "${raffle.title}"?`)) return;
    await run(async () => {
      await deleteRaffle(raffleId);
      onBack();
    });
  }

  if (!raffle) {
    return <div className="empty-raffles">Carregando sorteio...</div>;
  }

  const isClosed = raffle.status === "closed";
  const canAdd = !isClosed && (raffle.allow_anonymous || isCreator);

  return (
    <section className="raffle-detail">
      <button type="button" className="back-button" onClick={onBack}>← Todos os sorteios</button>

      <div className="raffle-detail-heading">
        <div>
          <p className="eyebrow">{isClosed ? "Sorteio encerrado" : "Sorteio ativo"}</p>
          <h1>{raffle.title}</h1>
        </div>
        {isCreator && (
          <div className="creator-actions">
            <button
              type="button"
              className="delete-raffle"
              disabled={loading}
              onClick={deleteCurrentRaffle}
            >
              Excluir sorteio
            </button>
            {isClosed ? (
              <button
                type="button"
                className="restart-raffle"
                disabled={loading}
                onClick={() => run(() => restartRaffle(raffleId))}
              >
                Reiniciar sorteio
              </button>
            ) : (
              <>
                <label className="toggle-option">
                  <input
                    type="checkbox"
                    checked={raffle.allow_anonymous}
                    disabled={loading}
                    onChange={(event) =>
                      run(() => setAnonymousRegistration(raffleId, event.target.checked))
                    }
                  />
                  Qualquer usuário pode adicionar nomes
                </label>
                <button
                  type="button"
                  className="clear-candidates"
                  disabled={loading || raffle.participants.length === 0}
                  onClick={() => run(() => clearParticipants(raffleId))}
                >
                  Limpar lista
                </button>
              </>
            )}
            {raffle.draw_count > 0 && !isClosed && (
              <button
                type="button"
                className="close-raffle"
                disabled={loading}
                onClick={() => run(() => closeRaffle(raffleId))}
              >
                Encerrar sorteio
              </button>
            )}
          </div>
        )}
      </div>

      <div className="raffle-grid">
        <article className="panel candidates-panel">
          <header className="panel-header">
            <div>
              <p className="panel-kicker">Lista atual</p>
              <h2>Candidatos</h2>
            </div>
            <span className="count">{raffle.participants.length}</span>
          </header>

          {canAdd && (
            <form className="add-candidate" onSubmit={submitName}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Adicionar candidato"
                aria-label="Nome do candidato"
                required
              />
              <button type="submit" className="add-button" disabled={loading}>+</button>
            </form>
          )}

          <ol className="candidate-list">
            {raffle.participants.map((participant, index) => (
              <li key={participant.id}>
                <span className="candidate-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="candidate-name">{participant.name}</span>
                {isCreator && !isClosed && (
                  <button
                    type="button"
                    className="remove-button"
                    disabled={loading}
                    onClick={() =>
                      run(() => removeParticipant(raffleId, participant.id))
                    }
                    aria-label={`Remover ${participant.name}`}
                  >
                    ×
                  </button>
                )}
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
            {raffle.results && <span className="count complete">Finalizado</span>}
          </header>
          {rollingName ? (
            <div className="empty-state">
              <div className="reel" key={rollingName}>
                <div className="reel-frame">
                  <span className="reel-name">{rollingName}</span>
                </div>
                <p>Escolhendo...</p>
              </div>
            </div>
          ) : raffle.results ? (
            <div className="results">
              <div className="podium">
                {raffle.results.slice(0, 3).map((resultName, index) => (
                  <div className="winner-row" key={resultName}>
                    <span className={`medal medal-${index + 1}`}>{index + 1}</span>
                    <div>
                      <span className="place-label">
                        {index === 0 ? "Vencedor" : `${index + 1}º lugar`}
                      </span>
                      <strong>{resultName}</strong>
                    </div>
                  </div>
                ))}
              </div>
              {raffle.results.length > 3 && (
                <div className="remaining">
                  <p className="remaining-title">Demais posições</p>
                  <ol>
                    {raffle.results.slice(3).map((resultName, index) => (
                      <li key={resultName}>
                        <span>{index + 4}º</span>
                        <strong>{resultName}</strong>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">★</div>
              <p>Aguardando o sorteio</p>
              {isCreator
                ? <span>Use o botão abaixo para sortear a lista.</span>
                : <span>O criador ainda não iniciou o sorteio.</span>}
            </div>
          )}
        </article>
      </div>

      {isCreator && !isClosed && (
        <footer>
          <button
            type="button"
            onClick={() => run(() => shuffleRaffle(raffleId))}
            disabled={loading || raffle.participants.length === 0}
          >
            <span>{loading ? "Sorteando..." : "Realizar sorteio"}</span>
            <span className="arrow">→</span>
          </button>
        </footer>
      )}
    </section>
  );
}
