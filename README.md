# BlueRelief

Crisis management platform with real-time data processing and visualization.

## Documentation

- [Setup Guide](SETUP.md) - **Start here!** One-time setup for labels and workflows
- [Versioning Guide](VERSIONING.md) - How versioning works and best practices
- [Docker Guide](DOCKER.md) - Docker setup and deployment

## Quick Start

### First Time Setup

Run the setup once:

```bash
# Create GitHub labels (one-time setup)
gh label create 'version: major' --color D73A4A --description 'Breaking changes'
gh label create 'version: minor' --color 0E8A16 --description 'New features'
gh label create 'version: patch' --color FBCA04 --description 'Bug fixes'
# ... (see SETUP.md for all labels)
```

### Daily Workflow

Everything is automated! Just use conventional commit messages:

```bash
# Create a feature branch
git checkout -b feat/awesome-feature

# Make changes with good commit messages
git commit -m "feat: add awesome feature"

# Push and create PR
git push origin feat/awesome-feature
```

**Then:**
1. 🤖 GitHub bot auto-labels your PR with `version: minor`
2. 💬 Bot comments predicting version bump: `1.0.0 → 1.1.0`
3. 📝 Release notes automatically updated
4. ✅ Review and merge
5. 🚀 Version auto-bumps and deploys!

**Check deployed version:**
```bash
curl https://api.private.bluerelief.app/api/version
```

## Project Structure

- `client/` - Next.js frontend application
- `server/` - FastAPI backend application
- `scripts/` - Utility scripts for development and deployment
- `.github/workflows/` - CI/CD workflows

## Features

### 🤖 Automated Versioning
- **PR Auto-labeling**: Labels added based on commit messages
- **Version Prediction**: Bot comments with version bump preview
- **Auto-bump on merge**: Version automatically incremented
- **Release Notes**: Auto-generated from PR titles

### 📋 Supported Commit Types

| Commit Prefix | Version Bump | Example |
|--------------|--------------|---------|
| `feat:` | Minor | `feat: add notifications` |
| `fix:` | Patch | `fix: resolve login bug` |
| `BREAKING CHANGE:` | Major | `BREAKING CHANGE: new API` |
| `chore:` | Patch | `chore: update deps` |

### 🏷️ GitHub Labels

Labels are automatically added to PRs:
- `version: major` 💥 - Breaking changes
- `version: minor` ✨ - New features  
- `version: patch` 🐛 - Bug fixes

## API Version

Check the deployed version:

```bash
curl https://api.private.bluerelief.app/api/version
```