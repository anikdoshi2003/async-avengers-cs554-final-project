#!/bin/bash

# Script to apply the main branch protection ruleset
# Requires: GitHub CLI (gh) installed and authenticated

set -e

REPO_OWNER="anikdoshi2003"
REPO_NAME="async-avengers-cs554-final-project"
RULESET_FILE=".github/main-branch-ruleset.json"

echo "🔒 Applying main branch protection ruleset..."
echo "Repository: ${REPO_OWNER}/${REPO_NAME}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Error: Not authenticated with GitHub CLI."
    echo "Please run: gh auth login"
    exit 1
fi

# Check if ruleset file exists
if [ ! -f "$RULESET_FILE" ]; then
    echo "❌ Error: Ruleset file not found: $RULESET_FILE"
    exit 1
fi

echo "📋 Ruleset configuration:"
cat "$RULESET_FILE"
echo ""

# Apply the ruleset
echo "⏳ Creating ruleset..."
if gh api \
    --method POST \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/${REPO_OWNER}/${REPO_NAME}/rulesets" \
    --input "$RULESET_FILE"; then
    echo ""
    echo "✅ Success! Main branch protection ruleset has been applied."
    echo ""
    echo "The following protections are now active on the main branch:"
    echo "  ✓ Direct pushes are blocked"
    echo "  ✓ Pull requests are required"
    echo "  ✓ At least 1 review approval is required"
    echo "  ✓ Force pushes are blocked"
    echo "  ✓ Branch deletion is blocked"
    echo ""
    echo "You can view and manage rulesets at:"
    echo "https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/rules"
else
    echo ""
    echo "❌ Failed to create ruleset."
    echo "This could be because:"
    echo "  - You don't have admin permissions on the repository"
    echo "  - A ruleset with the same name already exists"
    echo "  - The API endpoint or format has changed"
    echo ""
    echo "Try applying the ruleset manually via GitHub's web interface:"
    echo "https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/rules"
    exit 1
fi
