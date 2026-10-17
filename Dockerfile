# --- Stage 1: build the Casaway client (npm workspaces) ---
FROM node:22-slim AS client
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/client/package.json frontend/client/package.json
COPY frontend/admin/package.json frontend/admin/package.json
RUN npm ci
COPY frontend/client/ frontend/client/
RUN npm run build --workspace=client

# --- Stage 2: runtime (Express + built client) ---
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/client/package.json frontend/client/package.json
COPY frontend/admin/package.json frontend/admin/package.json
RUN npm ci --omit=dev

COPY backend/ backend/
COPY --from=client /app/frontend/client/dist frontend/client/dist

ENV PORT=8080
EXPOSE 8080
USER node
CMD ["node", "backend/server.js"]
