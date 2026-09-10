FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY packages/nextjs/package.json packages/nextjs/package.json
COPY packages/hardhat/package.json packages/hardhat/package.json
RUN yarn install --immutable

FROM base AS builder
COPY . .
RUN yarn workspace @sh/nextjs build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=builder /app /app
RUN mkdir -p /data
EXPOSE 3000
CMD ["yarn", "workspace", "@sh/nextjs", "serve"]

