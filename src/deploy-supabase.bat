@echo off
REM 🚀 COPCCA CRM - Supabase Deployment Script (Windows)
REM This script automates the deployment of your Edge Function to Supabase

echo ================================================
echo 🚀 COPCCA CRM - Supabase Deployment Script
echo ================================================
echo.

REM Supabase project details
set PROJECT_ID=bpydcrdvytnnjzytkptd
set FUNCTION_NAME=make-server-a2294ced
set SUPABASE_URL=https://bpydcrdvytnnjzytkptd.supabase.co
set ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJweWRjcmR2eXRubmp6eXRrcHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODQwODEsImV4cCI6MjA3ODI2MDA4MX0.Y2f_jCqaFLIR6IlIiIJbXmefaEiMOYDJLG5KbLheM-c

REM Step 1: Check if Supabase CLI is installed
echo Step 1: Checking Supabase CLI...
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI is not installed!
    echo.
    echo Please install it first:
    echo.
    echo Using Scoop:
    echo   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
    echo   scoop install supabase
    echo.
    echo Using NPM:
    echo   npm install -g supabase
    echo.
    pause
    exit /b 1
)
echo ✅ Supabase CLI is installed
echo.

REM Step 2: Login to Supabase
echo Step 2: Logging in to Supabase...
echo This will open a browser window for authentication.
echo.
pause

supabase login

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Login failed!
    pause
    exit /b 1
)

echo ✅ Logged in successfully
echo.

REM Step 3: Link to project
echo Step 3: Linking to Supabase project...
echo Project ID: %PROJECT_ID%
echo.
echo You may be asked for your database password.
echo If you don't remember it, you can reset it in:
echo Supabase Dashboard → Settings → Database
echo.
pause

supabase link --project-ref %PROJECT_ID%

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Project linking failed!
    echo.
    echo If you forgot your database password, reset it at:
    echo https://supabase.com/dashboard/project/%PROJECT_ID%/settings/database
    pause
    exit /b 1
)

echo ✅ Project linked successfully
echo.

REM Step 4: Deploy Edge Function
echo Step 4: Deploying Edge Function...
echo Function name: %FUNCTION_NAME%
echo.

supabase functions deploy %FUNCTION_NAME%

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Function deployment failed!
    pause
    exit /b 1
)

echo ✅ Function deployed successfully
echo.

REM Step 5: Set environment secrets
echo Step 5: Setting environment secrets...
echo.

echo Setting SUPABASE_URL...
supabase secrets set SUPABASE_URL=%SUPABASE_URL%

echo Setting SUPABASE_ANON_KEY...
supabase secrets set SUPABASE_ANON_KEY=%ANON_KEY%

echo.
echo ⚠️  IMPORTANT: You need to set SUPABASE_SERVICE_ROLE_KEY manually!
echo.
echo 1. Get your service_role key from:
echo    https://supabase.com/dashboard/project/%PROJECT_ID%/settings/api
echo.
echo 2. Click 'Reveal' next to service_role
echo.
echo 3. Run this command (replace YOUR_KEY with the actual key):
echo.
echo    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_KEY
echo.
pause

echo.
echo ✅ Environment secrets configured
echo.

REM Step 6: Test the function
echo Step 6: Testing the deployed function...
echo.

set HEALTH_URL=%SUPABASE_URL%/functions/v1/%FUNCTION_NAME%/%FUNCTION_NAME%/health
echo Testing: %HEALTH_URL%
echo.

curl -s "%HEALTH_URL%"

echo.
echo.
echo ================================================
echo 🎉 Deployment Complete!
echo ================================================
echo.
echo Your Edge Function is now deployed at:
echo %SUPABASE_URL%/functions/v1/%FUNCTION_NAME%
echo.
echo Next steps:
echo 1. ✅ Set environment variables in DigitalOcean
echo 2. ✅ Deploy your frontend (git push)
echo 3. ✅ Test your app
echo.
echo To view function logs:
echo   supabase functions logs %FUNCTION_NAME%
echo.
echo To list all secrets:
echo   supabase secrets list
echo.
echo ================================================
pause
