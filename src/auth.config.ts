import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config.
 * NO adapter, NO DB imports — safe for middleware (Edge runtime).
 * The full config (with Drizzle adapter) lives in src/auth.ts.
 */
export default {
  providers: [
    GitHub({ allowDangerousEmailAccountLinking: true }),
    Google({ allowDangerousEmailAccountLinking: true }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ auth, request }) => {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      const isLoginPage = path.startsWith("/login");
      const isPublicRoute =
        path.startsWith("/projects/") ||
        path.startsWith("/s/") ||
        path.startsWith("/api/") ||
        path.startsWith("/unauthorized");
      if (isLoginPage || isPublicRoute) return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
