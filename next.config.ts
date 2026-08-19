import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/AdamiEnrico01/Hackaton_OpenAI_19_08_2026/**",
      },
    ],
  },
};

export default nextConfig;
