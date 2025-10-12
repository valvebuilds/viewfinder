import { authMiddleware } from "@clerk/nextjs/server";
 
export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"]
});
 
export const config = {
  matcher: [
    // Exclude files with a consumable extension (e.g., .js, .css, .jpg, etc.)
    "/(?!_next|[^/.]+\.[^/.]+$).*/",
    // Re-include any files in `/' that didn't have an extension as they may be Next.js pages
    "/"
  ],
};
