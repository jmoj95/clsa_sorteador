import { useEffect, useState } from "react";

export function AuthPanel({ open, user, onClose, onLoginRequested, onLogout }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [devLink, setDevLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [gmailStatus, setGmailStatus] = useState(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/auth/gmail/status")
      .then((response) => response.json())
      .then((data) => setGmailStatus(data.gmail))
      .catch(() => setGmailStatus(null));
  }, [open]);

  if (!open) return null;

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setDevLink("");

    try {
      const response = await onLoginRequested(email);
      if (response.devLink) {
        setMessage("SMTP não configurado. Modo local: clique no link abaixo.");
        setDevLink(response.devLink);
      } else {
        setMessage("Enviamos um link de acesso para seu email.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">×</button>
        {user ? (
          <>
            <p className="panel-kicker">Conta conectada</p>
            <h2 id="auth-title">{user.email}</h2>
            {gmailStatus && (
              <div className="gmail-status">
                <span>
                  Gmail: {gmailStatus.connected
                    ? "conectado"
                    : gmailStatus.configured
                      ? "não autorizado"
                      : "não configurado"}
                </span>
                {!gmailStatus.connected && gmailStatus.configured && (
                  <a className="gmail-connect" href="/api/auth/gmail/authorize">
                    Conectar Gmail
                  </a>
                )}
              </div>
            )}
            <button type="button" className="secondary-button" onClick={onLogout}>Sair</button>
          </>
        ) : (
          <>
            <p className="panel-kicker">Acesso seguro</p>
            <h2 id="auth-title">Entrar por email</h2>
            <form className="auth-form" onSubmit={submit}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@exemplo.com"
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de acesso"}
              </button>
            </form>
            {message && (
              <div className={devLink ? "auth-link" : "auth-message"}>
                {devLink ? <a href={devLink}>Abrir link de acesso</a> : message}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
