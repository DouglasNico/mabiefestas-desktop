@echo off
title Mabie Festas - Gestao e Orcamentos Desktop
color 0D

echo =========================================================
echo       MABIE FESTAS - GESTAO E MONTADOR DE ORCAMENTOS
echo =========================================================
echo.
echo Iniciando aplicativo desktop com Firebase e Nuvem...
echo Aguarde alguns instantes...
echo.

cd /d "%~dp0"
call npx electron .

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo =========================================================
    echo [ERRO] Ocorreu um problema ao iniciar o aplicativo.
    echo =========================================================
    pause
)
