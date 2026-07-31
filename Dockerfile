# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# --- Build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# prisma generate / next build don't connect to the DB, but prisma.config.ts
# resolves DATABASE_URL at load time — supply a placeholder for the build only.
# The real value is injected at runtime by docker-compose.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV AUTH_SECRET="build-time-placeholder"
RUN npx prisma generate
RUN npm run build
# Bake the schema SQL into the image so the runtime can bootstrap the DB with the
# lightweight bundled `pg` client instead of the heavy Prisma CLI dependency tree.
RUN npx prisma migrate diff --from-empty --to-schema ./prisma/schema.prisma --script > ./scripts/schema.sql

# --- Runtime ---
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# The standalone bundle already traces in @prisma/client and `pg`; we only need
# the bootstrap script + the SQL baked above. No Prisma CLI in the runtime image.
COPY --from=builder /app/scripts/apply-schema.mjs ./scripts/apply-schema.mjs
COPY --from=builder /app/scripts/schema.sql ./scripts/schema.sql
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
