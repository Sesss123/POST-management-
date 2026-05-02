@echo off
echo.
echo Setting up RestoLedger POS Database...
echo.

:: Try using Node.js setup script first (recommended)
if exist "..\setup-db.js" (
    echo Using Node.js setup script...
    node "..\setup-db.js"
    if %ERRORLEVEL% EQU 0 goto end
)

:: Fallback to mysql command line if node fails or setup-db.js missing
set /p db_user="Enter MySQL Username (default: root): " || set db_user=root
set /p db_pass="Enter MySQL Password (if any): "

echo.
echo Running full_setup.sql via mysql command...

mysql -u %db_user% -p%db_pass% < full_setup.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: Database setup completed successfully!
) else (
    echo.
    echo ERROR: Database setup failed. 
    echo Please make sure Node.js is installed OR MySQL 'bin' folder is in your PATH.
)

:end
pause
