@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Forno das Artes - PREVIA FICTICIA
pushd "%~dp0"
if not exist "PREVIA_VISUAL.html" goto INCOMPLETO
if not exist "INICIAR_WINDOWS.ps1" goto INCOMPLETO
echo PREVIA FICTICIA: nao registra vendas reais nem utiliza o banco do notebook.
echo Abra http://127.0.0.1:8870/PREVIA_VISUAL.html se o navegador nao abrir.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0INICIAR_WINDOWS.ps1" -Previa
goto FIM
:INCOMPLETO
echo Pacote incompleto. Extraia TODO o ZIP antes de abrir.
:FIM
pause
popd
endlocal
