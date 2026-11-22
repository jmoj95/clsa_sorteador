import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabase } from "./server/database.js";
import { createAuthStore } from "./server/authStore.js";
import { createRaffleStore } from "./server/raffleStore.js";
import { createAuthRoutes } from "./server/routes/authRoutes.js";
import { createRaffleRoutes } from "./server/routes/raffleRoutes.js";
import { createGmailOAuth } from "./server/gmailOAuth.js";

const port = Number(process.env.PORT || 3001);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appUrl = process.env.APP_URL || `http://localhost:${port}`;

const database = createDatabase(path.join(__dirname, "data", "raffles.sqlite"));
const authStore = createAuthStore(database);
const raffleStore = createRaffleStore(database);
const gmailOAuth = createGmailOAuth({ projectRoot: __dirname, appUrl });

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));
app.use("/api/auth", createAuthRoutes({ authStore, appUrl, gmailOAuth }));
app.use("/api/raffles", createRaffleRoutes({ database, authStore, raffleStore }));

app.use((request, response, next) => {
  if (request.method !== "GET" || !request.accepts("html")) {
    next();
    return;
  }
  response.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`CLSA Sorteador rodando em http://localhost:${port}`);
});
