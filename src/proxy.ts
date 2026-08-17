import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    /*
     * Match all app routes except:
     * - /auth/* (sign-in / sign-up)
     * - /api/auth/* (Neon Auth handlers)
     * - Next.js static assets and favicon
     */
    "/((?!_next/static|_next/image|favicon.ico|auth|api/auth).*)",
  ],
};
