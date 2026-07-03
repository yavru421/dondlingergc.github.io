# Git and Deployment Workflow

## Cloudflare Deployment Branch
- **Deployment Branch**: The deployment branch is `production`, not `main`.
- **Workflow**: 
  1. Commit changes to `main` (or a feature branch).
  2. Switch/merge to `production`.
  3. Push to `origin/production` to trigger Cloudflare CI deployment.
- **Rules**: Never run `wrangler deploy` directly.
