/** @type {import('next').NextConfig} */
const nextConfig = {
  /* ── Strict TypeScript / ESLint ──────────────────────────────────────── */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  /* ── API proxy (dev convenience) ─────────────────────────────────────── */
  // Proxies /api/* → FastAPI backend running on :8000
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },

  /* ── Images ───────────────────────────────────────────────────────────── */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "diligencify.com",
      },
    ],
  },
};

export default nextConfig;
