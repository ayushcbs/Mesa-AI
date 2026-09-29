# Build stage
FROM node:20 AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build the application
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
# Note: Since the server is bundled with esbuild, we only need to keep 
# dependencies that are marked as 'external' or needed at runtime.
# Express and other core libraries are usually excluded from bundling.
RUN npm install --omit=dev

# Copy build artifacts
COPY --from=builder /app/dist ./dist

# Set environment to production
ENV NODE_ENV=production
# Cloud Run sets PORT, but let's default it
ENV PORT=8080

EXPOSE 8080

# Start the server
CMD ["npm", "start"]
