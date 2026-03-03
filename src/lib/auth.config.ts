import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {prisma} from "@/lib/prisma";
import {PrismaAdapter} from "@auth/prisma-adapter";

export const authConfig = {
    secret: process.env.AUTH_SECRET,
    adapter: PrismaAdapter(prisma),
    providers: [
        // We leave this empty or minimal here; we'll define the
        // authorize logic in the main auth.ts file to keep Prisma out of here.
        Credentials({}),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
} satisfies NextAuthConfig;