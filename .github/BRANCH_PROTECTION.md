# Main Branch Protection Ruleset

This directory contains the configuration for protecting the main branch from direct pushes and requiring PR merging.

## Ruleset Configuration

The `main-branch-ruleset.json` file defines the following protections for the main branch:

### Key Protections

1. **Pull Request Required**: All changes to main must go through a pull request
   - Requires at least 1 approving review before merging
   - Dismisses stale reviews when new commits are pushed
   - Requires all review threads to be resolved

2. **No Direct Pushes**: Direct pushes to main are blocked
   - Enforced through the `pull_request` rule
   - Non-fast-forward pushes are prevented

3. **Branch Protection**:
   - Branch cannot be deleted
   - Requires linear history (no merge commits allowed from direct pushes)
   - Status checks must pass before merging (if configured)

## How to Apply This Ruleset

### Option 1: Using GitHub CLI (Recommended)

```bash
# Make sure you have GitHub CLI installed and authenticated
gh auth login

# Create the ruleset for the repository
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/anikdoshi2003/async-avengers-cs554-final-project/rulesets \
  --input .github/main-branch-ruleset.json
```

### Option 2: Using GitHub Web UI

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. In the left sidebar, click on **Rules** → **Rulesets**
4. Click **New ruleset** → **New branch ruleset**
5. Configure the ruleset with these settings:
   - **Name**: Main Branch Protection
   - **Enforcement status**: Active
   - **Target branches**: Add branch → Include by pattern → `main`
   - **Branch protections**:
     - ✅ Require a pull request before merging
       - Required approvals: 1
       - Dismiss stale reviews when new commits are pushed
       - Require review thread resolution
     - ✅ Require status checks to pass
     - ✅ Block force pushes
     - ✅ Require linear history
   - **Bypass list**: Leave empty (no one can bypass)
6. Click **Create**

### Option 3: Using GitHub REST API

```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/anikdoshi2003/async-avengers-cs554-final-project/rulesets \
  -d @.github/main-branch-ruleset.json
```

## What This Achieves

Once applied, this ruleset will:

- ✅ **Block all direct pushes to main** - Developers cannot push commits directly to main
- ✅ **Require pull requests** - All changes must go through the PR review process
- ✅ **Require reviews** - At least one approval is needed before merging
- ✅ **Prevent force pushes** - No one can force push to main (unless bypassed)
- ✅ **Prevent branch deletion** - The main branch cannot be accidentally deleted
- ✅ **Require linear history** - Maintains a clean commit history

## Testing the Ruleset

After applying the ruleset, you can test it by:

1. Try to push directly to main:
   ```bash
   git checkout main
   git commit --allow-empty -m "Test direct push"
   git push origin main
   ```
   This should be **rejected** with an error message about branch protection rules.

2. Create a pull request instead:
   ```bash
   git checkout -b feature/test-branch
   git commit --allow-empty -m "Test PR"
   git push origin feature/test-branch
   # Then create a PR on GitHub
   ```
   This should **succeed**, and you can merge via PR after review.

## Troubleshooting

- **Error: "Resource not accessible by integration"**: You need admin permissions to create rulesets
- **Error: "Ruleset already exists"**: A ruleset with the same name already exists, either delete it or modify the existing one
- **Bypassing the ruleset**: Only repository admins can configure bypass actors in the ruleset settings

## Additional Resources

- [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub REST API - Rulesets](https://docs.github.com/en/rest/repos/rules)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
