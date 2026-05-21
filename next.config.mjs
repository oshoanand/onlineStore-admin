/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4001",
        pathname: "/uploads/**",
      },
    ],
  },
  turbopack: {},
};

export default nextConfig;
