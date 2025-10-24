#!/bin/bash

set -e

REGISTRY="registry.rsft.co"
PROJECT="bluerelief"
VERSION="${1:-latest}"

# Frontend build args (can be overridden by environment variables)
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:8000}"
NEXT_PUBLIC_MAPBOX_TOKEN="${NEXT_PUBLIC_MAPBOX_TOKEN:-}"

echo "🚀 Building and pushing BlueRelief Docker images to ${REGISTRY}"
echo "📦 Version: ${VERSION}"
echo "🌐 Frontend API URL: ${NEXT_PUBLIC_API_URL}"
echo ""

cd "$(dirname "$0")/.."

echo "🔨 Building backend image for AMD64 (no cache)..."
docker buildx build \
  --platform linux/amd64 \
  --no-cache \
  --pull \
  -f server/Dockerfile.prod \
  -t ${REGISTRY}/${PROJECT}/backend:${VERSION} \
  -t ${REGISTRY}/${PROJECT}/backend:latest \
  --push \
  ./server

echo "✅ Backend image built and pushed successfully"
echo ""

echo "🔨 Building frontend image for AMD64 (no cache)..."
docker buildx build \
  --platform linux/amd64 \
  --no-cache \
  --pull \
  --build-arg NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
  --build-arg NEXT_PUBLIC_MAPBOX_TOKEN=${NEXT_PUBLIC_MAPBOX_TOKEN} \
  -f client/Dockerfile.prod \
  -t ${REGISTRY}/${PROJECT}/frontend:${VERSION} \
  -t ${REGISTRY}/${PROJECT}/frontend:latest \
  --push \
  ./client

echo "✅ Frontend image built and pushed successfully"
echo ""

echo "🔨 Building email-service image for AMD64 (no cache)..."
docker buildx build \
  --platform linux/amd64 \
  --no-cache \
  --pull \
  -f email-service/Dockerfile \
  -t ${REGISTRY}/${PROJECT}/email-service:${VERSION} \
  -t ${REGISTRY}/${PROJECT}/email-service:latest \
  --push \
  ./email-service

echo "✅ Email service image built and pushed successfully"
echo ""

echo "🎉 All images built and pushed successfully!"
echo ""
echo "Images pushed:"
echo "  - ${REGISTRY}/${PROJECT}/backend:${VERSION}"
echo "  - ${REGISTRY}/${PROJECT}/backend:latest"
echo "  - ${REGISTRY}/${PROJECT}/frontend:${VERSION}"
echo "  - ${REGISTRY}/${PROJECT}/frontend:latest"
echo "  - ${REGISTRY}/${PROJECT}/email-service:${VERSION}"
echo "  - ${REGISTRY}/${PROJECT}/email-service:latest"
