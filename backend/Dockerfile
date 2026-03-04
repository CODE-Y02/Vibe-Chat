# ─────────────────────────────────────────────
# Stage 1: Install dependencies
# ─────────────────────────────────────────────
FROM oven/bun:1-alpine AS deps

WORKDIR /app

# Copy only the files needed for dependency installation
# so this layer is cached unless package.json / bun.lock changes
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ─────────────────────────────────────────────
# Stage 2: Generate Prisma client
# ─────────────────────────────────────────────
FROM oven/bun:1-alpine AS prisma

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock ./
COPY prisma ./prisma

RUN bunx prisma generate

# ─────────────────────────────────────────────
# Stage 3: Production runner (lean final image)
# ─────────────────────────────────────────────
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Drop to non-root user for security (built into the official bun image)
USER bun

# Copy only what the app needs at runtime
COPY --from=deps    /app/node_modules    ./node_modules
COPY --from=prisma  /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json ./
COPY src ./src
COPY prisma ./prisma

# Expose server port
EXPOSE 3000

# Ensure database schema is pushed before starting the server
CMD ["bun", "run", "src/index.ts"]
