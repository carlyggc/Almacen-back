@echo off
title API ALMACEN
:start
echo.
echo Iniciando servidor...
node server.js
echo.
echo El servidor se cerro. Reiniciando en 3 segundos...
timeout /t 3 >nul
goto start
