// Where the backend runs. Read on the server only, never sent to the browser.
const API_URL = process.env.API_URL ?? "http://localhost:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets a production build run next to `npm run dev` without overwriting its .next folder:
  // NEXT_DIST_DIR=.next-build npm run build
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The browser calls /api/* on this site and Next forwards it to the backend.
  // The session cookie then belongs to this site, so there is no cross-site cookie or CORS setup.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};
export default nextConfig;
