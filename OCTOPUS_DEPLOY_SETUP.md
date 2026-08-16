# Octopus Deploy Workflow Setup

This document outlines the required configuration for the GitHub Actions Octopus Deploy workflow.

## Required Secrets

The following secrets must be configured in GitHub repository settings under **Settings > Secrets and variables > Actions**:

### Essential Secrets
- **OCTOPUS_SERVER**: The URL of your Octopus Deploy server (e.g., `https://octopus.example.com`)
- **OCTOPUS_APIKEY**: API key for authentication with Octopus Deploy
- **OCTOPUS_PROJECT**: The Octopus Deploy project name to deploy

### Optional Secrets
- **OCTOPUS_SPACE**: Octopus Deploy space ID (if using spaces)
- **DEPLOYMENT_NOTIFICATION_URL**: Webhook URL for deployment notifications (e.g., Slack, Teams)

## Environment Variables

The workflow sets the following environment variables:
- `NODE_ENV`: Set to `production` for all production deployments
- `OCTOPUS_SERVER`, `OCTOPUS_APIKEY`: Octopus Deploy credentials
- `OCTOPUS_PROJECT`: Target project for deployment
- `OCTOPUS_RELEASE_VERSION`: Automatically set to the Git commit SHA

## Setup Instructions

### 1. Create Octopus Deploy API Key

1. Log in to your Octopus Deploy server
2. Navigate to **Configuration > API Keys**
3. Create a new API key for the GitHub Actions service account
4. Copy the API key

### 2. Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings > Secrets and variables > Actions**
3. Click **New repository secret**
4. Add the following secrets:
   - `OCTOPUS_SERVER`: Your Octopus Deploy server URL
   - `OCTOPUS_APIKEY`: The API key from step 1
   - `OCTOPUS_PROJECT`: Your Octopus Deploy project name

### 3. Configure Production Environment (Recommended)

To add approval gates for production deployments:

1. Go to **Settings > Environments**
2. Create a new environment called `production`
3. Under **Deployment branches and tags**, select "Protected branches"
4. Optionally add required reviewers for deployment approval

### 4. Verify npm Scripts

Ensure the following npm scripts are defined in `package.json`:
```json
{
  "scripts": {
    "build": "your build command",
    "deploy": "your deploy command that uses Octopus Deploy"
  }
}
```

## Workflow Behavior

The workflow triggers on:
- **Event**: Push to `main` branch
- **Steps**:
  1. Checkout code
  2. Setup Node.js environment with caching
  3. Install dependencies (`npm ci`)
  4. Build application (`npm run build`)
  5. Install Octopus CLI
  6. Deploy using npm deploy script
  7. Report deployment status

## Monitoring Deployments

After each deployment, monitor:
- GitHub Actions workflow execution in **Actions** tab
- Octopus Deploy dashboard for deployment progress
- Application health checks post-deployment

## Troubleshooting

### Authentication Errors
- Verify `OCTOPUS_APIKEY` is correctly set in GitHub secrets
- Ensure API key has sufficient permissions in Octopus Deploy

### Build Failures
- Check the **npm run build** output in workflow logs
- Verify all dependencies are specified in `package.json`

### Deployment Failures
- Review the npm deploy script output
- Check Octopus Deploy server logs for deployment errors
- Verify `OCTOPUS_PROJECT` name matches exactly

## Security Best Practices

- Never commit Octopus Deploy credentials to the repository
- Use GitHub Actions secrets for sensitive data
- Rotate API keys periodically
- Use a dedicated service account in Octopus Deploy for CI/CD
- Enable branch protection rules on `main` to require reviews before merge
- Consider enabling required status checks for deployments
