FROM node:24-trixie-slim@sha256:0820eaa85e07d0490446dd01d14707e17e6108a36988cf374899cd057eb3812d AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY scripts/load-lab-env.ts ./scripts/load-lab-env.ts
COPY lib/database/lab-config.ts ./lib/database/lab-config.ts
RUN --mount=type=cache,target=/root/.npm npx --yes npm@11.6.2 ci --no-audit --no-fund
COPY . .
RUN mkdir -p public && PRIVATESESSION_CONTAINER_BUILD=1 npm run build -- --webpack

FROM node:24-trixie-slim@sha256:0820eaa85e07d0490446dd01d14707e17e6108a36988cf374899cd057eb3812d AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=127.0.0.1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER 1000:1000
EXPOSE 3000
CMD ["node", "server.js"]
