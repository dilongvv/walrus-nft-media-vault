/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  eslint: {
    dirs: ['app', 'components', 'constants', 'hooks', 'lib', 'providers', 'types']
  }
};

export default nextConfig;
