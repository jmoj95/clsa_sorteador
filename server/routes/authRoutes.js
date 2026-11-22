import { Router } from "express";
import nodemailer from "nodemailer";
import { randomToken } from "../security.js";
import { normalizeEmail, parseCookies, sessionCookie, clearedSessionCookie } from "../security.js";

export function createAuthRoutes({ authStore, appUrl, gmailOAuth }) {
  const router = Router();
  let gmailOAuthState = "";

  function getSession(request) {
    const cookies = parseCookies(request.headers.cookie);
    return authStore.getSession(cookies.clsa_session);
  }

  router.get("/me", (request, response) => {
    const user = getSession(request);
    response.json({
      user: user
        ? {
            email: user.email,
            canCreateRaffles: authStore.canCreateRaffles(user.email),
            isAdmin: authStore.isAdmin(user.email),
          }
        : null,
    });
  });

  router.get("/gmail/status", (_request, response) => {
    response.json({ gmail: gmailOAuth.getStatus() });
  });

  router.get("/gmail/authorize", (request, response) => {
    const user = getSession(request);
    const gmailStatus = gmailOAuth.getStatus();
    if (gmailStatus.connected) {
      if (!user || !authStore.isAdmin(user.email)) {
        response.status(403).send("Somente administradores autorizados podem reconectar o Gmail.");
        return;
      }
    } else if (gmailStatus.configured && user && !authStore.isAdmin(user.email)) {
      response.status(403).send("Somente administradores autorizados podem conectar o Gmail.");
      return;
    }

    try {
      gmailOAuthState = randomToken();
      const url = gmailOAuth.createAuthorizationUrl(gmailOAuthState);
      response.redirect(url);
    } catch (error) {
      response.status(503).send(error.message);
    }
  });

  router.get("/gmail/callback", async (request, response) => {
    if (String(request.query.state || "") !== gmailOAuthState) {
      response.redirect(`/?gmailError=${encodeURIComponent("Estado OAuth inválido.")}`);
      return;
    }

    try {
      await gmailOAuth.completeAuthorization(String(request.query.code || ""));
      gmailOAuthState = "";
      response.redirect("/?gmailConnected=true");
    } catch (error) {
      gmailOAuthState = "";
      response.redirect(`/?gmailError=${encodeURIComponent(error.message)}`);
    }
  });

  router.post("/gmail/disconnect", (request, response) => {
    const cookies = parseCookies(request.headers.cookie);
    const user = getSession(request);
    if (!user) {
      response.status(401).json({ error: "Faça login para continuar." });
      return;
    }
    gmailOAuth.disconnect();
    response.json({ disconnected: true });
  });

  router.post("/request", async (request, response) => {
    try {
      const email = normalizeEmail(request.body.email);

      if (gmailOAuth.getStatus().connected) {
        const { token } = await authStore.requestMagicLink(email);
        const verifyUrl = `${appUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
        await gmailOAuth.sendMail({
          to: email,
          subject: "Seu link de acesso ao CLSA Sorteador",
          text: `Acesse o sorteador pelo link: ${verifyUrl}\n\nEste link expira em 15 minutos.`,
        });
        response.json({ sent: true });
      } else if (
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ) {
        const { token } = await authStore.requestMagicLink(email);
        const verifyUrl = `${appUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: "Seu link de acesso ao CLSA Sorteador",
          text: `Acesse o sorteador pelo link: ${verifyUrl}\n\nEste link expira em 15 minutos.`,
        });
        response.json({ sent: true });
      } else if (process.env.NODE_ENV !== "production") {
        const { token } = await authStore.requestMagicLink(email);
        const verifyUrl = `${appUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
        response.json({
          sent: true,
          devLink: verifyUrl,
        });
      } else {
        response.status(503).json({
          error: "O envio de email não está configurado no servidor.",
        });
      }
    } catch (error) {
      response.status(400).json({ error: error.message });
    }
  });

  router.get("/verify", (request, response) => {
    try {
      const result = authStore.verifyMagicLink(String(request.query.token || ""));
      const secure = process.env.NODE_ENV === "production";
      response.setHeader("Set-Cookie", sessionCookie(result.sessionToken, secure));
      response.redirect("/");
    } catch (error) {
      response.redirect(`/?authError=${encodeURIComponent(error.message)}`);
    }
  });

  router.post("/logout", (request, response) => {
    const cookies = parseCookies(request.headers.cookie);
    authStore.logout(cookies.clsa_session);
    response.setHeader("Set-Cookie", clearedSessionCookie(process.env.NODE_ENV === "production"));
    response.json({ ok: true });
  });

  router.getSession = getSession;
  return router;
}
