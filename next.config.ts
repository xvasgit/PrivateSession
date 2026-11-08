import type { NextConfig } from "next";

const config: NextConfig = {
  ...(process.env.PRIVATESESSION_CONTAINER_BUILD === "1"
    ? { output: "standalone" as const }
    : {}),
  agentRules: false,
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default config;
