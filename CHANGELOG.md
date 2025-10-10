# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-10

### Added
- **🤖 Automated PR Agent** - Free GitHub Actions-based automation
  - Auto-labels PRs with `version: major/minor/patch` based on commits
  - Comments on PRs with predicted version bump
  - Automatically generates release notes with Release Drafter
  - Categorizes changes by type (features, fixes, breaking changes)
  - No third-party services needed - 100% GitHub native!

- **Automated semantic versioning** based on commit messages
  - Analyzes commits and auto-bumps version on deployment
  - Supports conventional commit keywords (feat, fix, BREAKING CHANGE)
  - No manual version management needed!

- **Scripts & Tools**
  - Auto-version script (`scripts/auto-version.sh`)
  - Manual version management script (`scripts/version.sh`) for overrides
  - Label setup helper (`scripts/setup-labels.sh`)

- **API Version Endpoints**
  - `/` - Root endpoint now includes version and commit
  - `/health` - Health check includes version and commit
  - `/api/version` - Dedicated version endpoint

- **Docker & Deployment**
  - VERSION and COMMIT_SHA build arguments in all Dockerfiles
  - Automatic git tagging on production deployments
  - Docker images now tagged with both `v{VERSION}-{COMMIT}` and `latest`

- **Documentation**
  - Comprehensive versioning guide (VERSIONING.md)
  - Setup guide for one-time configuration (SETUP.md)
  - GitHub labels configuration (.github/labels.yml)
  - Release drafter configuration (.github/release-drafter.yml)

### Changed
- Production deployment workflow now auto-bumps versions
  - Reads commit history and determines bump type
  - Commits version update back to repository
  - Shows version change in deployment logs
- Updated main.py to read and expose version information
- Enhanced deployment notifications with version bump details

### How It Works

#### On Pull Request:
1. Create PR with conventional commit messages
2. GitHub Actions bot automatically:
   - Analyzes PR title, description, and commits
   - Adds appropriate `version:` label
   - Comments with predicted version bump
   - Updates draft release notes
3. Review PR and check version prediction
4. Edit commits/title if needed - bot updates automatically

#### On Merge to Main:
1. Workflow analyzes commits for keywords:
   - `BREAKING CHANGE` / `MAJOR:` → major bump (1.0.0 → 2.0.0)
   - `feat:` / `feature:` → minor bump (1.0.0 → 1.1.0)
   - `fix:` / `chore:` / `docs:` → patch bump (1.0.0 → 1.0.1)
2. Version automatically bumped and committed
3. Docker images built with version tag
4. Deployed to production with git tag
5. Release notes published

### Technical Details
- Backend Docker images: `v{VERSION}-{COMMIT_SHA}` format
- Frontend Docker images: `v{VERSION}-{COMMIT_SHA}` format
- Environment variables: VERSION, COMMIT_SHA, NEXT_PUBLIC_VERSION
- FastAPI version set dynamically from VERSION file
- Commit with `[skip ci]` to prevent auto-versioning when needed

