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
  // Proxies /api/* → FastAPI backend (Render in production, localhost in dev)
  async rewrites() {
    const isProd = process.env.NODE_ENV === 'production';
    const backendUrl = isProd 
      ? "https://profile-agent.onrender.com" 
      : "http://localhost:8000";
      
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
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
