#!/bin/bash

# Script to extract a specific version's changelog from a package's CHANGELOG.md
# Usage: ./extract-changelog.sh <package-dir> <version>
# Example: ./extract-changelog.sh fast-check 4.5.2
# Example: ./extract-changelog.sh ava 2.0.2

# Check if correct number of arguments provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <package-dir> <version>" >&2
    echo "Example: $0 fast-check 4.5.2" >&2
    echo "Example: $0 ava 2.0.2" >&2
    exit 1
fi

PACKAGE_DIR="$1"
VERSION="$2"

# Determine the path to the CHANGELOG.md file
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHANGELOG_PATH="${REPO_ROOT}/packages/${PACKAGE_DIR}/CHANGELOG.md"

# Check if CHANGELOG.md exists
if [ ! -f "$CHANGELOG_PATH" ]; then
    echo "Error: CHANGELOG.md not found at $CHANGELOG_PATH" >&2
    exit 1
fi

# Extract the section for the specified version
# Strategy: Use awk to extract content between version header and next version header or separator
awk -v version="$VERSION" '
    BEGIN {
        found = 0
        printing = 0
    }
    
    # Match version header (e.g., "# 4.5.2")
    /^# / {
        # Extract version from the header line (everything after "# ")
        header_version = substr($0, 3)
        if (header_version == version) {
            found = 1
            printing = 1
            print
            next
        } else if (printing) {
            # We hit the next version header, stop printing
            exit
        }
        next
    }
    
    # Match separator line (---)
    /^---$/ {
        if (printing) {
            # Stop before the separator
            exit
        }
        next
    }
    
    # Print lines if we are in the target version section
    printing {
        print
    }
    
    END {
        if (!found) {
            print "Error: Version " version " not found in CHANGELOG" > "/dev/stderr"
            exit 1
        }
    }
' "$CHANGELOG_PATH"
exit_code=$?
exit $exit_code
