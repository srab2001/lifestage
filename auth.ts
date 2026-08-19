import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Google OAuth gates the shared staff dashboard during development and
 * internal review — a small, known set of Ad Hoc and VA reviewer accounts.
 * This is NOT the Veteran-facing identity provider; production VA.gov
 * authentication runs through Login.gov/ID.me and VA's ICN-based identity
 * model (PWS 8.1.9). See docs for the full scoping note.
 */
const ALLOWED_EMAIL_DOMAIN = "adhocteam.us";

// ADMIN_EMAILS (comma-separated, case-insensitive) is a named allow-list —
// set it in Vercel to restrict /dashboard to specific people instead of
// the whole @adhocteam.us domain. Leave it unset to keep the domain check.
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

function isAllowedEmail(email: string) {
  if (ADMIN_EMAILS.size > 0) {
    return ADMIN_EMAILS.has(email.toLowerCase());
  }
  return email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

// Auth.js requires AUTH_SECRET in production (Vercel env — see README Phase
// 0). Falling back only outside production keeps `npm run dev` usable
// before that setup step without weakening the real deployment.
const devFallbackSecret =
  process.env.NODE_ENV === "production" ? undefined : "lifestage-dev-only-insecure-secret";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Auth.js v5's automatic env-var inference expects AUTH_GOOGLE_ID /
  // AUTH_GOOGLE_SECRET, not the GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
  // names used throughout this repo's docs and .env.example — wired
  // explicitly here so those names actually take effect. Getting this
  // wrong doesn't error locally; it silently sends Google an empty
  // client_id, which surfaces as "OAuth client was not found" on
  // Google's own consent screen, not in this app's logs.
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.AUTH_SECRET ?? devFallbackSecret,
  // Vercel deployments are trusted automatically; this covers `npm run
  // start` and any non-Vercel host so the proxy's session lookup doesn't
  // throw UntrustedHost on its own domain.
  trustHost: true,
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email;
      return Boolean(email && isAllowedEmail(email));
    },
  },
});
