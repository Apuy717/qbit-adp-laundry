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
      {
        source: "/mqtt/:path*",
        destination: `http://${process.env.NEXT_PUBLIC_MQTT_BROKER_URL}/mqtt/:path*`,
      },
    ];
  },
};

export default nextConfig;
