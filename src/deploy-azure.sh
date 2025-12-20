#!/bin/bash

# ============================================================================
# Pocket CRM - Azure Deployment Script
# ============================================================================
# 
# This script automates the deployment of Pocket CRM to Azure Static Web Apps
#
# Prerequisites:
# - Azure CLI installed and logged in
# - GitHub repository set up
# - Supabase project created
#
# Usage:
#   chmod +x deploy-azure.sh
#   ./deploy-azure.sh
#
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="pocket-crm"
RESOURCE_GROUP="${PROJECT_NAME}-rg"
LOCATION="eastus"
STATIC_WEB_APP_NAME="${PROJECT_NAME}-app"

# Functions
print_header() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI not found. Please install: https://docs.microsoft.com/cli/azure/install-azure-cli"
        exit 1
    fi
    print_success "Azure CLI installed"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js 18+"
        exit 1
    fi
    print_success "Node.js installed ($(node -v))"
    
    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure. Run: az login"
        exit 1
    fi
    print_success "Logged in to Azure"
    
    # Check git
    if ! command -v git &> /dev/null; then
        print_error "Git not found. Please install Git"
        exit 1
    fi
    print_success "Git installed"
    
    echo ""
}

collect_info() {
    print_header "Configuration"
    
    # Get Supabase URL
    read -p "Enter your Supabase URL (https://xxxxx.supabase.co): " SUPABASE_URL
    if [[ -z "$SUPABASE_URL" ]]; then
        print_error "Supabase URL is required"
        exit 1
    fi
    
    # Get Supabase Anon Key
    read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY
    if [[ -z "$SUPABASE_ANON_KEY" ]]; then
        print_error "Supabase Anon Key is required"
        exit 1
    fi
    
    # Get GitHub repo
    read -p "Enter your GitHub repository (username/repo): " GITHUB_REPO
    if [[ -z "$GITHUB_REPO" ]]; then
        print_error "GitHub repository is required"
        exit 1
    fi
    
    echo ""
    print_info "Configuration:"
    echo "  Resource Group: $RESOURCE_GROUP"
    echo "  Location: $LOCATION"
    echo "  App Name: $STATIC_WEB_APP_NAME"
    echo "  GitHub Repo: $GITHUB_REPO"
    echo "  Supabase URL: $SUPABASE_URL"
    echo ""
    
    read -p "Proceed with deployment? (y/n): " CONFIRM
    if [[ "$CONFIRM" != "y" ]]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
    
    echo ""
}

create_resource_group() {
    print_header "Creating Resource Group"
    
    if az group exists --name "$RESOURCE_GROUP" | grep -q "true"; then
        print_warning "Resource group already exists"
    else
        az group create \
            --name "$RESOURCE_GROUP" \
            --location "$LOCATION" \
            --output none
        print_success "Resource group created: $RESOURCE_GROUP"
    fi
    
    echo ""
}

create_static_web_app() {
    print_header "Creating Azure Static Web App"
    
    # Check if app already exists
    if az staticwebapp show --name "$STATIC_WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        print_warning "Static Web App already exists"
        APP_URL=$(az staticwebapp show --name "$STATIC_WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv)
    else
        print_info "Creating Static Web App (this may take a few minutes)..."
        
        az staticwebapp create \
            --name "$STATIC_WEB_APP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --source "https://github.com/$GITHUB_REPO" \
            --location "$LOCATION" \
            --branch "main" \
            --app-location "/" \
            --output-location "dist" \
            --login-with-github
        
        APP_URL=$(az staticwebapp show --name "$STATIC_WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv)
        print_success "Static Web App created"
    fi
    
    echo ""
}

configure_environment_variables() {
    print_header "Configuring Environment Variables"
    
    print_info "Setting Supabase configuration..."
    
    az staticwebapp appsettings set \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --setting-names \
            "VITE_SUPABASE_URL=$SUPABASE_URL" \
            "VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" \
        --output none
    
    print_success "Environment variables configured"
    echo ""
}

build_and_deploy() {
    print_header "Building Application"
    
    print_info "Installing dependencies..."
    npm ci
    
    print_info "Building application..."
    VITE_SUPABASE_URL="$SUPABASE_URL" \
    VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
    npm run build
    
    print_success "Build completed"
    echo ""
}

show_deployment_info() {
    print_header "Deployment Complete!"
    
    # Get deployment token
    DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "properties.apiKey" -o tsv)
    
    echo ""
    print_success "Your Pocket CRM is deployed!"
    echo ""
    echo -e "${GREEN}Application URL:${NC}"
    echo -e "  https://$APP_URL"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo ""
    echo "1. Add GitHub Secret for CI/CD:"
    echo "   - Go to: https://github.com/$GITHUB_REPO/settings/secrets/actions"
    echo "   - Add secret: AZURE_STATIC_WEB_APPS_API_TOKEN"
    echo "   - Value: $DEPLOYMENT_TOKEN"
    echo ""
    echo "2. Add Supabase secrets to GitHub:"
    echo "   - VITE_SUPABASE_URL: $SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY: $SUPABASE_ANON_KEY"
    echo ""
    echo "3. Configure CORS in Supabase:"
    echo "   - Go to: Supabase Dashboard → Project Settings → API"
    echo "   - Add to Allowed Origins: https://$APP_URL"
    echo ""
    echo "4. Test your application:"
    echo "   - Open: https://$APP_URL"
    echo "   - Try logging in and testing all features"
    echo ""
    echo "5. Add custom domain (optional):"
    echo "   - Run: az staticwebapp hostname set --name $STATIC_WEB_APP_NAME --hostname www.your-domain.com"
    echo ""
    echo -e "${BLUE}Resources Created:${NC}"
    echo "  - Resource Group: $RESOURCE_GROUP"
    echo "  - Static Web App: $STATIC_WEB_APP_NAME"
    echo "  - Location: $LOCATION"
    echo ""
    echo -e "${BLUE}Management:${NC}"
    echo "  - Azure Portal: https://portal.azure.com"
    echo "  - View logs: az staticwebapp logs --name $STATIC_WEB_APP_NAME --resource-group $RESOURCE_GROUP"
    echo "  - Delete resources: az group delete --name $RESOURCE_GROUP --yes"
    echo ""
}

# Main execution
main() {
    echo ""
    print_header "Pocket CRM - Azure Deployment"
    echo ""
    
    check_prerequisites
    collect_info
    create_resource_group
    create_static_web_app
    configure_environment_variables
    build_and_deploy
    show_deployment_info
    
    print_success "Deployment script completed successfully!"
    echo ""
}

# Run main function
main
