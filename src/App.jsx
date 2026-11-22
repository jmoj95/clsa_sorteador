import { useEffect, useState } from "react";
import { AuthPanel } from "./components/AuthPanel.jsx";
import { BrandHeader } from "./components/BrandHeader.jsx";
import { RaffleDetail } from "./components/RaffleDetail.jsx";
import { RaffleList } from "./components/RaffleList.jsx";
import {
  createRaffle,
  getRaffles,
  getSession,
  logout,
  requestMagicLink,
} from "./services/raffleApi.js";

function getRaffleIdFromHash() {
  const match = window.location.hash.match(/^#\/raffle\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function App() {
  const [user, setUser] = useState(null);
  const [raffles, setRaffles] = useState([]);
  const [raffleId, setRaffleId] = useState(getRaffleIdFromHash());
  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const [session, raffleList] = await Promise.all([getSession(), getRaffles()]);
    setUser(session.user);
    setRaffles(raffleList.raffles);
  }

  useEffect(() => {
    refresh().catch((requestError) => setError(requestError.message));

    const refreshInterval = window.setInterval(() => {
      refresh().catch((requestError) => setError(requestError.message));
    }, 2000);

    function handleHashChange() {
      setRaffleId(getRaffleIdFromHash());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  function openRaffle(id) {
    window.location.hash = `/raffle/${id}`;
  }

  async function createNewRaffle(title) {
    try {
      const data = await createRaffle(title);
      await refresh();
      openRaffle(data.raffle.id);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function requestLogin(email) {
    return requestMagicLink(email);
  }

  async function logoutUser() {
    await logout();
    await refresh();
    setAuthOpen(false);
  }

  return (
    <main className="page">
      <header className="app-header">
        <BrandHeader />
        <button type="button" className="login-button" onClick={() => setAuthOpen(true)}>
          {user ? user.email : "Entrar"}
        </button>
      </header>

      {raffleId ? (
        <RaffleDetail
          raffleId={raffleId}
          onBack={() => {
            window.location.hash = "";
            refresh();
          }}
          onError={setError}
        />
      ) : (
        <RaffleList
          raffles={raffles}
          user={user}
          onOpen={openRaffle}
          onCreate={createNewRaffle}
        />
      )}

      {error && <div className="error">{error}</div>}

      <AuthPanel
        open={authOpen}
        user={user}
        onClose={() => setAuthOpen(false)}
        onLoginRequested={requestLogin}
        onLogout={logoutUser}
      />
    </main>
  );
}
