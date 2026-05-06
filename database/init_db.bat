@echo off
echo.
echo Setting up RestoLedger POS Database...
echo.

:: Fallback to mysql command line
set /p db_user="Enter MySQL Username (default: root): " || set db_user=root
set /p db_pass="Enter MySQL Password (if any): "

echo.
echo Running schema.sql...
mysql -u %db_user% -p%db_pass% -e "CREATE DATABASE IF NOT EXISTS restoledger_pos;"
mysql -u %db_user% -p%db_pass% restoledger_pos < schema.sql

echo Running seed.sql...
mysql -u %db_user% -p%db_pass% restoledger_pos < seed.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: Database setup completed successfully!
) else (
    echo.
    echo ERROR: Database setup failed. 
    echo Please make sure MySQL 'bin' folder is in your PATH.
)

:end
pause
