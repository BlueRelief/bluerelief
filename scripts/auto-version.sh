#!/bin/bash

set -e

VERSION_FILE="VERSION"

get_version() {
    if [ -f "$VERSION_FILE" ]; then
        cat "$VERSION_FILE"
    else
        echo "0.0.0"
    fi
}

bump_version() {
    local current=$(get_version)
    local bump_type=$1
    
    IFS='.' read -r major minor patch <<< "$current"
    
    case $bump_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
    esac
    
    echo "${major}.${minor}.${patch}"
}

detect_version_bump() {
    local commits="$1"
    
    # Check for breaking changes or major keywords
    if echo "$commits" | grep -iqE "BREAKING CHANGE|MAJOR:|breaking:"; then
        echo "major"
        return
    fi
    
    # Check for features or minor keywords
    if echo "$commits" | grep -iqE "^feat:|^feature:|MINOR:|minor:|new feature"; then
        echo "minor"
        return
    fi
    
    # Default to patch for fixes, chores, docs, etc
    echo "patch"
}

# Get commit messages since last tag or all commits if no tags
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -n "$LAST_TAG" ]; then
    COMMITS=$(git log ${LAST_TAG}..HEAD --pretty=format:"%s")
else
    COMMITS=$(git log --pretty=format:"%s")
fi

# Detect what kind of version bump is needed
BUMP_TYPE=$(detect_version_bump "$COMMITS")

# Get current and new version
CURRENT_VERSION=$(get_version)
NEW_VERSION=$(bump_version "$BUMP_TYPE")

# Output for GitHub Actions
echo "current_version=$CURRENT_VERSION"
echo "new_version=$NEW_VERSION"
echo "bump_type=$BUMP_TYPE"

# Update VERSION file
echo "$NEW_VERSION" > "$VERSION_FILE"

echo "Version bumped: $CURRENT_VERSION -> $NEW_VERSION (type: $BUMP_TYPE)"

