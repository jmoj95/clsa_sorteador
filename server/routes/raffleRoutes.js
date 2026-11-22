import { Router } from "express";
import { parseCookies } from "../security.js";

export function createRaffleRoutes({ database, authStore, raffleStore }) {
  const router = Router();

  function getSession(request) {
    const cookies = parseCookies(request.headers.cookie);
    return authStore.getSession(cookies.clsa_session);
  }

  function requireCreator(request, response, raffle) {
    const user = getSession(request);
    if (!user) {
      response.status(401).json({ error: "Faça login para continuar." });
      return null;
    }
    if (raffle.creator_email !== user.email && !authStore.isAdmin(user.email)) {
      response.status(403).json({ error: "Somente o criador deste sorteio pode realizar esta ação." });
      return null;
    }
    return user;
  }

  router.get("/", (_request, response) => {
    response.json({ raffles: raffleStore.listRaffles() });
  });

  router.post("/", (request, response) => {
    const user = getSession(request);
    if (!user) {
      response.status(401).json({ error: "Faça login para criar um sorteio." });
      return;
    }
    if (!authStore.canCreateRaffles(user.email)) {
      response.status(403).json({ error: "Você precisa ser convidado para criar sorteios." });
      return;
    }

    const title = String(request.body.title || "").trim();
    if (!title) {
      response.status(400).json({ error: "Informe um título para o sorteio." });
      return;
    }

    response.status(201).json({ raffle: raffleStore.createRaffle(title, user.email) });
  });

  router.get("/:id", (request, response) => {
    const raffle = raffleStore.getRaffle(request.params.id);
    if (!raffle) {
      response.status(404).json({ error: "Sorteio não encontrado." });
      return;
    }
    const user = getSession(request);
    const isAdmin = Boolean(user && authStore.isAdmin(user.email));
    response.json({
      raffle,
      isCreator: Boolean(
        user &&
        (user.email === raffle.creator_email || isAdmin)
      ),
      isAdmin,
    });
  });

  router.put("/:id/settings", (request, response) => {
    const raffle = raffleStore.getRaffle(request.params.id);
    if (!raffle) {
      response.status(404).json({ error: "Sorteio não encontrado." });
      return;
    }
    if (!requireCreator(request, response, raffle)) return;
    if (raffle.status === "closed") {
      response.status(409).json({ error: "O sorteio já foi encerrado." });
      return;
    }
    if (typeof request.body.allowAnonymous !== "boolean") {
      response.status(400).json({ error: "Configuração inválida." });
      return;
    }

    raffleStore.setAllowAnonymous(request.params.id, request.body.allowAnonymous);
    response.json({ raffle: raffleStore.getRaffle(request.params.id) });
  });

  router.post("/:id/participants", (request, response) => {
    const raffle = raffleStore.getRaffle(request.params.id);
    if (!raffle) {
      response.status(404).json({ error: "Sorteio não encontrado." });
      return;
    }
    if (raffle.status !== "open") {
      response.status(409).json({ error: "As inscrições para este sorteio foram encerradas." });
      return;
    }

    const user = getSession(request);
    if (!raffle.allow_anonymous && !user) {
      response.status(401).json({ error: "Faça login para adicionar seu nome." });
      return;
    }

    try {
      raffleStore.addParticipant(request.params.id, request.body.name, user?.id);
      response.status(201).json({ raffle: raffleStore.getRaffle(request.params.id) });
    } catch (error) {
      response.status(400).json({ error: error.message });
    }
  });

  router.delete("/:id/participants/:participantId", (request, response) => {
    const raffle = raffleStore.getRaffle(request.params.id);
    if (!raffle) {
      response.status(404).json({ error: "Sorteio não encontrado." });
      return;
    }
    if (!requireCreator(request, response, raffle)) return;
    if (raffle.status !== "open") {
      response.status(409).json({ error: "O sorteio já foi encerrado." });
      return;
    }

    raffleStore.removeParticipant(request.params.id, Number(request.params.participantId));
    response.json({ raffle: raffleStore.getRaffle(request.params.id) });
  });

  router.delete("/:id/participants", (request, response) => {
    const raffle = raffleStore.getRaffle(request.params.id);
    if (!raffle) {
      response.status(404).json({ error: "Sorteio não encontrado." });
      return;
    }
    if (!requireCreator(request, response, raffle)) return;
    if (raffle.status !== "open") {
      response.status(409).json({ error: "O sorteio já foi encerrado." });
      return;
    }

    raffleStore.clearParticipants(request.params.id);
    response.json({ raffle: raffleStore.getRaffle(request.params.id) });
  });

  router.post("/:id/shuffle", (request, response) => {
    const raffle = raffleStore.getRaffle(request.params.id);
    if (!raffle) {
      response.status(404).json({ error: "Sorteio não encontrado." });
      return;
    }
    if (!requireCreator(request, response, raffle)) return;

    try {
      const names = raffleStore.draw(request.params.id);
      response.json({ names, raffle: raffleStore.getRaffle(request.params.id) });
    } catch (error) {
      response.status(400).json({ error: error.message });
    }
  });

  router.post("/:id/close", (request, response) => {
    const raffle = raffleStore.getRaffle(request.params.id);
    if (!raffle) {
      response.status(404).json({ error: "Sorteio não encontrado." });
      return;
    }
    if (!requireCreator(request, response, raffle)) return;

    try {
      raffleStore.close(request.params.id);
      response.json({ raffle: raffleStore.getRaffle(request.params.id) });
    } catch (error) {
      response.status(400).json({ error: error.message });
    }
  });

  router.post("/:id/restart", (request, response) => {
    const raffle = raffleStore.getRaffle(request.params.id);
    if (!raffle) {
      response.status(404).json({ error: "Sorteio não encontrado." });
      return;
    }
    if (!requireCreator(request, response, raffle)) return;

    try {
      raffleStore.restart(request.params.id);
      response.json({ raffle: raffleStore.getRaffle(request.params.id) });
    } catch (error) {
      response.status(400).json({ error: error.message });
    }
  });

  router.delete("/:id", (request, response) => {
    const raffle = raffleStore.getRaffle(request.params.id);
    if (!raffle) {
      response.status(404).json({ error: "Sorteio não encontrado." });
      return;
    }
    if (!requireCreator(request, response, raffle)) return;

    try {
      raffleStore.deleteRaffle(request.params.id);
      response.json({ deleted: true });
    } catch (error) {
      response.status(400).json({ error: error.message });
    }
  });

  return router;
}
