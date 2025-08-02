FROM node:23-alpine3.20 AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies
# RUN npm prune --production

# Stage 2: Runtime
FROM node:23-alpine3.20

# Set working directory
WORKDIR /usr/src/app

# Copy the built application from the builder stage next.config.mjs
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/next.config.mjs ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/public ./public

# Start the application
CMD ["npm", "start"]
