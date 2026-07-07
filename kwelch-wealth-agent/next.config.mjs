/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Native module + package with Deno-flavored internals — load from
    // node_modules at runtime instead of bundling with webpack.
    serverComponentsExternalPackages: ['better-sqlite3', 'yahoo-finance2'],
  },
}

export default nextConfig
