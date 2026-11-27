/** @type {import('next').NextConfig} */
const nextConfig = {
  // App chỉ có 1 trang client → xuất static HTML (thư mục out/), không cần Next server khi chạy
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
module.exports = nextConfig;
