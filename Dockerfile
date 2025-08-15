# syntax=docker/dockerfile:1

# Base image with system packages required for node-canvas and general build tools
FROM node:20-bookworm-slim AS base

# Install system dependencies (node-canvas, build tools)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       pkg-config \
       libcairo2-dev \
       libpango1.0-dev \
       libjpeg-dev \
       libgif-dev \
       librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Install only production dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# Build with full dependencies (including dev)
FROM base AS builder
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production runtime image
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy production node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy necessary artifacts from the builder
COPY --from=builder /app/.next ./.next
# Include next.config.js if present
COPY --from=builder /app/next.config.js ./next.config.js
# Include package.json for next start
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
ENV PORT=3000

CMD ["npm", "run", "start"]