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
        destination: "http://magenta.srv.qyubit.io:3001/api/:path*",
      },
      {
        source: "/file/:path*",
        destination: "http://magenta.srv.qyubit.io:3001/file/:path*",
      },
      {
        source: "/download/:path*",
        destination: "http://magenta.srv.qyubit.io:3001/download/:path*",
      },
    ];
  },
};

export default nextConfig;
