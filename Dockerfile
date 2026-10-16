# --- Stage 1: build the Casaway client ---
FROM node:22-slim AS client
WORKDIR /app/frontend/client
COPY frontend/client/package.json frontend/client/package-lock.json ./
RUN npm ci
COPY frontend/client/ ./
RUN npm run build

# --- Stage 2: runtime (Express + built client) ---
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/ ./backend/
COPY --from=client /app/frontend/client/dist ./frontend/client/dist

ENV PORT=8080
EXPOSE 8080
USER node
CMD ["node", "backend/server.js"]
