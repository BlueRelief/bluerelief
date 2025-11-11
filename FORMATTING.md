# Code Formatting & Linting Guide

This project uses automated code formatting and linting for all services to maintain consistent code quality.

## 🚀 Quick Start

### Local Development

Run these commands in your local environment before committing:

#### Backend (Python)
```bash
# From project root
cd server/

# Format code
black --line-length 88 --preview .
isort --profile black .
ruff check --fix .
```

#### Frontend (Next.js)
```bash
# From project root
cd client/

# Install prettier (first time only)
pnpm add -D prettier prettier-plugin-tailwindcss

# Format and lint
pnpm format
pnpm lint:fix
```

#### Email Service
```bash
# From project root
cd email-service/

# Install prettier (first time only)
pnpm add -D prettier

# Format code
pnpm format
```

### All Services at Once
```bash
# Run from project root
./scripts/format-all.sh
```

## 🤖 CI/CD Automation

### GitHub Actions Workflow

The CI/CD pipeline automatically runs on:
- Pull requests that modify code in `server/`, `client/`, or `email-service/`
- Pushes to `main` or `develop` branches

**What happens:**
1. ✅ Code is checked out
2. 🔧 Formatters and linters run (with auto-fix enabled)
3. 📝 If changes are made, they're automatically committed and pushed back
4. ✨ Your PR/branch now has properly formatted code

### Workflow Jobs

The workflow runs **3 separate jobs in parallel** for better visibility:

1. **format-backend** - Python formatting with Black, isort, and Ruff
2. **format-frontend** - TypeScript/React formatting with Prettier and ESLint
3. **format-email-service** - TypeScript formatting with Prettier

Each job only runs if relevant files were changed.

## 📋 Configuration Files

### Backend (Python)
- `pyproject.toml` - Configuration for Black, isort, and Ruff
  - Line length: 88 characters
  - Target: Python 3.13
  - Profile: Black-compatible

### Frontend & Email Service (TypeScript)
- `.prettierrc` - Prettier configuration
  - Semi-colons: enabled
  - Quote style: double quotes
  - Print width: 100 characters
  - Tab width: 2 spaces
  - Tailwind CSS class sorting (frontend only)

- `eslint.config.mjs` (frontend only) - ESLint configuration
  - Extends Next.js recommended rules
  - TypeScript support enabled

## 🛠️ Tools Used

### Backend
- **Black** - Opinionated Python formatter
- **isort** - Import statement organizer
- **Ruff** - Fast Python linter with auto-fix

### Frontend & Email Service
- **Prettier** - Opinionated code formatter
- **ESLint** - JavaScript/TypeScript linter
- **prettier-plugin-tailwindcss** - Sorts Tailwind classes (frontend only)

## 💡 Best Practices

1. **Run formatting before committing** - Use the provided scripts
2. **Don't fight the formatter** - Accept the automated style choices
3. **Fix linter errors** - Don't ignore them or disable rules without reason
4. **Keep configurations consistent** - Don't create service-specific overrides

## 🔧 Troubleshooting

### "Prettier not found" error
```bash
# Install prettier in the specific service
cd client/  # or email-service/
pnpm add -D prettier
```

### "Black/isort/ruff not found" error
```bash
# Install Python formatting tools
pip install black isort ruff
```

### CI job failing
1. Pull the latest changes from your PR branch
2. Run formatters locally
3. Commit and push
4. CI should pass on the next run

## 🎯 Why Stages Instead of Matrix?

The workflow uses **separate jobs (stages)** rather than a matrix strategy because:

✅ **Clearer status** - Each service shows independently in PR checks  
✅ **Better logs** - Easier to debug which service failed  
✅ **Parallel execution** - Still runs concurrently for speed  
✅ **Flexible triggers** - Each job only runs when relevant files change  
✅ **Isolation** - Failures in one service don't block others

## 📚 Additional Resources

- [Black Documentation](https://black.readthedocs.io/)
- [Prettier Documentation](https://prettier.io/)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [ESLint Documentation](https://eslint.org/)

