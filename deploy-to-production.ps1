# COPCCA-CRM Production Deployment Script
# Run this anytime you need to deploy immediately

Write-Host "🚀 COPCCA-CRM Production Deployment" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Step 1: Build
Write-Host "📦 Building project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Fix errors and try again." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build complete!`n" -ForegroundColor Green

# Step 2: Check Netlify CLI
$netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue
if (-not $netlifyInstalled) {
    Write-Host "📥 Installing Netlify CLI..." -ForegroundColor Yellow
    npm install -g netlify-cli
}

# Step 3: Deploy
Write-Host "🌐 Deploying to production..." -ForegroundColor Yellow
Write-Host "   If this is your first time, you'll need to:" -ForegroundColor Gray
Write-Host "   1. Run: netlify login (authorize in browser)" -ForegroundColor Gray
Write-Host "   2. Run: netlify link (connect to your site)" -ForegroundColor Gray
Write-Host "   3. Then run this script again`n" -ForegroundColor Gray

# Try to deploy
netlify deploy --prod --dir=dist 2>&1 | Tee-Object -Variable deployOutput

if ($deployOutput -match "Not logged in" -or $deployOutput -match "No site configured") {
    Write-Host "`n⚠️  First-time setup needed:" -ForegroundColor Yellow
    Write-Host "   Run these commands:" -ForegroundColor White
    Write-Host "   1. netlify login" -ForegroundColor Cyan
    Write-Host "   2. netlify link" -ForegroundColor Cyan
    Write-Host "   3. .\deploy-to-production.ps1" -ForegroundColor Cyan
} elseif ($deployOutput -match "Deploy is live") {
    Write-Host "`n✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "🌐 Your site is now live at: https://copcca.com" -ForegroundColor Green
    Write-Host "`n💡 Clear browser cache (Ctrl+Shift+R) to see changes" -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️  Deployment status unclear. Check output above." -ForegroundColor Yellow
}

Write-Host "`n====================================`n" -ForegroundColor Cyan
