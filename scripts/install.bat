@echo off
SETLOCAL EnableDelayedExpansion

:: Cores não funcionam bem no CMD padrão sem truques, mas vamos usar um layout limpo
echo ==========================================
echo       PAGIA - Instalador Automatico      
echo ==========================================

:: 1. Verificar Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Erro: Node.js nao foi encontrado.
    echo Por favor, instale o Node.js v18 ou superior: https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Verificar Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Erro: Git nao foi encontrado.
    echo Por favor, instale o Git: https://git-scm.com/
    pause
    exit /b 1
)

:: 3. Verificar se ja estamos na pasta ou precisamos clonar
if not exist .git (
    if not exist ..\.git (
        echo Clonando repositorio...
        git clone https://github.com/automacoescomerciaisintegradas/PAGIA.git PAGIA
        cd PAGIA
    )
)

:: 4. Executar o setup Node.js
if exist "%~dp0setup.js" (
    node "%~dp0setup.js"
) else (
    echo Erro: setup.js nao encontrado em %~dp0
    pause
    exit /b 1
)

pause
