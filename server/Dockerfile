# Development Dockerfile
FROM python:3.11-slim

WORKDIR /app

ARG VERSION=dev
ARG COMMIT_SHA=unknown

ENV VERSION=${VERSION}
ENV COMMIT_SHA=${COMMIT_SHA}

# The installer requires curl (and certificates) to download the release archive
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates

# Download the latest installer
ADD https://astral.sh/uv/install.sh /uv-installer.sh

# Run the installer then remove it
RUN sh /uv-installer.sh && rm /uv-installer.sh

# Ensure the installed binary is on the `PATH`
ENV PATH="/root/.local/bin/:$PATH"

COPY requirements.txt .

# Use uv instead of pip
RUN uv pip install --system --no-cache -r requirements.txt

COPY . .

# Create entrypoint script
RUN echo '#!/bin/bash\nset -e\necho "Running database migrations..."\nalembic upgrade head\necho "Migrations complete. Starting server..."\nexec uvicorn main:app --host 0.0.0.0 --port 8000 --reload' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 8000

CMD ["/app/entrypoint.sh"]