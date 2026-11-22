import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export function createDatabase(databasePath) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);

  database.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      can_create_raffles INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      created_by TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      accepted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS magic_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS raffles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      creator_email TEXT NOT NULL,
      allow_anonymous INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'open',
      draw_count INTEGER NOT NULL DEFAULT 0,
      animation_version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      closed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raffle_id TEXT NOT NULL,
      name TEXT NOT NULL,
      added_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(raffle_id, name),
      FOREIGN KEY (raffle_id) REFERENCES raffles(id) ON DELETE CASCADE,
      FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS draw_results (
      raffle_id TEXT PRIMARY KEY,
      names_json TEXT NOT NULL,
      drawn_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (raffle_id) REFERENCES raffles(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_participants_raffle ON participants(raffle_id);
  `);

  const raffleColumns = database.prepare("PRAGMA table_info(raffles)").all();
  if (!raffleColumns.some((column) => column.name === "animation_version")) {
    database.exec("ALTER TABLE raffles ADD COLUMN animation_version INTEGER NOT NULL DEFAULT 0");
  }

  return database;
}
