FROM oven/bun:1

WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lock ./

# Install production dependencies
RUN bun install --frozen-lockfile --production

# Copy application source
COPY --chown=bun:bun src ./src
COPY --chown=bun:bun public ./public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER bun

CMD ["bun", "run", "src/index.ts"]
