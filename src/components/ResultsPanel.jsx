import { Medal } from "./Medal.jsx";

export function ResultsPanel({ results, rollingName }) {
  const podium = results?.slice(0, 3) ?? [];
  const remaining = results?.slice(3) ?? [];

  return (
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
  );
}
