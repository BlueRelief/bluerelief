#!/bin/bash

# Create GitHub labels for automated versioning
# Run this once: ./create-labels.sh

echo "Creating GitHub labels for BlueRelief..."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Install it: https://cli.github.com/"
    echo ""
    echo "Or create labels manually at: https://github.com/YOUR_USERNAME/bluerelief/labels"
    exit 1
fi

# Create version labels
gh label create "version: major" --color "D73A4A" --description "💥 Breaking changes - bumps major version (1.0.0 → 2.0.0)" --force
gh label create "version: minor" --color "0E8A16" --description "✨ New features - bumps minor version (1.0.0 → 1.1.0)" --force
gh label create "version: patch" --color "FBCA04" --description "🐛 Bug fixes - bumps patch version (1.0.0 → 1.0.1)" --force

echo ""
echo "✅ Labels created successfully!"
echo ""
echo "View them at: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/labels"

