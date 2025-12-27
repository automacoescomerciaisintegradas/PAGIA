Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "      PAGIA - Instalador Automatico       " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Verificar Node.js
try {
    $nodeVersion = node -v
    Write-Host "[OK] Node.js detectado: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "[ERRO] Node.js nao foi encontrado." -ForegroundColor Red
    Write-Host "Por favor, instale o Node.js v18 ou superior em https://nodejs.org/"
    return
}

# 2. Verificar Git
try {
    $gitVersion = git --version
    Write-Host "[OK] Git detectado: $gitVersion" -ForegroundColor Green
}
catch {
    Write-Host "[ERRO] Git nao foi encontrado." -ForegroundColor Red
    Write-Host "Por favor, instale o Git em https://git-scm.com/"
    return
}

# 3. Clonar repositorio
if (!(Test-Path .git) -and !(Test-Path ..\.git)) {
    Write-Host "[INFO] Clonando repositorio..." -ForegroundColor Blue
    git clone https://github.com/automacoescomerciaisintegradas/PAGIA.git PAGIA
    Set-Location PAGIA
}

# 4. Executar setup
$setupFile = Join-Path $PSScriptRoot "setup.js"
if (Test-Path $setupFile) {
    node $setupFile
}
else {
    Write-Host "[ERRO] setup.js nao encontrado em $setupFile" -ForegroundColor Red
}
