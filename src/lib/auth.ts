import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { apiRequest } from "@/services/http/api-client";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        mobile: { label: "Mobile", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.mobile || !credentials?.password) {
            throw new Error("Mobile and Password are required");
          }

          const response = await apiRequest<any>({
            url: "/users/auth/login",
            method: "POST",
            data: {
              mobile: credentials.mobile,
              password: credentials.password,
              // Acts as the "Source" identifier for the backend to run staff security checks
              userType: "ADMINISTRATOR",
            },
          });

          const userPayload = response.data;

          if (userPayload && userPayload.token) {
            return {
              id: userPayload.id,
              name: userPayload.name,
              email: userPayload.email,
              image: userPayload.image,
              mobile: userPayload.mobile,
              role: userPayload.role,
              accessToken: userPayload.token,
            };
          }

          return null;
        } catch (error: any) {
          const message =
            error.response?.data?.message ||
            error.message ||
            "ACCESS DENIED: Staff only";
          throw new Error(message);
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.mobile = (user as any).mobile;
        token.accessToken = (user as any).accessToken;
        token.image = user.image;
        token.name = user.name;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.image = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.image = token.image as string;
        session.user.name = token.name;
        (session.user as any).role = token.role;
        (session.user as any).mobile = token.mobile;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
