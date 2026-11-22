async function request(url, options) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Não foi possível concluir a ação.");
  return body;
}

export function getSession() {
  return request("/api/auth/me");
}

export function requestMagicLink(email) {
  return request("/api/auth/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

export function getRaffles() {
  return request("/api/raffles");
}

export function getRaffle(id) {
  return request(`/api/raffles/${encodeURIComponent(id)}`);
}

export function createRaffle(title) {
  return request("/api/raffles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
}

export function setAnonymousRegistration(id, allowAnonymous) {
  return request(`/api/raffles/${encodeURIComponent(id)}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ allowAnonymous }),
  });
}

export function addParticipant(id, name) {
  return request(`/api/raffles/${encodeURIComponent(id)}/participants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function removeParticipant(id, participantId) {
  return request(`/api/raffles/${encodeURIComponent(id)}/participants/${participantId}`, {
    method: "DELETE",
  });
}

export function clearParticipants(id) {
  return request(`/api/raffles/${encodeURIComponent(id)}/participants`, {
    method: "DELETE",
  });
}

export function shuffleRaffle(id) {
  return request(`/api/raffles/${encodeURIComponent(id)}/shuffle`, {
    method: "POST",
  });
}

export function closeRaffle(id) {
  return request(`/api/raffles/${encodeURIComponent(id)}/close`, {
    method: "POST",
  });
}

export function restartRaffle(id) {
  return request(`/api/raffles/${encodeURIComponent(id)}/restart`, {
    method: "POST",
  });
}

export function deleteRaffle(id) {
  return request(`/api/raffles/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
