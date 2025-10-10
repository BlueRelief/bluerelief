# BlueRelief

Crisis management platform with real-time data processing and visualization.

## Documentation

- [Versioning Guide](VERSIONING.md) - How to manage versions and releases
- [Docker Guide](DOCKER.md) - Docker setup and deployment

## Quick Start

Versioning is automated! Just use conventional commit messages:

```bash
# For new features (bumps minor version)
git commit -m "feat: add new feature"

# For bug fixes (bumps patch version)
git commit -m "fix: resolve bug"

# For breaking changes (bumps major version)
git commit -m "BREAKING CHANGE: update API"

# Check current version
cat VERSION

# Test what version would be bumped to
./scripts/auto-version.sh
```

When you merge to `main`, the version is automatically bumped and deployed! 🚀

## Project Structure

- `client/` - Next.js frontend application
- `server/` - FastAPI backend application
- `scripts/` - Utility scripts for development and deployment
- `.github/workflows/` - CI/CD workflows

## API Version

Check the deployed version:

```bash
curl https://api.private.bluerelief.app/api/version
```