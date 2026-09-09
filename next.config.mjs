/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "a16e-2a09-bac1-3480-18-00-279-83.ngrok-free.app",
    "192.168.1.124",
    "192.168.1.116",
    "localhost:4000",
  ],
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
        destination: `${process.env.NEXT_PUBLIC_API_DOMAIN}/api/:path*`,
      },
      {
        source: "/file/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_DOMAIN}/file/:path*`,
      },
      {
        source: "/download/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_DOMAIN}/download/:path*`,
      },
    ];
  },
};

export default nextConfig;
