FROM node:24-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN apt-get update \
  && apt-get install --yes --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

FROM base AS prod-deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM base AS runtime

ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
COPY openapi.yaml ./openapi.yaml
COPY src ./src

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
