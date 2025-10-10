# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-10

### Added
- **Automated semantic versioning** based on commit messages
  - Analyzes commits and auto-bumps version on deployment
  - Supports conventional commit keywords (feat, fix, BREAKING CHANGE)
  - No manual version management needed!
- Auto-version script (`scripts/auto-version.sh`)
- Manual version management script (`scripts/version.sh`) for overrides
- Version information exposed through API endpoints:
  - `/` - Root endpoint now includes version and commit
  - `/health` - Health check includes version and commit
  - `/api/version` - Dedicated version endpoint
- VERSION and COMMIT_SHA build arguments in all Dockerfiles
- Automatic git tagging on production deployments
- Comprehensive versioning documentation (VERSIONING.md)
- Docker images now tagged with both version+commit and `latest`

### Changed
- Production deployment workflow now auto-bumps versions
  - Reads commit history and determines bump type
  - Commits version update back to repository
  - Shows version change in deployment logs
- Updated main.py to read and expose version information
- Enhanced deployment notifications with version bump details

### How It Works
1. Push code to `main` with conventional commits
2. Workflow analyzes commits for keywords:
   - `BREAKING CHANGE` / `MAJOR:` → major bump (1.0.0 → 2.0.0)
   - `feat:` / `feature:` → minor bump (1.0.0 → 1.1.0)
   - `fix:` / `chore:` / `docs:` → patch bump (1.0.0 → 1.0.1)
3. Version automatically bumped and committed
4. Docker images built with version tag
5. Deployed to production with git tag

### Technical Details
- Backend Docker images: `v{VERSION}-{COMMIT_SHA}` format
- Frontend Docker images: `v{VERSION}-{COMMIT_SHA}` format
- Environment variables: VERSION, COMMIT_SHA, NEXT_PUBLIC_VERSION
- FastAPI version set dynamically from VERSION file
- Commit with `[skip ci]` to prevent auto-versioning when needed

