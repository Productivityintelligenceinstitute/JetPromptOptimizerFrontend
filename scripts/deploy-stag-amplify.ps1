# Deploy jetpromptoptimizerfrontend STAGING to a NEW Amplify app.
# Does NOT modify the existing production app (d3ptfij7i45tbx).
#
# Prerequisites:
#   1. aws configure   (or set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_DEFAULT_REGION)
#   2. Optional: $env:GITHUB_TOKEN = "<GitHub PAT with repo access>" for auto Git connect
#
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File .\scripts\deploy-stag-amplify.ps1

$ErrorActionPreference = "Stop"

$Region = if ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } else { "us-east-1" }
$AppName = "jetpromptoptimizerfrontend-stag"
$BranchName = "stag"
$Repository = "https://github.com/Raheel1258/jetpromptoptimizerfrontend"
$ServiceRoleArn = "arn:aws:iam::904027687880:role/service-role/AmplifySSRLoggingRole-11a6ac98-4847-4b1d-82e3-8d8c380cd6e4"

$EnvVars = @{
  NEXT_PUBLIC_AFFILIATE_CODES = "uscomputer_support,testaffiliate"
  NEXT_PUBLIC_API_URL = "https://api.jetpromptoptimizer.ai"
  NEXT_PUBLIC_FIREBASE_API_KEY = "AIzaSyDjRIy_x8aeqTLzj7aGlF8OnFJ64dOAIFI"
  NEXT_PUBLIC_FIREBASE_APP_ID = "1:792091845086:web:29ce19365992ea22cb7d4f"
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "jetpromptoptimizer-de233.firebaseapp.com"
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = "G-NJK7G125Q5"
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "792091845086"
  NEXT_PUBLIC_FIREBASE_PROJECT_ID = "jetpromptoptimizer-de233"
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "jetpromptoptimizer-de233.firebasestorage.app"
  NEXT_PUBLIC_STRIPE_PRICE_ID_ESSENTIAL = "price_1TJu3cG8zFjd5Q2b5MdFVj24"
  NEXT_PUBLIC_STRIPE_PRICE_ID_PRO = "price_1SuTxCG8zFjd5Q2b5Rn7hqim"
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_axVnMywZYVOmXEHF4DuRKL8R"
}

Write-Host "Checking AWS identity..."
aws sts get-caller-identity --region $Region | Out-Null

Write-Host "Looking for existing staging app named '$AppName'..."
$existingApps = aws amplify list-apps --region $Region --output json | ConvertFrom-Json
$app = $existingApps.apps | Where-Object { $_.name -eq $AppName } | Select-Object -First 1

if (-not $app) {
  Write-Host "Creating new Amplify app: $AppName"
  $createArgs = @(
    "amplify", "create-app",
    "--name", $AppName,
    "--platform", "WEB_COMPUTE",
    "--iam-service-role-arn", $ServiceRoleArn,
    "--region", $Region,
    "--output", "json"
  )

  if ($env:GITHUB_TOKEN) {
    $createArgs += @("--repository", $Repository, "--access-token", $env:GITHUB_TOKEN)
  }

  $created = aws @createArgs | ConvertFrom-Json
  $appId = $created.app.appId
  $defaultDomain = $created.app.defaultDomain
  Write-Host "Created app: $appId"
} else {
  $appId = $app.appId
  $defaultDomain = $app.defaultDomain
  Write-Host "Using existing staging app: $appId"
}

Write-Host "Ensuring branch '$BranchName' exists..."
$branches = aws amplify list-branches --app-id $appId --region $Region --output json | ConvertFrom-Json
$branch = $branches.branches | Where-Object { $_.branchName -eq $BranchName } | Select-Object -First 1

$envJson = ($EnvVars.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ","

if (-not $branch) {
  aws amplify create-branch `
    --app-id $appId `
    --branch-name $BranchName `
    --enable-auto-build `
    --environment-variables $envJson `
    --region $Region | Out-Null
  Write-Host "Created branch: $BranchName"
} else {
  aws amplify update-branch `
    --app-id $appId `
    --branch-name $BranchName `
    --enable-auto-build `
    --environment-variables $envJson `
    --region $Region | Out-Null
  Write-Host "Updated branch env vars: $BranchName"
}

if (-not $env:GITHUB_TOKEN -and -not $app) {
  Write-Host ""
  Write-Host "NOTE: No GITHUB_TOKEN set. Connect the repo in Amplify Console:"
  Write-Host "  https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/$appId/settings/general"
  Write-Host "  Repository: $Repository"
  Write-Host "  Branch: $BranchName"
}

Write-Host "Starting deployment..."
$job = aws amplify start-job `
  --app-id $appId `
  --branch-name $BranchName `
  --job-type RELEASE `
  --region $Region `
  --output json | ConvertFrom-Json

Write-Host ""
Write-Host "========================================"
Write-Host " STAGING AMPLIFY DEPLOYMENT STARTED"
Write-Host "========================================"
Write-Host "App ID:          $appId"
Write-Host "Branch:          $BranchName"
Write-Host "Job ID:          $($job.jobSummary.jobId)"
Write-Host ""
Write-Host "Default staging URL:"
Write-Host "  https://$BranchName.$defaultDomain"
Write-Host ""
Write-Host "DNS for client (custom subdomain, e.g. stag.jetpromptoptimizer.ai):"
Write-Host "  Type:  CNAME"
Write-Host "  Name:  stag   (or your chosen subdomain)"
Write-Host "  Value: $BranchName.$defaultDomain"
Write-Host ""
Write-Host "Amplify Console:"
Write-Host "  https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/$appId/$BranchName"
Write-Host "========================================"
