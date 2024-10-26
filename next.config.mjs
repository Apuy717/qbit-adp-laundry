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
        source: "/:path*",
        destination: "http://101.255.104.213:3000/:path*",
      },
    ];
  },
};

export default nextConfig;
