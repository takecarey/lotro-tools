/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Use the new static export option
  basePath: '/lotro-tools', // Match your GitHub Pages repository name
  assetPrefix: '/lotro-tools', // Prefix static assets with the correct base path
  images: {
    unoptimized: true, // Required for exporting Next.js projects to static HTML
  },
  trailingSlash: true, // Ensures routes end with a slash for compatibility
};

module.exports = nextConfig;
