#!/bin/bash

# Setup GitHub labels for the repository
# Run this once to create all the labels

REPO="bluerelief"
OWNER="your-github-username"

# You can also use gh CLI if installed: gh label create "name" --color "color" --description "desc"

echo "Setting up GitHub labels..."
echo ""
echo "To create labels, you have two options:"
echo ""
echo "Option 1: Use GitHub CLI (recommended)"
echo "  gh label create 'version: major' --color D73A4A --description 'Breaking changes - bumps major version'"
echo "  gh label create 'version: minor' --color 0E8A16 --description 'New features - bumps minor version'"
echo "  gh label create 'version: patch' --color FBCA04 --description 'Bug fixes - bumps patch version'"
echo "  gh label create 'breaking' --color D73A4A --description 'Breaking changes'"
echo "  gh label create 'feature' --color 0E8A16 --description 'New feature'"
echo "  gh label create 'bug' --color D73A4A --description 'Bug fix'"
echo "  gh label create 'enhancement' --color 84B6EB --description 'Enhancement'"
echo "  gh label create 'documentation' --color 0075CA --description 'Documentation'"
echo "  gh label create 'infrastructure' --color 6F42C1 --description 'Infrastructure/CI/CD'"
echo "  gh label create 'chore' --color FEF2C0 --description 'Maintenance'"
echo ""
echo "Option 2: Use the GitHub web interface"
echo "  Go to: https://github.com/${OWNER}/${REPO}/labels"
echo "  Create the labels manually from .github/labels.yml"
echo ""
echo "Option 3: Run the label sync action (if you have one set up)"

