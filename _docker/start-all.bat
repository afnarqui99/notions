@echo off
REM Script para iniciar todas las bases de datos Docker en Windows

echo Iniciando todas las bases de datos Docker...

echo.
echo Iniciando PostgreSQL...
cd postgresql
docker-compose up -d
cd ..

echo.
echo Iniciando MySQL...
cd mysql
docker-compose up -d
cd ..

echo.
echo Iniciando SQL Server...
cd sqlserver
docker-compose up -d
cd ..

echo.
echo Todas las bases de datos estan iniciando...
echo.
echo Espera unos segundos y verifica con: docker ps
echo.
echo Para ver los logs:
echo   - PostgreSQL: cd postgresql ^&^& docker-compose logs -f
echo   - MySQL: cd mysql ^&^& docker-compose logs -f
echo   - SQL Server: cd sqlserver ^&^& docker-compose logs -f

pause

