# Versioning Guide

BlueRelief uses **automated semantic versioning** for all releases. Versions are automatically bumped based on your commit messages when deploying to production.

## Version Format

Versions follow semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes or major new features
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes, backwards compatible

## Automated Versioning

### How It Works

#### For Pull Requests (Preview)
When you create or update a PR:

1. **Auto-labeling** - GitHub Actions automatically:
   - Analyzes your PR title, description, and commits
   - Adds a `version: major/minor/patch` label
   - Comments with the predicted version bump
   - Shows you exactly what version will be deployed

2. **Release Notes** - Release Drafter automatically:
   - Generates draft release notes
   - Categorizes changes by type
   - Lists all contributors

#### For Production Deployments
When you merge to `main`:

1. Analyzes commit messages since the last release
2. Determines the version bump type based on keywords
3. Bumps the version accordingly
4. Commits the updated VERSION file
5. Creates a git tag
6. Deploys with the new version

### Commit Message Keywords

Use these keywords in your commit messages to control versioning:

#### MAJOR version bump (1.0.0 → 2.0.0)
```bash
git commit -m "BREAKING CHANGE: removed legacy API endpoints"
git commit -m "MAJOR: complete redesign of authentication"
git commit -m "breaking: changed database schema"
```

#### MINOR version bump (1.0.0 → 1.1.0)
```bash
git commit -m "feat: add real-time notifications"
git commit -m "feature: new dashboard analytics"
git commit -m "MINOR: added user preferences"
```

#### PATCH version bump (1.0.0 → 1.0.1) - DEFAULT
```bash
git commit -m "fix: resolve login bug"
git commit -m "chore: update dependencies"
git commit -m "docs: update README"
```

If no keywords are found, it defaults to a **patch** bump.

## Current Version

The current version is stored in the `VERSION` file at the root of the repository.

```bash
cat VERSION
```

## Manual Version Management (Optional)

While versioning is automated, you can still manually manage versions if needed:

### Using the Version Script

```bash
# Show current version
./scripts/version.sh current

# Bump patch version (1.0.0 -> 1.0.1)
./scripts/version.sh patch

# Bump minor version (1.0.0 -> 1.1.0)
./scripts/version.sh minor

# Bump major version (1.0.0 -> 2.0.0)
./scripts/version.sh major

# Set specific version
./scripts/version.sh set 2.3.4
```

### Testing Auto-Versioning Locally

```bash
# Test what version would be bumped to
./scripts/auto-version.sh
```

This shows what the automated workflow would do based on your commits.

## Deployment Workflow

### Production Deployments

When code is pushed to the `main` branch:

1. The workflow reads the version from the `VERSION` file
2. Builds Docker images with tags:
   - `v{VERSION}-{COMMIT_SHA}` (e.g., `v1.0.0-a1b2c3d`)
   - `latest`
3. Deploys to production with the versioned image
4. Creates a git tag `v{VERSION}` for the release

### Version Information in API

The API exposes version information through multiple endpoints:

```bash
# Root endpoint
curl https://api.private.bluerelief.app/

# Health check
curl https://api.private.bluerelief.app/health

# Version endpoint
curl https://api.private.bluerelief.app/api/version
```

Response includes:
```json
{
  "version": "1.0.0",
  "commit": "a1b2c3d",
  "environment": "production"
}
```

## Release Process

### Automated (Recommended)

1. **Create a Pull Request**:
   ```bash
   git checkout -b feat/new-feature
   git commit -m "feat: add user profile page"
   git push origin feat/new-feature
   ```

2. **GitHub Actions automatically**:
   - 🏷️ Adds version label (`version: minor`)
   - 💬 Comments with predicted version bump
   - 📝 Updates draft release notes

3. **Review the PR**:
   - Check the version prediction comment
   - If wrong, edit your PR title or commits
   - The label and comment update automatically

4. **Merge to main** - the workflow automatically:
   - ⬆️ Bumps version based on commits
   - 💾 Commits VERSION file update
   - 🏷️ Creates git tag
   - 🚀 Builds and deploys Docker images
   - 📦 Updates release notes

5. **Verify deployment**:
   ```bash
   curl https://api.private.bluerelief.app/api/version
   ```

### Manual Override

If you need a specific version:

1. Update VERSION file manually
2. Commit with `[skip ci]` to prevent auto-bump:
   ```bash
   echo "2.0.0" > VERSION
   git add VERSION
   git commit -m "chore: set version to 2.0.0 [skip ci]"
   git push
   ```

## Docker Build Arguments

Both backend and frontend Dockerfiles accept version arguments:

### Backend
```bash
docker build \
  --build-arg VERSION=1.0.0 \
  --build-arg COMMIT_SHA=a1b2c3d \
  -t backend:v1.0.0 .
```

### Frontend
```bash
docker build \
  --build-arg VERSION=1.0.0 \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  -t frontend:v1.0.0 .
```

## Best Practices

1. **Use conventional commit messages** with keywords:
   - `feat:` for new features (triggers MINOR bump)
   - `fix:` for bug fixes (triggers PATCH bump)
   - `BREAKING CHANGE:` for breaking changes (triggers MAJOR bump)
   - `chore:`, `docs:`, `style:` for maintenance (triggers PATCH bump)

2. **Write descriptive commit messages**:
   ```bash
   # Good
   git commit -m "feat: add real-time crisis alerts"
   git commit -m "fix: resolve map rendering issue on mobile"
   
   # Bad
   git commit -m "updates"
   git commit -m "fix stuff"
   ```

3. **Group related changes** in a single PR when possible

4. **Verify version** after deployment:
   ```bash
   curl https://api.private.bluerelief.app/api/version
   ```

## Examples

### Scenario 1: Bug Fix
```bash
# Commits since last release
git commit -m "fix: resolve login timeout issue"
git commit -m "fix: correct chart data formatting"

# Auto-bump: 1.0.0 → 1.0.1 (PATCH)
```

### Scenario 2: New Feature
```bash
# Commits since last release
git commit -m "feat: add export to CSV functionality"
git commit -m "docs: update API documentation"

# Auto-bump: 1.0.0 → 1.1.0 (MINOR)
```

### Scenario 3: Breaking Change
```bash
# Commits since last release
git commit -m "BREAKING CHANGE: migrate to new API v2"
git commit -m "feat: add new authentication flow"

# Auto-bump: 1.0.0 → 2.0.0 (MAJOR)
```

### Scenario 4: Mixed Changes
```bash
# Commits since last release
git commit -m "fix: resolve data feed bug"
git commit -m "feat: add dark mode support"
git commit -m "chore: update dependencies"

# Auto-bump: 1.0.0 → 1.1.0 (MINOR - highest priority wins)
```

## Environment Variables

The following environment variables are set during deployment:

- `VERSION`: The semantic version (e.g., "1.0.0")
- `COMMIT_SHA`: Short git commit hash (e.g., "a1b2c3d")
- `NEXT_PUBLIC_VERSION`: Frontend version (same as VERSION)

## Troubleshooting

### Version not updating in API

Check if environment variables are set:
```bash
docker exec <container> env | grep VERSION
```

### Git tag already exists

Delete the tag locally and remotely:
```bash
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

### Wrong version deployed

1. Update the VERSION file
2. Commit and push to main
3. The workflow will deploy the correct version

