import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";
import {NextResponse} from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // DIAGNOSTIC LOGS
  console.log("--- MIDDLEWARE CHECK ---");
  console.log("Path:", nextUrl.pathname);
  console.log("Is Logged In?:", isLoggedIn);
  console.log("Session Data:", req.auth);

  console.log("Hello from middleware! I am watching Url: " + req.nextUrl.pathname);

  if(!isLoggedIn && (
      nextUrl.pathname.startsWith("/home") ||
          nextUrl.pathname.startsWith("/dashboard") ||
          nextUrl.pathname.startsWith("/profile")
  )) {
    console.log("REDIRECTION TRIGGERED");
    return Response.redirect(new URL("/login", nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  /*  Pages that require login  */
  matcher:["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};