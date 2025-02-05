/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `https://${process.env.NEXT_PUBLIC_API_DOMIAN}/api/:path*`,
      },
      {
        source: "/file/:path*",
        destination: `https://${process.env.NEXT_PUBLIC_API_DOMIAN}/file/:path*`,
      },
      {
        source: "/download/:path*",
        destination: `https://${process.env.NEXT_PUBLIC_API_DOMIAN}/download/:path*`,
      },
    ];
  },
};

export default nextConfig;
