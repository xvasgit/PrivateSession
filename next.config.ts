import type { NextConfig } from "next";

const config: NextConfig = {
  agentRules: false,
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default config;
