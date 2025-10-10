#!/bin/bash

set -e

VERSION_FILE="VERSION"

show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  current              Show current version"
    echo "  patch                Bump patch version (1.0.0 -> 1.0.1)"
    echo "  minor                Bump minor version (1.0.0 -> 1.1.0)"
    echo "  major                Bump major version (1.0.0 -> 2.0.0)"
    echo "  set <version>        Set specific version (e.g., 2.3.4)"
    echo ""
    echo "Examples:"
    echo "  $0 current"
    echo "  $0 patch"
    echo "  $0 set 2.0.0"
}

get_version() {
    if [ -f "$VERSION_FILE" ]; then
        cat "$VERSION_FILE"
    else
        echo "1.0.0"
    fi
}

parse_version() {
    local version=$1
    echo "$version" | sed 's/v//'
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

set_version() {
    local new_version=$(parse_version "$1")
    
    if [[ ! $new_version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "Error: Invalid version format. Use semantic versioning (e.g., 1.2.3)"
        exit 1
    fi
    
    echo "$new_version" > "$VERSION_FILE"
    echo "Version updated to $new_version"
}

case "${1:-}" in
    current)
        echo "Current version: $(get_version)"
        ;;
    major|minor|patch)
        current=$(get_version)
        new_version=$(bump_version "$1")
        echo "$new_version" > "$VERSION_FILE"
        echo "Version bumped: $current -> $new_version"
        ;;
    set)
        if [ -z "${2:-}" ]; then
            echo "Error: Version number required"
            show_usage
            exit 1
        fi
        set_version "$2"
        ;;
    -h|--help|help)
        show_usage
        ;;
    *)
        echo "Error: Unknown command '${1:-}'"
        echo ""
        show_usage
        exit 1
        ;;
esac

