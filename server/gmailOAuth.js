import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

export function createGmailOAuth(options = {}) {
  const projectRoot = options.projectRoot;
  const tokenFile = path.join(projectRoot, "data", "gmail-token.json");

  function readClientJson() {
    const filePath =
      process.env.GOOGLE_CLIENT_SECRET_FILE ||
      path.join(projectRoot, "google-oauth.json");

    if (!fs.existsSync(filePath)) return null;

    try {
      const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return json.web || json.installed || null;
    } catch {
      return null;
    }
  }

  function getClientCredentials() {
    const clientJson = readClientJson();
    return {
      clientId:
        process.env.GMAIL_CLIENT_ID ||
        clientJson?.client_id ||
        "",
      clientSecret:
        process.env.GMAIL_CLIENT_SECRET ||
        clientJson?.client_secret ||
        "",
    };
  }

  function getRefreshToken() {
    if (process.env.GMAIL_REFRESH_TOKEN) {
      return process.env.GMAIL_REFRESH_TOKEN;
    }
    if (!fs.existsSync(tokenFile)) return "";

    try {
      return JSON.parse(fs.readFileSync(tokenFile, "utf8")).refresh_token || "";
    } catch {
      return "";
    }
  }

  function createOAuthClient() {
    const credentials = getClientCredentials();
    if (!credentials.clientId || !credentials.clientSecret) {
      throw new Error("Gmail OAuth não está configurado.");
    }

    const redirectUri =
      process.env.GMAIL_REDIRECT_URI ||
      `${options.appUrl}/api/auth/gmail/callback`;

    return new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      redirectUri,
    );
  }

  return {
    getStatus() {
      const credentials = getClientCredentials();
      return {
        configured: Boolean(
          credentials.clientId &&
          credentials.clientSecret &&
          process.env.GMAIL_USER,
        ),
        connected: Boolean(getRefreshToken()),
        email: process.env.GMAIL_USER || "",
      };
    },

    createAuthorizationUrl(state) {
      const oauthClient = createOAuthClient();
      return oauthClient.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [
          "openid",
          "email",
          "https://www.googleapis.com/auth/gmail.send",
        ],
        state,
      });
    },

    async completeAuthorization(code) {
      const oauthClient = createOAuthClient();
      const { tokens } = await oauthClient.getToken(code);
      if (!tokens.refresh_token) {
        throw new Error(
          "O Google não retornou um refresh token. Revogue o acesso anterior e tente novamente.",
        );
      }

      oauthClient.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: "v2", auth: oauthClient });
      const identity = await oauth2.userinfo.get();
      const authorizedEmail = String(identity.data.email || "").trim().toLower();
      const expectedEmail = String(process.env.GMAIL_USER || "").trim().toLower();
      if (expectedEmail && authorizedEmail !== expectedEmail) {
        throw new Error(`Conecte a conta ${expectedEmail} no Google.`);
      }

      fs.mkdirSync(path.dirname(tokenFile), { recursive: true });
      fs.writeFileSync(
        tokenFile,
        JSON.stringify(
          {
            refresh_token: tokens.refresh_token,
            connected_at: new Date().toISOString(),
          },
          null,
          2,
        ),
        { mode: 0o600 },
      );
      return tokens.refresh_token;
    },

    async sendMail({ to, subject, text }) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error("Gmail OAuth ainda não foi conectado.");
      }

      const credentials = getClientCredentials();
      const oauthClient = new google.auth.OAuth2(
        credentials.clientId,
        credentials.clientSecret,
        process.env.GMAIL_REDIRECT_URI,
      );
      oauthClient.setCredentials({ refresh_token: refreshToken });

      const sender = process.env.GMAIL_FROM || process.env.GMAIL_USER;
      const headers = [
        `From: ${sender}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "",
        text,
      ];
      const raw = Buffer.from(headers.join("\r\n"), "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const gmail = google.gmail({ version: "v1", auth: oauthClient });
      await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw },
      });
    },

    disconnect() {
      if (fs.existsSync(tokenFile)) fs.unlinkSync(tokenFile);
    },
  };
}
