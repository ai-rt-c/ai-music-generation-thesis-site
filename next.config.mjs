/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production" && !process.env.VERCEL;
// GitHub Pages project site is served under /<repo>/
const repo = "ai-music-generation-thesis-site";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? `/${repo}` : "",
  },
  reactStrictMode: true,
};

export default nextConfig;
