export async function getCandidates() {
  const response = await fetch("/api/candidates");
  if (!response.ok) throw new Error("Não foi possível atualizar a lista.");
  const data = await response.json();
  return data.candidates;
}

export async function updateCandidates(candidates) {
  const response = await fetch("/api/candidates", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidates }),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error || "Não foi possível atualizar a lista.");
  }

  const data = await response.json();
  return data.candidates;
}

export async function runShuffleRequest() {
  const response = await fetch("/api/shuffle", { method: "POST" });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error || "Não foi possível realizar o sorteio.");
  }

  const data = await response.json();
  return data.names;
}
