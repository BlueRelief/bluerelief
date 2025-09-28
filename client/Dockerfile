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

# Expose port
EXPOSE 3000

# Command to run the application in development mode
CMD ["pnpm", "dev"]
