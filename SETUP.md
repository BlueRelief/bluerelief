# Setup Guide

This guide helps you set up the automated versioning system for BlueRelief.

## One-Time Setup

### 1. Create GitHub Labels

The automated PR agent needs specific labels to work. You have three options:

#### Option A: Using GitHub CLI (Easiest)

If you have [GitHub CLI](https://cli.github.com/) installed:

```bash
gh label create 'version: major' --color D73A4A --description 'Breaking changes - bumps major version (1.0.0 → 2.0.0)'
gh label create 'version: minor' --color 0E8A16 --description 'New features - bumps minor version (1.0.0 → 1.1.0)'
gh label create 'version: patch' --color FBCA04 --description 'Bug fixes - bumps patch version (1.0.0 → 1.0.1)'
gh label create 'breaking' --color D73A4A --description 'Breaking changes'
gh label create 'feature' --color 0E8A16 --description 'New feature'
gh label create 'bug' --color D73A4A --description 'Bug fix'
gh label create 'enhancement' --color 84B6EB --description 'Enhancement'
gh label create 'documentation' --color 0075CA --description 'Documentation'
gh label create 'infrastructure' --color 6F42C1 --description 'Infrastructure/CI/CD'
gh label create 'chore' --color FEF2C0 --description 'Maintenance'
```

#### Option B: Using GitHub Web Interface

1. Go to your repository on GitHub
2. Click on "Issues" tab
3. Click on "Labels" button
4. Click "New label" and create each label from `.github/labels.yml`

#### Option C: Using Label Sync Action

Install the [Label Sync GitHub Action](https://github.com/marketplace/actions/label-syncer) to automatically sync labels from `.github/labels.yml`.

### 2. Verify Workflows

Make sure all workflow files are present:

```bash
ls -la .github/workflows/
```

You should see:
- `deploy-production.yml` - Auto-bump version and deploy
- `label-pr.yml` - Auto-label PRs with version type
- `release-drafter.yml` - Generate release notes

### 3. Test the System

Create a test PR:

```bash
git checkout -b test/versioning
echo "test" > test.txt
git add test.txt
git commit -m "feat: test automated versioning"
git push origin test/versioning
```

Then create a PR on GitHub. You should see:
1. A `version: minor` label added automatically
2. A comment predicting the version bump
3. Draft release notes updated

## How It Works

### Pull Request Flow

```
Create PR → Auto-label → Comment with prediction → Review → Merge
                ↓                    ↓                         ↓
           version label      shows what version      version bumps
                                  will be            & deploys
```

### Commit Message Patterns

The system recognizes these patterns:

| Pattern | Version Bump | Example |
|---------|-------------|---------|
| `BREAKING CHANGE:` | Major | `BREAKING CHANGE: removed API v1` |
| `MAJOR:` | Major | `MAJOR: redesign database schema` |
| `feat:` | Minor | `feat: add notifications` |
| `feature:` | Minor | `feature: user profiles` |
| `fix:` | Patch | `fix: resolve login bug` |
| `chore:` | Patch | `chore: update deps` |
| `docs:` | Patch | `docs: update README` |

### Version Precedence

If multiple types are detected, the highest priority wins:

1. **Major** (highest priority)
2. **Minor**
3. **Patch** (default/fallback)

Example:
```bash
git commit -m "feat: new feature"
git commit -m "fix: bug fix"
# Result: MINOR bump (feat takes precedence over fix)
```

## Troubleshooting

### Labels not being added

1. Check workflow permissions in `.github/workflows/label-pr.yml`
2. Verify labels exist in your repository
3. Check GitHub Actions logs

### Wrong version predicted

Edit your PR title or commit messages:
- PR title is checked first
- Commit messages are checked next
- The bot will update automatically

### Version not bumping on merge

1. Check `.github/workflows/deploy-production.yml` has `contents: write` permission
2. Verify the workflow is running (check Actions tab)
3. Look for `[skip ci]` in commit messages (this prevents auto-bump)

### Release notes not generating

1. Ensure Release Drafter action is installed
2. Check `.github/release-drafter.yml` configuration
3. Verify PRs have proper labels

## Examples

### Example 1: Simple Feature

```bash
# Create branch
git checkout -b feat/user-search

# Make changes and commit
git commit -m "feat: add user search functionality"

# Push and create PR
git push origin feat/user-search
```

**Result**: Bot labels as `version: minor`, predicts `1.0.0 → 1.1.0`

### Example 2: Breaking Change

```bash
# Create branch
git checkout -b breaking/api-v2

# Make changes and commit
git commit -m "BREAKING CHANGE: migrate to API v2"
git commit -m "feat: add new endpoints"

# Push and create PR
git push origin breaking/api-v2
```

**Result**: Bot labels as `version: major`, predicts `1.0.0 → 2.0.0`

### Example 3: Bug Fix

```bash
# Create branch
git checkout -b fix/login-timeout

# Make changes and commit
git commit -m "fix: resolve login timeout after 1 hour"

# Push and create PR
git push origin fix/login-timeout
```

**Result**: Bot labels as `version: patch`, predicts `1.0.0 → 1.0.1`

## Advanced Usage

### Manual Version Override

If you need a specific version:

```bash
# Set version manually
echo "3.0.0" > VERSION
git add VERSION
git commit -m "chore: set version to 3.0.0 [skip ci]"
git push
```

The `[skip ci]` prevents the auto-bump workflow from running.

### Testing Locally

Test what version would be bumped:

```bash
./scripts/auto-version.sh
```

This shows the prediction without making changes.

### Viewing Release History

Check all releases:
- GitHub: Go to Releases tab
- Git tags: `git tag -l`
- API: `curl https://api.private.bluerelief.app/api/version`

## Best Practices

1. **Use conventional commits** for clear version intentions
2. **Review PR labels** before merging
3. **Group related changes** in single PRs
4. **Write descriptive commit messages** for better release notes
5. **Check version prediction** before merging

## Need Help?

- Check [VERSIONING.md](VERSIONING.md) for detailed versioning guide
- Review GitHub Actions logs for errors
- Verify labels exist in repository settings

