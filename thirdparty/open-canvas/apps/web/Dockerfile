# Dockerfile for OpenCanvas Web Service
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy root package files for monorepo setup
COPY package.json yarn.lock ./
COPY packages ./packages

# Copy web app
COPY apps/web ./apps/web

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy environment variables
COPY apps/web/.env.local ./apps/web/.env.local

# Build Next.js app
WORKDIR /app/apps/web
RUN yarn build

# Expose Next.js port
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Start Next.js server
CMD ["yarn", "start"]
