import type { NextConfig } from 'next';
import type { WebpackConfigContext } from 'next/dist/server/config-shared';

const nextConfig: NextConfig = {
  webpack(config: WebpackConfigContext['webpack'], options: WebpackConfigContext) {
    config.module = config.module || { rules: [] };
    config.module.rules.push({
      test: /\.node$/,
      use: 'null-loader',
    });
    return config;
  },
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 타입 오류가 있어도 빌드 계속
  typescript: {
    ignoreBuildErrors: true,
  },

};

export default nextConfig;
