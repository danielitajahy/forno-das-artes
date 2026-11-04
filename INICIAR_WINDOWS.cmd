@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Forno das Artes - notebook central
pushd "%~dp0"
if errorlevel 1 goto ERRO_PASTA
if not exist "index.html" goto ERRO_PACOTE
if not exist "iniciar.py" goto ERRO_PACOTE
if not exist "INICIAR_WINDOWS.ps1" goto ERRO_PACOTE
echo Forno das Artes - aguarde. Nao feche esta janela durante o uso.
echo Origem fixa: http://127.0.0.1:8766/index.html
echo Nenhum dado sera apagado. Este programa nao baixa o projeto.
where py >nul 2>nul
if errorlevel 1 goto TESTAR_PYTHON
py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)" >nul 2>nul
if errorlevel 1 goto TESTAR_PYTHON
py -3 "%~dp0iniciar.py"
goto FINAL
:TESTAR_PYTHON
where python >nul 2>nul
if errorlevel 1 goto NATIVO
rem Evita abrir a Microsoft Store quando python e apenas um alias do Windows.
where python 2>nul | findstr /i /c:"WindowsApps" >nul
if not errorlevel 1 goto NATIVO
python -c "import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)" >nul 2>nul
if errorlevel 1 goto NATIVO
python "%~dp0iniciar.py"
goto FINAL
:NATIVO
echo Python nao disponivel. Usando servidor nativo do Windows, sem instalacao.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0INICIAR_WINDOWS.ps1"
goto FINAL
:ERRO_PASTA
echo ERRO: nao foi possivel abrir a pasta do programa.
goto FINAL
:ERRO_PACOTE
echo ERRO: pacote incompleto ou aberto dentro do ZIP.
echo Extraia TODO o ZIP e execute INICIAR_WINDOWS.cmd da pasta extraida.
:FINAL
echo.
echo Se o sistema nao abriu, fotografe esta mensagem de erro para suporte.
echo Nao limpe o navegador e nao mude a porta 8766 para tentar corrigir.
pause
popd
endlocal
