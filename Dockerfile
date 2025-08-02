# Alternative: Your current approach with fixes
FROM node:23-alpine3.20 AS builder

# Add libc6-compat for Alpine compatibility
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Verify build output exists
RUN ls -la .next/ && cat .next/BUILD_ID

# Remove development dependencies
RUN npm prune --production

# Stage 2: Runtime
FROM node:23-alpine3.20

# Add libc6-compat for Alpine compatibility
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files
COPY --from=builder /usr/src/app/package*.json ./

# Copy next.config.mjs if it exists
COPY --from=builder /usr/src/app/next.config.* ./

# Copy built application
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/public ./public

# Verify the build exists in runtime stage
RUN ls -la .next/ && if [ -f .next/BUILD_ID ]; then echo "Build ID found: $(cat .next/BUILD_ID)"; else echo "ERROR: BUILD_ID not found"; exit 1; fi

# Expose port
EXPOSE 4001

# Start the application
CMD ["npm", "start"]