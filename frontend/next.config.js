/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel handles image optimization natively
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pubchem.ncbi.nlm.nih.gov" },
    ],
    unoptimized: false,
  },
  // Proxy to FastAPI backend (set NEXT_PUBLIC_API_URL in Vercel env vars)
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL;
    if (!backend) return [];
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backend}/:path*`,
      },
    ];
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
