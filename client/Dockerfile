# Use Node.js 18 image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy application code
COPY . .

# Build arguments
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MAPBOX_TOKEN
ARG NODE_ENV=production

# Set environment variables
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN
ENV NODE_ENV=$NODE_ENV

# Build the application
RUN pnpm build

# Expose port
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "start"]
