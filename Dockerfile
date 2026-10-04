FROM node:24.21.0-bookworm-slim
WORKDIR /app
COPY server.ts README.md ./
COPY public/ ./public/
ENV NODE_ENV=production DATA_DIR=/data PORT=8080
EXPOSE 8080
CMD ["node", "server.ts"]
