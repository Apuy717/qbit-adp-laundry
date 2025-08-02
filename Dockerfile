FROM node:23-alpine3.20 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --frozen-lockfile

COPY . .

RUN npm run build

RUN npm prune --production

# ---------- Runtime Stage ----------
FROM node:23-alpine3.20

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/node_modules ./node_modules

CMD ["npm", "start"]
