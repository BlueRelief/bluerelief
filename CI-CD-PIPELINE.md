# CI/CD Pipeline Documentation

## 🚀 Pipeline Flow

```
┌──────────────────────────────────────────────────────────┐
│                    PR or Push to Main                     │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Step 1: Setup & Version                                  │
│  • Predict version bump (preview)                         │
│  • Auto-bump version (production)                         │
│  • Generate image tags                                    │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Step 2: Lint & Format ✨ NEW!                           │
│  • Auto-format Python with Black                          │
│  • Auto-format TypeScript/React with Prettier             │
│  • Commit changes back to branch [skip ci]                │
│  ⚠️  If formatting fails, pipeline stops here             │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Step 3: Build Docker Images (Matrix)                     │
│  • Backend (Python/FastAPI)                               │
│  • Frontend (Next.js)                                     │
│  • Email Service (Node.js/Express)                        │
│  • Push to registry                                       │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Step 4: Deploy to Kubernetes                             │
│  • Helm upgrade with new image tags                       │
│  • Update environment variables                           │
│  • Wait for rollout                                       │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Step 5: Notify (Preview Only)                            │
│  • Comment on PR with deployment URLs                     │
│  • Show version prediction                                │
│  • Include auth instructions                              │
└──────────────────────────────────────────────────────────┘
```

## 📋 Workflows

### 1. `deploy-preview.yml` (Pull Requests)

**Triggers:** When PR is opened, synchronized, or reopened

**Jobs:**
1. **setup** - Predicts version bump and generates environment variables
2. **lint-format** ✨ - Auto-formats code before building
3. **build** - Builds and pushes Docker images (matrix: backend, frontend, email-service)
4. **deploy** - Deploys to Kubernetes with preview subdomain
5. **deploy-preview** - Final status check and notification

**Preview URLs:**
- Frontend: `https://{branch-name}.private.bluerelief.app`
- Backend: `https://api-{branch-name}.private.bluerelief.app`
- Email Service: `https://email-api-{branch-name}.private.bluerelief.app`

### 2. `deploy-production.yml` (Main Branch)

**Triggers:** Push to `main` branch

**Jobs:**
1. **version** - Auto-bumps version based on commit messages
2. **lint-format** ✨ - Auto-formats code before building
3. **build** - Builds and pushes Docker images with version tags
4. **deploy** - Deploys to production Kubernetes cluster

**Version Bumping:**
- `BREAKING CHANGE` or `breaking:` → Major (1.0.0 → 2.0.0)
- `feat:` or `feature:` → Minor (1.0.0 → 1.1.0)
- `fix:`, `chore:`, `docs:` → Patch (1.0.0 → 1.0.1)

### 3. `lint-and-format.yml` (Manual/Optional)

**Triggers:** Manual trigger or push to main/develop (no PRs)

**Purpose:** Standalone formatting workflow for quick fixes

**Note:** This is now optional since deployments auto-format code

### 4. `cleanup-preview.yml`

**Triggers:** When PR is closed or merged

**Purpose:** Removes preview deployments from Kubernetes

## ✨ New: Auto-Formatting in Pipeline

### What Changed?

**Before:** Code had to be manually formatted locally before pushing

**After:** CI automatically formats code before building

### How It Works

1. **Checkout code** from your branch
2. **Run formatters:**
   - Backend: `black --line-length 88 --preview ./server`
   - Frontend: `prettier --write "client/**/*.{ts,tsx,js,jsx,mjs,json,css}"`
   - Email Service: `prettier --write "email-service/**/*.{ts,tsx,js}"`
3. **Commit changes** back to your branch with `[skip ci]` tag
4. **Continue to build** with properly formatted code

### Benefits

✅ No more "code not formatted" errors blocking deployments  
✅ Consistent code style across all services  
✅ Developers don't need to remember to run formatters locally  
✅ Fast feedback - formatting happens in ~30 seconds  

## 🔧 Local Development

### Format Code Locally (Optional but Recommended)

```bash
# All services at once
./scripts/format-all.sh

# Individual services
cd client && pnpm format
cd server && black . && isort . && ruff check --fix .
cd email-service && pnpm format
```

### Check Status Before Pushing

```bash
# Frontend
cd client && pnpm format:check

# Backend
cd server && black --check .

# Email Service
cd email-service && pnpm format:check
```

## 📊 CI/CD Checks You'll See

When you create or update a PR:

```
✓ setup                      (Generates version and tags)
✓ lint-format                (Auto-formats code) ✨ NEW!
✓ build (backend)            (Builds Python Docker image)
✓ build (frontend)           (Builds Next.js Docker image)
✓ build (email-service)      (Builds Node Docker image)
✓ deploy                     (Deploys to K8s preview)
✓ deploy-preview             (Final status check)
✓ label-pr                   (Auto-labels based on changes)
```

## 🎯 Configuration Files

### Prettier (TypeScript/JavaScript)
- `.prettierrc` (root, client, email-service)
- Single quotes, trailing commas, 100 char width
- Tailwind CSS class sorting (frontend only)

### Black (Python)
- `pyproject.toml`
- 88 char line length, Python 3.13 target
- Preview features enabled

### Docker
- `client/Dockerfile.prod` - Next.js production build
- `server/Dockerfile.prod` - FastAPI production build
- `email-service/Dockerfile` - Express production build

## 🚨 Troubleshooting

### "Formatting failed" error

**Cause:** Syntax error in code prevents formatter from running

**Solution:** Fix the syntax error locally and push again

### Build fails after formatting

**Cause:** Formatted code introduced a linter error (rare)

**Solution:** Check the build logs, fix locally, push again

### Deployment hangs

**Cause:** Kubernetes resources not ready

**Solution:** Check Helm status: `helm status bluerelief-{branch-name} -n bluerelief`

## 💡 Best Practices

1. **Let CI format for you** - Don't worry about running formatters locally
2. **Review auto-commits** - Check the formatting changes CI makes
3. **Use semantic commits** - Controls version bumping (`feat:`, `fix:`, etc.)
4. **Test in preview** - Always test your changes in the preview deployment
5. **Keep PRs focused** - Smaller PRs = faster reviews and deployments

## 🔗 Related Files

- `.prettierrc` - Prettier configuration
- `pyproject.toml` - Python tool configuration
- `scripts/format-all.sh` - Local formatting script
- `.github/workflows/` - All CI/CD workflows

## 📚 Additional Resources

- [Black Documentation](https://black.readthedocs.io/)
- [Prettier Documentation](https://prettier.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Helm Charts](https://helm.sh/)

