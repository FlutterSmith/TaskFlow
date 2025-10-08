# Installation Instructions

## Fix Steps (Run these in PowerShell in C:\code\TaskFlow)

### Step 1: Clean Everything
```powershell
# Remove old dependencies and cache
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm cache clean --force
```

### Step 2: Install with Retry
```powershell
# Try normal install first
npm install --legacy-peer-deps

# If network error, try with longer timeout
npm install --legacy-peer-deps --fetch-timeout=60000 --fetch-retries=5

# If still fails, try different registry
npm install --legacy-peer-deps --registry=https://registry.npmmirror.com
```

### Step 3: Verify Installation
```powershell
# Check if node_modules exists
Test-Path node_modules

# Try to run dev server
npm run dev
```

## Alternative: Use Yarn

If npm continues to have network issues:

```powershell
# Install yarn
npm install -g yarn

# Install dependencies with yarn
yarn install
```

## Backend Installation

After frontend works:

```powershell
cd api
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue  
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
```

## Network Troubleshooting

If you're behind a proxy or firewall:

```powershell
# Set proxy (if needed)
npm config set proxy http://your-proxy:port
npm config set https-proxy http://your-proxy:port

# Or clear proxy
npm config delete proxy
npm config delete https-proxy

# Use different DNS
npm config set registry https://registry.npmjs.org/
```

## Still Having Issues?

1. **Check Internet Connection**: Try opening https://registry.npmjs.org in browser
2. **Disable VPN**: If using VPN, try disabling it temporarily
3. **Try Mobile Hotspot**: Rule out network restrictions
4. **Check Firewall**: Make sure npm/node aren't blocked
5. **Use WSL**: Install in WSL Ubuntu instead of Windows

## Quick Fix Script

Save this as `install.ps1` and run it:

```powershell
Write-Host "Cleaning..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm cache clean --force

Write-Host "Installing with retries..." -ForegroundColor Yellow
$success = $false
$attempts = 0
$maxAttempts = 3

while (-not $success -and $attempts -lt $maxAttempts) {
    $attempts++
    Write-Host "Attempt $attempts of $maxAttempts..." -ForegroundColor Cyan
    
    npm install --legacy-peer-deps --fetch-timeout=60000 --fetch-retries=5
    
    if ($LASTEXITCODE -eq 0) {
        $success = $true
        Write-Host "Installation successful!" -ForegroundColor Green
    } else {
        Write-Host "Attempt $attempts failed. Retrying..." -ForegroundColor Red
        Start-Sleep -Seconds 5
    }
}

if (-not $success) {
    Write-Host "Installation failed after $maxAttempts attempts." -ForegroundColor Red
    Write-Host "Try using a different network or VPN." -ForegroundColor Yellow
}
```
