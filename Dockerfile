# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci

# Copy source (note: .dockerignore excludes node_modules, dist, .env*, backend)
COPY . .

# VITE_API_URL must be the URL the *browser* uses to reach the backend.
# Override at build time with: --build-arg VITE_API_URL=http://your-host:3000
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: serve ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# SPA routing config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
