import { useState } from "react";

export function RaffleList({ raffles, user, onOpen, onCreate }) {
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  async function create(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      await onCreate(title.trim());
      setTitle("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="raffle-list-page">
      <div className="raffle-list-heading">
        <div>
          <p className="eyebrow">CLSA Sorteador</p>
          <h1>Sorteios</h1>
        </div>
        {user?.canCreateRaffles && (
          <form className="create-raffle" onSubmit={create}>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Título do novo sorteio"
              aria-label="Título do novo sorteio"
            />
            <button type="submit" disabled={creating || !title.trim()}>
              {creating ? "Criando..." : "Novo sorteio"}
            </button>
          </form>
        )}
      </div>

      {raffles.length === 0 ? (
        <div className="empty-raffles">
          <div>
            <p>Nenhum sorteio criado ainda.</p>
            {!user && <span>Entre com seu email para criar o primeiro sorteio.</span>}
          </div>
        </div>
      ) : (
        <div className="raffle-cards">
          {raffles.map((raffle) => (
            <button
              type="button"
              className="raffle-card"
              key={raffle.id}
              onClick={() => onOpen(raffle.id)}
            >
              <div>
                <p>{raffle.status === "closed" ? "Encerrado" : "Inscrições abertas"}</p>
                <h2>{raffle.title}</h2>
              </div>
              <span>{raffle.participant_count} candidatos</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
