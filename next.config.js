/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // Enables static export
    basePath: '/lotro-tools', // Match your GitHub Pages repo name
    assetPrefix: '/lotro-tools', // Ensures CSS/JS chunks are resolved correctly
      images: {
      unoptimized: true, // Required for static export on GitHub Pages
    },
    trailingSlash: true, // Ensures compatibility with GitHub Pages
  };
  
  module.exports = nextConfig;