# syntax=docker/dockerfile:1
#
# Florence App — üretim imajı (Faz 6 / Birim 6.5, plan M-11).
#
# Çok aşamalı: bağımlılıklar (deps) → derleme (build) → çalıştırma (runner).
# `next.config.ts` içindeki `output: "standalone"` yalnız gerekli dosyaları
# `.next/standalone` altına toplar; runner bu çıktıyı `node server.js` ile sunar.
#
# NEXT_PUBLIC_* değişkenleri Next tarafından DERLEME anında paketlere gömülür;
# bu yüzden build arg olarak verilir (bkz. docs/deployment-notes.md).

# ---------------------------------------------------------------------------
# 1) deps — kilitli bağımlılıklar (katman önbelleği için önce yalnız manifest)
# ---------------------------------------------------------------------------
FROM node:24-alpine AS deps
# Bazı Next/React bağımlılıkları glibc uyumluluğu ister (Alpine musl).
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# 2) build — kaynak kopyalanır ve üretim derlemesi alınır
# ---------------------------------------------------------------------------
FROM node:24-alpine AS build
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* build sırasında bundle'a gömülür. Varsayılanlar yerel
# geliştirmedir; prod imajında mutlaka gerçek değerler verilmelidir.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_PORTFOLIO_COMMISSION_RATE=0.001
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_PORTFOLIO_COMMISSION_RATE=$NEXT_PUBLIC_PORTFOLIO_COMMISSION_RATE
RUN npm run build

# ---------------------------------------------------------------------------
# 3) runner — yalnız standalone çıktı + statikler; non-root kullanıcı
# ---------------------------------------------------------------------------
FROM node:24-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# server.js tüm arayüzlere bağlanır; dışarıya yalnız nginx açılır.
ENV HOSTNAME=0.0.0.0

# Sistem grubu/kullanıcısı (uid/gid 1001); root olarak çalıştırılmaz.
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# `public` ve `.next/static` standalone tarafından kopyalanmaz (CDN varsayımı);
# bu imajda Next'in kendisi sunacağı için elle taşınır.
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# Masaüstü binary'leri ve manifesti buraya bağlanır (salt-okunur volume);
# dizin önceden oluşturulur ki mount edilebilsin (bkz. docs/deployment-notes.md).
RUN mkdir -p /app/public/downloads && chown -R nextjs:nodejs /app/public/downloads

USER nextjs
EXPOSE 3000

# Container'ın kendi sağlığı: `/api/health` 200 dönmeli. Backend'e bağımlı
# değildir (yalnız uygulama ayakta mı sorusu). Node 24 global `fetch` kullanır;
# imaja curl/wget eklenmez.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Standalone sunucusu; `next start` gerekmez.
CMD ["node", "server.js"]
