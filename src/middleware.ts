import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

// Use the light-weight config for Middleware
export default NextAuth(authConfig).auth;

export const config = {
  // This matcher ensures middleware doesn't try to run on static files or images
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};