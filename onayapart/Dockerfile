# syntax=docker/dockerfile:1
# Onay Apart - uretim imaji (Next.js standalone ciktisi).
#
# Sayfalar derleme sirasinda veritabanindan okunarak uretildigi icin DATABASE_URL
# derlemede de erisilebilir olmalidir:
#   docker build --build-arg DATABASE_URL="postgresql://..." \
#                --build-arg NEXT_PUBLIC_SITE_URL="https://alanadiniz.com" -t onayapart .

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# --- bagimliliklar ---
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# --- derleme ---
FROM base AS builder
ARG DATABASE_URL
ARG NEXT_PUBLIC_SITE_URL
ENV DATABASE_URL=$DATABASE_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    BUILD_STANDALONE=true \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma migrate deploy && npm run build

# --- calisma imaji ---
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/data/uploads
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs \
 && mkdir -p /data/uploads && chown -R nextjs:nodejs /data

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/assets ./assets
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000
VOLUME ["/data/uploads"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
