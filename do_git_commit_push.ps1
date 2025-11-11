param(
  [string]$Branch = 'rebrand/nexefii',
  [string]$Message = 'chore(rebrand): apply Nexefii rebranding snapshot + backups',
  [switch]$ForcePush
)

# Check for git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "git is not installed or not in PATH. Install git and run this script again locally."
  exit 1
}

Set-Location -Path $PSScriptRoot

# Ensure we are in a git repository
try { git rev-parse --is-inside-work-tree 2>$null } catch { Write-Error "Not a git repo. Run this script inside the repo root."; exit 1 }

# Fetch remotes
git fetch origin

# Create branch if it doesn't exist
$localExists = (git show-ref --verify --quiet "refs/heads/$Branch"; echo $?) -eq 0
if (-not $localExists) {
  git checkout -b $Branch
} else {
  git checkout $Branch
}

# Stage changes
git add -A

# Show status
git status --short

# Commit
git commit -m "$Message" || Write-Host "No changes to commit or commit failed."

# Push
if ($ForcePush) {
  git push -u origin $Branch --force
} else {
  git push -u origin $Branch
}

Write-Host "Done. If push succeeded, open a PR from branch '$Branch' to 'main' on the remote repository."