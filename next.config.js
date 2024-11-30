/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/lotro-tools',
  assetPrefix: '/lotro-tools/',
  trailingSlash: true, // Ensures paths end with a slash for GitHub Pages
  images: {
    unoptimized: true, 
  },
};

module.exports = nextConfig;