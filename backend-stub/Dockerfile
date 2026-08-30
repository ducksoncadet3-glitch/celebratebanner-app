# syntax=docker/dockerfile:1
#
# CelebrateBanner API + workers — one image, three Fly process groups (api/worker/recovery).
#
# Build context is the REPO ROOT — backend-stub depends on shared/render-engine via a `file:`
# dependency whose dist/ is gitignored, so it is built fresh here (clean-clone safe):
#
#   docker build -f backend-stub/Dockerfile -t celebratebanner-api .

FROM node:22-slim AS base

# ── build stage ───────────────────────────────────────────────────────────────
# System libraries so native modules (canvas, bcrypt) build/install if no prebuilt binary
# is available for this platform. NODE_ENV stays unset here so devDeps (render-engine's tsc)
# install; production install for the backend uses --omit=dev explicitly.
FROM base AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential python3 pkg-config \
      libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
  && rm -rf /var/lib/apt/lists/*

# 1) Build the shared render engine from source (dist/ not committed).
COPY shared/render-engine/package.json shared/render-engine/package-lock.json ./shared/render-engine/
RUN cd shared/render-engine && npm ci
COPY shared/render-engine/ ./shared/render-engine/
RUN cd shared/render-engine && npm run build

# 2) Install backend production dependencies deterministically.
COPY backend-stub/package.json backend-stub/package-lock.json ./backend-stub/
RUN cd backend-stub && npm ci --omit=dev
COPY backend-stub/ ./backend-stub/

# ── runtime stage ─────────────────────────────────────────────────────────────
FROM base AS runtime
ENV NODE_ENV=production PORT=8080
WORKDIR /app
# Runtime shared libraries for canvas + ffmpeg for the video slideshow upsell.
RUN apt-get update && apt-get install -y --no-install-recommends \
      libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libjpeg62-turbo libgif7 librsvg2-2 \
      ffmpeg \
  && rm -rf /var/lib/apt/lists/*

# Preserve the backend ↔ shared relative layout so the file: dependency resolves.
COPY --from=build --chown=node:node /app/shared ./shared
COPY --from=build --chown=node:node /app/backend-stub ./backend-stub

WORKDIR /app/backend-stub
USER node
EXPOSE 8080

# Default process = API. Fly process groups (fly.toml) override this for worker/recovery.
CMD ["node", "server.js"]
