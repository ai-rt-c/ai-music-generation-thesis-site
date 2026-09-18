/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";
// GitHub Pages project site is served under /<repo>/
const repo = "ai-music-generation-thesis-site";

const nextConfig = {
  // The assistant needs a server-side route so credentials never reach the browser.
  // GitHub Pages remains a static mirror; the live assistant is a Vercel feature.
  ...(isGitHubPages ? { output: "export" } : {}),
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isGitHubPages ? `/${repo}` : "",
  assetPrefix: isGitHubPages ? `/${repo}/` : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: isGitHubPages ? `/${repo}` : "",
  },
  reactStrictMode: true,
};

export default nextConfig;
