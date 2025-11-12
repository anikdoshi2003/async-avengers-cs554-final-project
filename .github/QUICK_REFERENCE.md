# Quick Reference: Branch Protection Workflow

## For Developers

### ❌ What You CANNOT Do Anymore
```bash
# This will be REJECTED:
git checkout main
git commit -m "Direct commit to main"
git push origin main
# Error: main branch is protected
```

### ✅ What You SHOULD Do Instead

#### 1. Create a Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/my-new-feature
```

#### 2. Make Your Changes
```bash
# Edit your files
git add .
git commit -m "Add new feature"
```

#### 3. Push Your Branch
```bash
git push origin feature/my-new-feature
```

#### 4. Create a Pull Request
- Go to GitHub repository
- Click "Compare & pull request"
- Fill in PR description
- Request reviews from team members
- Wait for approval

#### 5. Merge After Approval
- Once approved, click "Merge pull request" on GitHub
- Delete the feature branch after merging

## For Repository Administrators

### Applying the Ruleset

#### Option 1: Using the Script (Recommended)
```bash
cd /path/to/repository
./.github/apply-ruleset.sh
```

**Requirements:**
- GitHub CLI installed (`gh`)
- Authenticated with GitHub (`gh auth login`)
- Admin permissions on the repository

#### Option 2: Using GitHub CLI Manually
```bash
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/anikdoshi2003/async-avengers-cs554-final-project/rulesets \
  --input .github/main-branch-ruleset.json
```

#### Option 3: Using GitHub Web UI
1. Go to: https://github.com/anikdoshi2003/async-avengers-cs554-final-project/settings/rules
2. Click "New ruleset" → "New branch ruleset"
3. Set name: "Main Branch Protection"
4. Set enforcement: "Active"
5. Target branches: `main`
6. Enable:
   - ✅ Require pull request (1 approval)
   - ✅ Require status checks
   - ✅ Block force pushes
   - ✅ Require linear history
7. Click "Create"

### Viewing Current Rulesets
```bash
gh api \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/anikdoshi2003/async-avengers-cs554-final-project/rulesets
```

### Updating an Existing Ruleset
```bash
# Get ruleset ID first
gh api /repos/anikdoshi2003/async-avengers-cs554-final-project/rulesets

# Update with the ID
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/anikdoshi2003/async-avengers-cs554-final-project/rulesets/{ruleset_id} \
  --input .github/main-branch-ruleset.json
```

### Deleting a Ruleset
```bash
gh api \
  --method DELETE \
  -H "Accept: application/vnd.github+json" \
  /repos/anikdoshi2003/async-avengers-cs554-final-project/rulesets/{ruleset_id}
```

## Testing the Protection

### Test 1: Try Direct Push (Should Fail)
```bash
git checkout main
git commit --allow-empty -m "Test direct push"
git push origin main
# Expected: Error about branch protection
```

### Test 2: Use PR Workflow (Should Succeed)
```bash
git checkout -b test/branch-protection
git commit --allow-empty -m "Test PR workflow"
git push origin test/branch-protection
# Then create PR on GitHub and merge
# Expected: Success after approval
```

## Common Issues

### "Permission denied" when pushing
- **Cause:** Branch protection is working correctly
- **Solution:** Use the PR workflow instead

### "Required approving reviews not met"
- **Cause:** PR doesn't have enough approvals
- **Solution:** Request reviews and wait for approval

### "Status checks failed"
- **Cause:** CI/CD checks are failing
- **Solution:** Fix the failing checks before merging

### Cannot bypass protection
- **Cause:** No bypass actors configured
- **Solution:** Only admins can configure bypass in ruleset settings if needed

## Additional Resources

- [Full Documentation](.github/BRANCH_PROTECTION.md)
- [GitHub Rulesets Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
