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

// Auth.js requires AUTH_SECRET in production (Vercel env — see README Phase
// 0). Falling back only outside production keeps `npm run dev` usable
// before that setup step without weakening the real deployment.
const devFallbackSecret =
  process.env.NODE_ENV === "production" ? undefined : "lifestage-dev-only-insecure-secret";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  secret: process.env.AUTH_SECRET ?? devFallbackSecret,
  // Vercel deployments are trusted automatically; this covers `npm run
  // start` and any non-Vercel host so the proxy's session lookup doesn't
  // throw UntrustedHost on its own domain.
  trustHost: true,
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email;
      return Boolean(email && email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`));
    },
  },
});
