# BlueRelief

Crisis management platform with real-time data processing and visualization.

## Quick Start

### Automated Versioning

Versioning is fully automated! Just use conventional commit messages:

```bash
# For new features (bumps minor: 1.0.0 → 1.1.0)
git commit -m "feat: add notifications"

# For bug fixes (bumps patch: 1.0.0 → 1.0.1)
git commit -m "fix: resolve login bug"

# For breaking changes (bumps major: 1.0.0 → 2.0.0)
git commit -m "BREAKING CHANGE: new API"
```

When you merge to `main`, the version auto-bumps and deploys! 🚀

### Check Version

```bash
# Current version
cat VERSION

# Deployed version
curl https://api.private.bluerelief.app/api/version
```

## Project Structure

- `client/` - Next.js frontend
- `server/` - FastAPI backend
- `scripts/` - Utility scripts
- `.github/workflows/` - CI/CD automation

## Commit Types

| Prefix | Bump | Example |
|--------|------|---------|
| `feat:` | Minor | `feat: add feature` |
| `fix:` | Patch | `fix: bug fix` |
| `BREAKING CHANGE:` | Major | `BREAKING CHANGE: api change` |
| `chore:` | Patch | `chore: update deps` |
| `docs:` | Patch | `docs: update readme` |