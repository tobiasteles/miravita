import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
const priv = createRouteMatcher([
  "/characters(.*)",
  "/play(.*)",
  "/api/chat(.*)",
  "/admin(.*)",
  "/__clerk/:path*",
]);
export default clerkMiddleware(async (auth, req) => {
  if (priv(req)) await auth.protect();
});
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
