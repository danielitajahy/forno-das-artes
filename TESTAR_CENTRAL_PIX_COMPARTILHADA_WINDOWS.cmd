@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Forno das Artes - CENTRAL PIX FICTICIA COMPARTILHADA
pushd "%~dp0"
where node >nul 2>&1
if errorlevel 1 goto NODE_AUSENTE
if not exist "server\pix-test-server.mjs" goto INCOMPLETO
echo SOMENTE TESTES FICTICIOS. NAO IMPORTAR DADOS REAIS OU PINS DE ESTUDANTES.
echo Banco SQLite separado em .central-pix-testes. Nao apagar essa pasta para resolver erros.
echo Sem acesso bancario, sem Pix automatico e sem homologacao em celulares fisicos.
echo Apos iniciar, abra http://127.0.0.1:8874/index.html?central-pix=teste#acesso
node "%~dp0server\pix-test-server.mjs" --demo
pause
popd
exit /b
:NODE_AUSENTE
echo Instale Node.js 24 LTS ou superior pelo site oficial nodejs.org, gratuitamente.
echo Este iniciador nao instala nada automaticamente. A versao anterior dos totens continua disponivel.
pause
popd
exit /b 1
:INCOMPLETO
echo Extraia TODO o ZIP em outra pasta antes de iniciar.
pause
popd
exit /b 1
