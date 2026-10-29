/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/trpc/:path*",
        destination: `${process.env.API_URL || "http://localhost:8000"}/trpc/:path*`,
      },
    ];
  },
};

export default nextConfig;
