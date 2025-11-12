# Async Avengers - CS554 Final Project

This repository contains the CS554 final project for the Async Avengers team.

## Branch Protection

This repository uses branch protection rules to ensure code quality and require pull request reviews.

### Main Branch Protection

The main branch is protected with the following rules:
- ✅ **Direct pushes are blocked** - All changes must go through pull requests
- ✅ **Pull request reviews required** - At least 1 approval needed before merging
- ✅ **Force pushes are blocked** - Prevents rewriting history
- ✅ **Branch deletion is blocked** - Protects the main branch from accidental deletion

For details on the branch protection configuration, see [.github/BRANCH_PROTECTION.md](.github/BRANCH_PROTECTION.md).

### Applying Branch Protection

If you're a repository administrator and need to apply or update the branch protection rules:

```bash
# Using the provided script
./.github/apply-ruleset.sh

# Or manually via GitHub Settings
# Go to: Settings → Rules → Rulesets
```

## Development Workflow

Since direct pushes to main are blocked, follow this workflow:

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

3. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request on GitHub

5. Request reviews from team members

6. After approval, merge the PR (do not push directly to main)

## Project Structure

```
.
├── .github/                    # GitHub configuration
│   ├── main-branch-ruleset.json  # Branch protection ruleset config
│   ├── apply-ruleset.sh          # Script to apply ruleset
│   └── BRANCH_PROTECTION.md      # Documentation for branch protection
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## Getting Started

(Add your project-specific setup instructions here)

## Contributing

All contributions must be made through pull requests. Direct pushes to the main branch are not allowed.

1. Fork the repository (if external contributor)
2. Create a feature branch
3. Make your changes
4. Submit a pull request
5. Wait for review and approval
6. Merge after approval

## License

(Add your license information here)
