import { randomToken } from "./security.js";
import { shuffleArray } from "../shuffler.js";

export function createRaffleStore(database) {
  return {
    listRaffles() {
      return database.prepare(`
        SELECT r.*,
          (SELECT COUNT(*) FROM participants p WHERE p.raffle_id = r.id) AS participant_count,
          dr.names_json
        FROM raffles r
        LEFT JOIN draw_results dr ON dr.raffle_id = r.id
        ORDER BY r.created_at DESC
      `).all().map((raffle) => ({
        ...raffle,
        allow_anonymous: Boolean(raffle.allow_anonymous),
        results: raffle.names_json ? JSON.parse(raffle.names_json) : null,
      }));
    },

    getRaffle(id) {
      const raffle = database.prepare(`
        SELECT r.*,
          dr.names_json
        FROM raffles r
        LEFT JOIN draw_results dr ON dr.raffle_id = r.id
        WHERE r.id = ?
      `).get(id);
      if (!raffle) return null;

      const participants = database.prepare(`
        SELECT id, name, added_by_user_id, created_at
        FROM participants
        WHERE raffle_id = ?
        ORDER BY id
      `).all(id);

      return {
        ...raffle,
        allow_anonymous: Boolean(raffle.allow_anonymous),
        participants,
        results: raffle.names_json ? JSON.parse(raffle.names_json) : null,
      };
    },

    createRaffle(title, creatorEmail) {
      const id = randomToken(12);
      database.prepare(`
        INSERT INTO raffles (id, title, creator_email)
        VALUES (?, ?, ?)
      `).run(id, String(title).trim(), creatorEmail);
      return this.getRaffle(id);
    },

    setAllowAnonymous(id, allowAnonymous) {
      database.prepare(`
        UPDATE raffles SET allow_anonymous = ? WHERE id = ?
      `).run(allowAnonymous ? 1 : 0, id);
    },

    addParticipant(id, name, userId) {
      const normalizedName = String(name).trim();
      if (!normalizedName) throw new Error("Informe o nome do participante.");

      try {
        database.prepare(`
          INSERT INTO participants (raffle_id, name, added_by_user_id)
          VALUES (?, ?, ?)
        `).run(id, normalizedName, userId || null);
      } catch (error) {
        if (String(error.message).includes("UNIQUE")) {
          throw new Error("Esse participante já está na lista.");
        }
        throw error;
      }
    },

    removeParticipant(id, participantId) {
      database.prepare(`
        DELETE FROM participants
        WHERE raffle_id = ? AND id = ?
      `).run(id, participantId);
    },

    clearParticipants(id) {
      database.prepare("DELETE FROM participants WHERE raffle_id = ?").run(id);
    },

    draw(id) {
      const raffle = database.prepare("SELECT * FROM raffles WHERE id = ?").get(id);
      if (!raffle) throw new Error("Sorteio não encontrado.");
      if (raffle.status !== "open") throw new Error("O sorteio já foi encerrado.");

      const participants = database.prepare(`
        SELECT name FROM participants WHERE raffle_id = ? ORDER BY id
      `).all(id).map((participant) => participant.name);
      if (!participants.length) throw new Error("Adicione pelo menos um participante.");

      const names = shuffleArray(participants);
      database.prepare(`
        INSERT INTO draw_results (raffle_id, names_json)
        VALUES (?, ?)
        ON CONFLICT(raffle_id) DO UPDATE SET
          names_json = excluded.names_json,
          drawn_at = datetime('now')
      `).run(id, JSON.stringify(names));
      database.prepare(`
        UPDATE raffles
        SET draw_count = draw_count + 1,
            animation_version = animation_version + 1
        WHERE id = ?
      `).run(id);
      return names;
    },

    close(id) {
      const raffle = database.prepare("SELECT * FROM raffles WHERE id = ?").get(id);
      if (!raffle) throw new Error("Sorteio não encontrado.");
      if (raffle.draw_count < 1) throw new Error("Efetue pelo menos um sorteio antes de encerrar.");

      database.prepare(`
        UPDATE raffles
        SET status = 'closed', closed_at = datetime('now')
        WHERE id = ?
      `).run(id);
    },

    restart(id) {
      const raffle = database.prepare("SELECT * FROM raffles WHERE id = ?").get(id);
      if (!raffle) throw new Error("Sorteio não encontrado.");
      if (raffle.status !== "closed") throw new Error("Somente sorteios encerrados podem ser reiniciados.");

      database.prepare("DELETE FROM draw_results WHERE raffle_id = ?").run(id);
      database.prepare(`
        UPDATE raffles
        SET status = 'open',
            closed_at = NULL,
            draw_count = 0,
            animation_version = 0
        WHERE id = ?
      `).run(id);
    },

    deleteRaffle(id) {
      const raffle = database.prepare("SELECT id FROM raffles WHERE id = ?").get(id);
      if (!raffle) throw new Error("Sorteio não encontrado.");
      database.prepare("DELETE FROM raffles WHERE id = ?").run(id);
    },
  };
}
