@echo off
:: PAGIA Windows Wrapper
:: Evita o erro UV_HANDLE_CLOSING no PowerShell

node "%~dp0dist\index.js" %*
exit /b 0
