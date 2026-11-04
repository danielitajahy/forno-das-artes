@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Forno das Artes - TESTE DO PAINEL FINANCEIRO
pushd "%~dp0"
if not exist "INICIAR_WINDOWS.ps1" goto INCOMPLETO
if not exist "app\finance-results.js" goto INCOMPLETO
echo BASE FICTICIA DE TESTES - porta 8871, separada da operacao 8766.
echo Nao importe backups reais. O banco operacional nao sera lido aqui.
echo Para demonstracao sem cadastro, abra /PREVIA_FINANCEIRA.html nessa origem.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0INICIAR_WINDOWS.ps1" -FinanceiroTeste
goto FIM
:INCOMPLETO
echo Pacote incompleto. Extraia TODO o ZIP.
:FIM
pause
popd
endlocal
