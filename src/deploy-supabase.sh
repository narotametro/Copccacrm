#!/bin/bash

# 🚀 COPCCA CRM - Supabase Deployment Script
# This script automates the deployment of your Edge Function to Supabase

echo "================================================"
echo "🚀 COPCCA CRM - Supabase Deployment Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Supabase project details
PROJECT_ID="bpydcrdvytnnjzytkptd"
FUNCTION_NAME="make-server-a2294ced"
SUPABASE_URL="https://bpydcrdvytnnjzytkptd.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJweWRjcmR2eXRubmp6eXRrcHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODQwODEsImV4cCI6MjA3ODI2MDA4MX0.Y2f_jCqaFLIR6IlIiIJbXmefaEiMOYDJLG5KbLheM-c"

# Step 1: Check if Supabase CLI is installed
echo "Step 1: Checking Supabase CLI..."
if ! command -v supabase &> /dev/null
then
    echo -e "${RED}❌ Supabase CLI is not installed!${NC}"
    echo ""
    echo "Please install it first:"
    echo ""
    echo "macOS:"
    echo "  brew install supabase/tap/supabase"
    echo ""
    echo "Linux:"
    echo "  curl -s https://raw.githubusercontent.com/supabase/cli/main/install.sh | bash"
    echo ""
    echo "NPM:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Supabase CLI is installed${NC}"
fi
echo ""

# Step 2: Login to Supabase
echo "Step 2: Logging in to Supabase..."
echo "This will open a browser window for authentication."
echo ""
read -p "Press Enter to continue..."

supabase login

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Login failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Logged in successfully${NC}"
echo ""

# Step 3: Link to project
echo "Step 3: Linking to Supabase project..."
echo "Project ID: $PROJECT_ID"
echo ""
echo "You may be asked for your database password."
echo "If you don't remember it, you can reset it in:"
echo "Supabase Dashboard → Settings → Database"
echo ""
read -p "Press Enter to continue..."

supabase link --project-ref $PROJECT_ID

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Project linking failed!${NC}"
    echo ""
    echo "If you forgot your database password, reset it at:"
    echo "https://supabase.com/dashboard/project/$PROJECT_ID/settings/database"
    exit 1
fi

echo -e "${GREEN}✅ Project linked successfully${NC}"
echo ""

# Step 4: Deploy Edge Function
echo "Step 4: Deploying Edge Function..."
echo "Function name: $FUNCTION_NAME"
echo ""

supabase functions deploy $FUNCTION_NAME

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Function deployment failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Function deployed successfully${NC}"
echo ""

# Step 5: Set environment secrets
echo "Step 5: Setting environment secrets..."
echo ""

echo "Setting SUPABASE_URL..."
supabase secrets set SUPABASE_URL=$SUPABASE_URL

echo "Setting SUPABASE_ANON_KEY..."
supabase secrets set SUPABASE_ANON_KEY=$ANON_KEY

echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: You need to set SUPABASE_SERVICE_ROLE_KEY manually!${NC}"
echo ""
echo "1. Get your service_role key from:"
echo "   https://supabase.com/dashboard/project/$PROJECT_ID/settings/api"
echo ""
echo "2. Click 'Reveal' next to service_role"
echo ""
echo "3. Run this command (replace YOUR_KEY with the actual key):"
echo ""
echo -e "${BLUE}   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_KEY${NC}"
echo ""
read -p "Press Enter after you've set the service_role key..."

echo ""
echo -e "${GREEN}✅ Environment secrets configured${NC}"
echo ""

# Step 6: Test the function
echo "Step 6: Testing the deployed function..."
echo ""

HEALTH_URL="$SUPABASE_URL/functions/v1/$FUNCTION_NAME/$FUNCTION_NAME/health"
echo "Testing: $HEALTH_URL"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Function is working!${NC}"
    echo "Response: $BODY"
else
    echo -e "${YELLOW}⚠️  Function returned HTTP $HTTP_CODE${NC}"
    echo "Response: $BODY"
    echo ""
    echo "This might be OK if the health endpoint requires authentication."
fi

echo ""
echo "================================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "================================================"
echo ""
echo "Your Edge Function is now deployed at:"
echo -e "${BLUE}$SUPABASE_URL/functions/v1/$FUNCTION_NAME${NC}"
echo ""
echo "Next steps:"
echo "1. ✅ Set environment variables in DigitalOcean"
echo "2. ✅ Deploy your frontend (git push)"
echo "3. ✅ Test your app"
echo ""
echo "To view function logs:"
echo "  supabase functions logs $FUNCTION_NAME"
echo ""
echo "To list all secrets:"
echo "  supabase secrets list"
echo ""
echo "================================================"
