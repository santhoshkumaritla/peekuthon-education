# Quick Setup Script
# Run this after getting your API keys

Write-Host "🚀 LearnNest Dashboard - API Configuration Helper" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local file found!" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host "Creating .env.local from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
    Write-Host "✅ Created .env.local" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Get your Gemini API key from: https://makersuite.google.com/app/apikey" -ForegroundColor White
Write-Host "2. Open .env.local and replace 'your_api_key_here' with your actual API key" -ForegroundColor White
Write-Host "3. (Optional) Get Twilio credentials from: https://www.twilio.com/console" -ForegroundColor White
Write-Host "4. Run: npm run dev" -ForegroundColor White
Write-Host ""

# Check if API keys are configured
$envContent = Get-Content ".env.local" -Raw
if ($envContent -match "your_api_key_here") {
    Write-Host "⚠️  Warning: API keys not configured yet!" -ForegroundColor Yellow
    Write-Host "   Please edit .env.local and add your API keys" -ForegroundColor Yellow
} else {
    Write-Host "✅ API keys appear to be configured!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📖 For detailed instructions, see API_SETUP.md" -ForegroundColor Cyan
Write-Host ""

# Offer to open .env.local in editor
$response = Read-Host "Would you like to open .env.local now? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    notepad .env.local
}
