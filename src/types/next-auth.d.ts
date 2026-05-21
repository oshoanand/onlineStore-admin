import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      mobile: string;
    } & DefaultSession["user"];
    accessToken: string;
  }

  interface User {
    role: string;
    mobile: string;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    mobile: string;
    accessToken: string;
  }
}
