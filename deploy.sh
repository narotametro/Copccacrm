#!/bin/bash

# ========================================
# COPCCA CRM - Automated Deployment Script
# ========================================
# This script ensures clean, zero-404 deployments to DigitalOcean
#
# Usage:
#   ./deploy.sh
#
# Requirements:
#   - SSH key configured for server
#   - npm installed locally
#   - Server variables configured below
# ========================================

# ========================================
# CONFIGURATION - UPDATE THESE
# ========================================

SERVER_IP="your_server_ip"           # e.g., "192.168.1.100"
SERVER_USER="root"                   # SSH user (usually "root")
SERVER_PATH="/var/www/html"          # Web root path
SERVER_PORT="22"                     # SSH port (usually 22)

# ========================================
# COLOR OUTPUT
# ========================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# ========================================
# HELPER FUNCTIONS
# ========================================

print_header() {
    echo ""
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ========================================
# PRE-FLIGHT CHECKS
# ========================================

print_header "COPCCA CRM - Deployment Starting"

# Check if configuration is set
if [ "$SERVER_IP" == "your_server_ip" ]; then
    print_error "Server IP not configured!"
    echo "Edit deploy.sh and set SERVER_IP, SERVER_USER, SERVER_PATH"
    exit 1
fi

# Check if dist directory exists (from previous build)
if [ -d "dist" ]; then
    print_warning "Old dist directory found"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_error "node_modules not found. Run: npm install"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the project root?"
    exit 1
fi

# Check SSH connection
print_step "Testing SSH connection..."
if ssh -o ConnectTimeout=5 -p $SERVER_PORT ${SERVER_USER}@${SERVER_IP} "echo 'SSH OK'" > /dev/null 2>&1; then
    print_success "SSH connection verified"
else
    print_error "Cannot connect to server via SSH"
    echo "Check: SERVER_IP, SERVER_USER, SSH keys"
    exit 1
fi

# ========================================
# BUILD PROCESS
# ========================================

print_header "Building Production Bundle"

# Clean old build
print_step "Cleaning old build..."
rm -rf dist
print_success "Old build cleaned"

# Run build
print_step "Running npm run build..."
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
    print_error "Build failed. Fix errors and try again."
    exit 1
fi

if [ ! -d "dist" ]; then
    print_error "dist directory not created. Build may have failed."
    exit 1
fi

print_success "Build completed successfully"

# Show build size
DIST_SIZE=$(du -sh dist | cut -f1)
print_step "Build size: $DIST_SIZE"

# ========================================
# DEPLOYMENT
# ========================================

print_header "Deploying to Server"

# Backup existing files (optional safety measure)
print_step "Creating backup of current deployment..."
BACKUP_DIR="/tmp/copcca-backup-$(date +%Y%m%d-%H%M%S)"
ssh -p $SERVER_PORT ${SERVER_USER}@${SERVER_IP} "mkdir -p $BACKUP_DIR && cp -r ${SERVER_PATH}/* $BACKUP_DIR 2>/dev/null || true"
print_success "Backup created at: $BACKUP_DIR"

# Clean server files
print_step "Cleaning server files..."
ssh -p $SERVER_PORT ${SERVER_USER}@${SERVER_IP} "rm -rf ${SERVER_PATH}/*"
if [ $? -ne 0 ]; then
    print_error "Failed to clean server files. Check permissions."
    exit 1
fi
print_success "Server cleaned"

# Upload new files
print_step "Uploading new files to server..."
scp -P $SERVER_PORT -r dist/* ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
if [ $? -ne 0 ]; then
    print_error "Upload failed. Restoring backup..."
    ssh -p $SERVER_PORT ${SERVER_USER}@${SERVER_IP} "cp -r $BACKUP_DIR/* ${SERVER_PATH}/"
    print_error "Deployment failed. Old version restored."
    exit 1
fi
print_success "Files uploaded successfully"

# ========================================
# VERIFICATION
# ========================================

print_header "Verifying Deployment"

# Check if index.html exists on server
print_step "Checking index.html exists..."
if ssh -p $SERVER_PORT ${SERVER_USER}@${SERVER_IP} "[ -f ${SERVER_PATH}/index.html ]"; then
    print_success "index.html found"
else
    print_error "index.html not found on server!"
    exit 1
fi

# Check if assets directory exists
print_step "Checking assets directory..."
if ssh -p $SERVER_PORT ${SERVER_USER}@${SERVER_IP} "[ -d ${SERVER_PATH}/assets ]"; then
    print_success "assets directory found"
else
    print_warning "assets directory not found (may be normal for some builds)"
fi

# List deployed files
print_step "Files deployed to server:"
ssh -p $SERVER_PORT ${SERVER_USER}@${SERVER_IP} "ls -lh ${SERVER_PATH} | head -20"

# Count files deployed
FILE_COUNT=$(ssh -p $SERVER_PORT ${SERVER_USER}@${SERVER_IP} "find ${SERVER_PATH} -type f | wc -l")
print_step "Total files deployed: $FILE_COUNT"

# ========================================
# NGINX CHECK (OPTIONAL)
# ========================================

print_header "Server Health Check"

# Check if Nginx is running
print_step "Checking Nginx status..."
if ssh -p $SERVER_PORT ${SERVER_USER}@${SERVER_IP} "systemctl is-active --quiet nginx"; then
    print_success "Nginx is running"
else
    print_warning "Nginx may not be running. Check: systemctl status nginx"
fi

# Test Nginx configuration
print_step "Testing Nginx configuration..."
NGINX_TEST=$(ssh -p $SERVER_PORT ${SERVER_USER}@${SERVER_IP} "nginx -t 2>&1")
if [[ $NGINX_TEST == *"successful"* ]]; then
    print_success "Nginx configuration is valid"
else
    print_warning "Nginx configuration may have issues:"
    echo "$NGINX_TEST"
fi

# ========================================
# COMPLETION
# ========================================

print_header "Deployment Complete!"

echo ""
print_success "✅ Build completed"
print_success "✅ Files uploaded"
print_success "✅ Deployment verified"
echo ""

print_step "📦 Backup location: $BACKUP_DIR"
print_step "🌐 Deployment target: ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}"
print_step "📝 Build size: $DIST_SIZE"
print_step "📊 Files deployed: $FILE_COUNT"
echo ""

print_header "Next Steps"
echo "1. Open your browser"
echo "2. Visit your domain"
echo "3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)"
echo "4. Check browser console for errors"
echo "5. Test all routes (/customers, /dashboard, etc.)"
echo ""

print_warning "If anything goes wrong, restore backup:"
echo "ssh ${SERVER_USER}@${SERVER_IP} 'cp -r $BACKUP_DIR/* ${SERVER_PATH}/'"
echo ""

print_success "🚀 Deployment successful!"
echo ""
