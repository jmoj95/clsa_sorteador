import { hashToken, normalizeEmail, randomToken } from "./security.js";

function millisecondsAfter(minutes) {
  return Date.now() + minutes * 60_000;
}

export function createAuthStore(database) {
  return {
    async requestMagicLink(email) {
      email = normalizeEmail(email);
      if (!email || !email.includes("@")) throw new Error("Informe um email válido.");

      const token = randomToken();
      database.prepare(`
        INSERT INTO magic_links (token_hash, email, expires_at)
        VALUES (?, ?, ?)
      `).run(hashToken(token), email, millisecondsAfter(15));

      return { email, token };
    },

    verifyMagicLink(token) {
      const tokenHash = hashToken(token);
      const link = database.prepare(`
        SELECT * FROM magic_links
        WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?
      `).get(tokenHash, Date.now());

      if (!link) throw new Error("Link inválido ou expirado.");

      const existing = database.prepare("SELECT * FROM users WHERE email = ?").get(link.email);
      let user;

      if (existing) {
        user = existing;
      } else {
        const result = database.prepare(`
          INSERT INTO users (email, can_create_raffles)
          VALUES (?, 0)
        `).run(link.email);
        user = database.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      }

      this.acceptInvite(link.email);
      if (this.getAdminEmails().has(link.email)) {
        database.prepare("UPDATE users SET can_create_raffles = 1 WHERE email = ?").run(link.email);
        user = database.prepare("SELECT * FROM users WHERE email = ?").get(link.email);
      }

      database.prepare("UPDATE magic_links SET used_at = datetime('now') WHERE id = ?").run(link.id);

      const sessionToken = randomToken();
      database.prepare(`
        INSERT INTO sessions (token_hash, user_id, expires_at)
        VALUES (?, ?, ?)
      `).run(hashToken(sessionToken), user.id, Date.now() + 604800_000);

      return { sessionToken, user };
    },

    getSession(sessionToken) {
      if (!sessionToken) return null;
      const row = database.prepare(`
        SELECT users.*
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = ? AND sessions.expires_at > ?
      `).get(hashToken(sessionToken), Date.now());
      return row || null;
    },

    logout(sessionToken) {
      if (!sessionToken) return;
      database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(sessionToken));
    },

    getAdminEmails() {
      const value = process.env.ADMIN_EMAILS || process.env.BOOTSTRAP_ADMIN_EMAIL || "";
      return new Set(value.split(",").map(normalizeEmail).filter(Boolean));
    },

    isAdmin(email) {
      return this.getAdminEmails().has(normalizeEmail(email));
    },

    canCreateRaffles(email) {
      email = normalizeEmail(email);
      if (!email) return false;

      const user = database.prepare(
        "SELECT id FROM users WHERE email = ?",
      ).get(email);
      return Boolean(user);
    },

    acceptInvite(email) {
      email = normalizeEmail(email);
      const invite = database.prepare(`
        SELECT * FROM invites
        WHERE email = ? AND accepted_at IS NULL AND expires_at > ?
      `).get(email, Date.now());
      if (!invite) return;

      database.prepare("UPDATE invites SET accepted_at = datetime('now') WHERE id = ?").run(invite.id);
      database.prepare(`
        INSERT INTO users (email, can_create_raffles)
        VALUES (?, 1)
        ON CONFLICT(email) DO UPDATE SET can_create_raffles = 1
      `).run(email);
    },

    createInvite(email, createdBy) {
      email = normalizeEmail(email);
      if (!email || !email.includes("@")) throw new Error("Informe um email válido.");

      database.prepare(`
        INSERT INTO invites (email, created_by, expires_at)
        VALUES (?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          created_by = excluded.created_by,
          expires_at = excluded.expires_at,
          accepted_at = NULL
      `).run(email, normalizeEmail(createdBy), millisecondsAfter(1440));
    },
  };
}
