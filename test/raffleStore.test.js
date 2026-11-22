import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createDatabase } from "../server/database.js";
import { createRaffleStore } from "../server/raffleStore.js";

test("deleteRaffle removes a raffle and its related participants", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "clsa-raffle-store-"));
  const database = createDatabase(path.join(directory, "raffles.sqlite"));
  const store = createRaffleStore(database);
  const raffle = store.createRaffle("Sorteio temporário", "creator@example.com");

  store.addParticipant(raffle.id, "Ana", null);
  assert.equal(store.getRaffle(raffle.id).participants.length, 1);

  store.deleteRaffle(raffle.id);
  assert.equal(store.getRaffle(raffle.id), null);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM participants WHERE raffle_id = ?").get(raffle.id).count, 0);

  database.close();
});
