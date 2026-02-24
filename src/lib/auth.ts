import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: (() => {
    const configuredSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
    if (configuredSecret) return configuredSecret;

    const fallbackSecret = createHash("sha256")
      .update([
        process.env.RAILWAY_PROJECT_ID,
        process.env.RAILWAY_SERVICE_ID,
        process.env.NEXTAUTH_URL,
        process.env.AUTH_URL,
        "lashbooker-auth-fallback",
      ].filter(Boolean).join("|"))
      .digest("hex");

    console.warn("[auth] AUTH_SECRET/NEXTAUTH_SECRET missing. Using deterministic fallback secret.");
    return fallbackSecret;
  })(),
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "CLIENT";
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string) ?? "CLIENT";
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});
