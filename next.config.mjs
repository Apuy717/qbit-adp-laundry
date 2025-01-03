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
        destination: "http://101.255.104.213:4000/api/:path*",
      },
      {
        source: "/file/:path*",
        destination: "http://101.255.104.213:4000/file/:path*",
      },
      {
        source: "/download/:path*",
        destination: "http://101.255.104.213:3000/download/:path*",
      },
    ];
  },
};

export default nextConfig;
