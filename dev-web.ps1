# Script para rodar o frontend Next.js com Turbopack desativado (usando Webpack)
# Uso: .\dev-web.ps1

Set-Location -Path "apps/web"
$env:NEXT_DISABLE_TURBOPACK=1
npm run dev 