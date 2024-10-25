/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://101.255.104.213:3000/:path*',
            },
        ];
    },
};
export default nextConfig;
