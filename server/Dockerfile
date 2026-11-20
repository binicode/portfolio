# The Express API as a container, for any host that runs Docker images.
# Build:  docker build -t portfolio-api server
# Run:    docker run --env-file server/.env -p 4000:4000 portfolio-api
# Settings come from the environment (server/.env.example); none are baked in.

# Compile TypeScript with the dev dependencies.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Run the compiled output with production dependencies only, as a non-root user.
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
# node directly (not npm), so SIGTERM reaches the server's graceful shutdown.
CMD ["node", "dist/core/server.js"]
