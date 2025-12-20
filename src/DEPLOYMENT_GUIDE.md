# 🚀 COPCCA CRM - Complete Deployment Guide

## Table of Contents
1. [Migrating from Figma Make to DigitalOcean](#migration)
2. [Connecting Frontend to Supabase Database](#supabase-connection)
3. [Accessing Admin Dashboard](#admin-dashboard)

---

# 1. Migrating from Figma Make to DigitalOcean {#migration}

## Prerequisites

Before you begin, ensure you have:
- [ ] DigitalOcean account (sign up at https://www.digitalocean.com)
- [ ] GitHub account (for code repository)
- [ ] All environment variables from Figma Make
- [ ] Supabase project URL and keys

---

## Step 1: Export Your Code from Figma Make

### Option A: Download as ZIP
1. In Figma Make, click on **Menu** (three dots)
2. Select **"Download Project"** or **"Export Code"**
3. Save the ZIP file to your computer
4. Extract the ZIP file to a folder

### Option B: Use Git (if available)
```bash
# If Figma Make provides Git access
git clone <your-figma-make-repo-url>
```

---

## Step 2: Create GitHub Repository

1. **Go to GitHub** (https://github.com)
2. **Click** "New Repository"
3. **Name it**: `copcca-crm`
4. **Set as**: Private
5. **Click**: "Create repository"

### Upload Your Code to GitHub

```bash
# Navigate to your project folder
cd /path/to/copcca-crm

# Initialize git (if not already)
git init

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/copcca-crm.git

# Add all files
git add .

# Commit
git commit -m "Initial commit - COPCCA CRM"

# Push to GitHub
git push -u origin main
```

---

## Step 3: Set Up DigitalOcean App Platform

### Method 1: Using App Platform (Recommended - Easiest)

1. **Login to DigitalOcean**
   - Go to https://cloud.digitalocean.com

2. **Create New App**
   - Click "Create" → "Apps"
   - Or go to: Apps → Create App

3. **Connect GitHub**
   - Choose "GitHub" as source
   - Authorize DigitalOcean to access GitHub
   - Select your repository: `copcca-crm`
   - Choose branch: `main`
   - Click "Next"

4. **Configure App Settings**
   ```
   Name: copcca-crm
   Region: New York (or closest to your users)
   Environment: Production
   ```

5. **Edit Build Settings**
   - Build Command: (leave default or use `npm run build`)
   - Output Directory: `dist` or `build`
   - Run Command: (leave default)

6. **Add Environment Variables** (See Step 4 below)

7. **Review & Deploy**
   - Review pricing (starts at $5/month for Basic plan)
   - Click "Create Resources"
   - Wait 5-10 minutes for deployment

### Method 2: Using Droplet + Nginx (Advanced)

<details>
<summary>Click to expand advanced setup</summary>

1. **Create a Droplet**
   - Click "Create" → "Droplets"
   - Choose: Ubuntu 22.04 LTS
   - Plan: Basic ($6/month)
   - Add your SSH key
   - Create Droplet

2. **SSH into Droplet**
   ```bash
   ssh root@your_droplet_ip
   ```

3. **Install Node.js and dependencies**
   ```bash
   # Update system
   apt update && apt upgrade -y

   # Install Node.js 18.x
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt install -y nodejs

   # Install build tools
   apt install -y build-essential

   # Install nginx
   apt install -y nginx

   # Install git
   apt install -y git
   ```

4. **Clone your repository**
   ```bash
   cd /var/www
   git clone https://github.com/YOUR_USERNAME/copcca-crm.git
   cd copcca-crm
   ```

5. **Install dependencies and build**
   ```bash
   npm install
   npm run build
   ```

6. **Configure Nginx**
   ```bash
   nano /etc/nginx/sites-available/copcca-crm
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your_domain.com;

       root /var/www/copcca-crm/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Enable gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   }
   ```

7. **Enable site and restart Nginx**
   ```bash
   ln -s /etc/nginx/sites-available/copcca-crm /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

8. **Install SSL Certificate (HTTPS)**
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d your_domain.com
   ```

</details>

---

## Step 4: Configure Environment Variables

You need to transfer these environment variables from Figma Make to DigitalOcean:

### Required Variables:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:password@db.xyz.supabase.co:5432/postgres
WHATSAPP_API_KEY=your-whatsapp-key
RESEND_API_KEY=your-resend-key
```

### How to Add in DigitalOcean App Platform:

1. **Go to your App** in DigitalOcean
2. **Click** "Settings" tab
3. **Scroll to** "Environment Variables"
4. **Click** "Edit"
5. **Add each variable**:
   ```
   Key: SUPABASE_URL
   Value: https://your-project.supabase.co
   Scope: All components
   ```
6. **Repeat** for all variables
7. **Click** "Save"
8. **App will redeploy** automatically

### How to Add in Droplet:

Create a `.env` file:
```bash
cd /var/www/copcca-crm
nano .env
```

Add your variables:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:password@db.xyz.supabase.co:5432/postgres
WHATSAPP_API_KEY=your-whatsapp-key
RESEND_API_KEY=your-resend-key
```

---

## Step 5: Update Code for DigitalOcean

### Update `/utils/supabase/info.tsx`

Your current file might have Figma Make specific URLs. Update it:

```typescript
// /utils/supabase/info.tsx

// For production deployment, use environment variables
export const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'your-project-id';
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Or if using process.env (depends on your build setup)
// export const projectId = process.env.SUPABASE_PROJECT_ID || 'your-project-id';
// export const publicAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
```

### Update Environment Variable Names

If your build tool uses `VITE_` prefix, rename your variables in DigitalOcean:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_SERVICE_ROLE_KEY
etc.
```

---

## Step 6: Deploy and Test

### For App Platform:
1. **Deployment happens automatically**
2. **Wait for build** (5-10 minutes)
3. **Check build logs** for errors
4. **Get your URL**: `https://your-app.ondigitalocean.app`
5. **Visit the URL** and test

### For Droplet:
1. **Point your domain** to Droplet IP
2. **Visit** `https://your-domain.com`
3. **Test all features**

---

## Step 7: Custom Domain (Optional)

### For App Platform:

1. **Go to** your App → Settings → Domains
2. **Click** "Add Domain"
3. **Enter** your domain: `crm.yourcompany.com`
4. **Add DNS records** to your domain provider:
   ```
   Type: CNAME
   Name: crm
   Value: your-app.ondigitalocean.app
   ```
5. **Wait for DNS** propagation (15 minutes - 48 hours)
6. **SSL certificate** is added automatically

---

# 2. Connecting Frontend to Supabase Database {#supabase-connection}

## Overview

Your COPCCA CRM uses a **3-tier architecture**:
```
Frontend (DigitalOcean) → Edge Functions (Supabase) → Database (Supabase)
```

## Step 1: Verify Supabase Project

1. **Login to Supabase**
   - Go to https://supabase.com
   - Login to your account

2. **Select your project**
   - You should see your COPCCA CRM project
   - If not, create a new project

3. **Get Project Details**
   - Go to Settings → API
   - Copy these values:
     ```
     Project URL: https://xxxxx.supabase.co
     Project API Key (anon, public): eyJhbGc...
     Project API Key (service_role, secret): eyJhbGc...
     ```

---

## Step 2: Update Frontend Configuration

### Method A: Using Environment Variables (Recommended)

Create/update `.env` in your project root:
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Then update `/utils/supabase/info.tsx`:
```typescript
export const projectId = 'xxxxx'; // from your URL
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'fallback-key';
```

### Method B: Hardcode (Not Recommended for Production)

Directly in `/utils/supabase/info.tsx`:
```typescript
export const projectId = 'xxxxx'; // Your actual project ID
export const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Your actual anon key
```

---

## Step 3: Deploy Edge Functions to Supabase

Your backend is already in `/supabase/functions/server/`. Deploy it:

### Install Supabase CLI

```bash
# On macOS
brew install supabase/tap/supabase

# On Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# On Linux
curl -s https://raw.githubusercontent.com/supabase/cli/main/install.sh | bash
```

### Login to Supabase

```bash
supabase login
```

### Link to Your Project

```bash
cd /path/to/copcca-crm
supabase link --project-ref xxxxx
```

### Deploy Edge Functions

```bash
# Deploy the main server function
supabase functions deploy make-server-a2294ced

# Set environment variables for the function
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
supabase secrets set WHATSAPP_API_KEY=your-whatsapp-key
supabase secrets set RESEND_API_KEY=your-resend-key
```

---

## Step 4: Configure CORS on Supabase

Your Edge Functions need to accept requests from your DigitalOcean frontend.

This is already configured in `/supabase/functions/server/index.tsx`:
```typescript
app.use(
  "/*",
  cors({
    origin: "*", // Allows all origins
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
```

For production, you should restrict to your domain:
```typescript
app.use(
  "/*",
  cors({
    origin: "https://your-domain.com", // Your DigitalOcean app URL
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
```

---

## Step 5: Test Connection

### Test from Browser Console

Visit your DigitalOcean app and open browser console:

```javascript
// Test connection
fetch('https://xxxxx.supabase.co/functions/v1/make-server-a2294ced/health', {
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
})
.then(r => r.json())
.then(console.log)
```

Should return: `{ "status": "ok" }`

### Test Authentication

Try to login with your app. Check Network tab for:
- Request to `/auth/signup` or `/auth/signin`
- Should return 200 OK
- Should receive user data

---

## Step 6: Database Schema

Your database uses a Key-Value store approach. Verify tables exist:

1. **Go to Supabase** → Table Editor
2. **Check for table**: `kv_store_a2294ced`
3. **Schema should be**:
   ```sql
   CREATE TABLE kv_store_a2294ced (
     key TEXT PRIMARY KEY,
     value JSONB NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

If table doesn't exist, create it:
1. Go to SQL Editor
2. Run the CREATE TABLE query above
3. Click "Run"

---

## Step 7: Enable Realtime (Optional)

If you want real-time updates:

1. **Go to** Database → Replication
2. **Enable** replication for `kv_store_a2294ced`
3. **In your code**, use Supabase realtime:
   ```typescript
   supabase
     .channel('kv-changes')
     .on('postgres_changes', { 
       event: '*', 
       schema: 'public', 
       table: 'kv_store_a2294ced' 
     }, payload => {
       console.log('Change received!', payload)
     })
     .subscribe()
   ```

---

## Connection Architecture Diagram

```
┌─────────────────────────────────────────┐
│  User Browser                           │
│  https://your-app.ondigitalocean.app    │
└──────────────���─┬────────────────────────┘
                 │
                 │ HTTPS Request
                 │
                 ▼
┌─────────────────────────────────────────┐
│  DigitalOcean App Platform              │
│  - Serves React Frontend                │
│  - Static files (HTML, CSS, JS)         │
└────────────────┬────────────────────────┘
                 │
                 │ API Calls
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Supabase Edge Functions                │
│  https://xxxxx.supabase.co/functions/   │
│  - make-server-a2294ced                 │
│  - Authentication                       │
│  - Business Logic                       │
└────────────────┬────────────────────────┘
                 │
                 │ Database Queries
                 │
                 ▼
┌───────────────────────────────────────���─┐
│  Supabase PostgreSQL Database           │
│  - kv_store_a2294ced table              │
│  - User data                            │
│  - All business data                    │
└─────────────────────────────────────────┘
```

---

# 3. Accessing Admin Dashboard {#admin-dashboard}

## Overview

The **Admin Management Dashboard** is for **COPCCA CRM office use ONLY**.

It allows you to:
- ✅ View all customer subscriptions
- ✅ Manage paid/unpaid status
- ✅ Activate/deactivate accounts
- ✅ View revenue analytics
- ✅ Track all users in the system

---

## Step 1: Access the Dashboard

### Option A: Using Hash Route

Simply add `#/copcca-admin` to your app URL:

```
https://your-app.ondigitalocean.app/#/copcca-admin
```

Or if using custom domain:
```
https://crm.yourcompany.com/#/copcca-admin
```

### Option B: Using Direct Path

```
https://your-app.ondigitalocean.app/copcca-admin
```

---

## Step 2: Login to Admin Dashboard

1. **Visit the URL** above
2. **You'll see** a login screen with a shield icon
3. **Enter password**: `COPCCA_ADMIN_2024`
4. **Click** "Access Dashboard"

**⚠️ IMPORTANT**: Change this password in production!

### How to Change Admin Password

Edit `/AdminDashboard.tsx` (around line 12):

```typescript
// Change this line:
const ADMIN_PASSWORD = 'COPCCA_ADMIN_2024';

// To your secure password:
const ADMIN_PASSWORD = 'YourSecurePassword123!';
```

Then redeploy your app.

---

## Step 3: Using the Admin Dashboard

### Dashboard Sections

#### 1. **Statistics Overview** (Top)
Shows at a glance:
- Total Admins
- Active Subscriptions
- Expired Subscriptions
- Paid Users
- Unpaid Users
- Total Revenue

#### 2. **Search & Filters** (Middle)
- **Search bar**: Find by email or name
- **Subscription Status**: Filter by Active/Expired/Pending
- **Payment Status**: Filter by Paid/Unpaid

#### 3. **Users Table** (Main)
Displays all admin accounts with:
- Admin info (name, email)
- Number of team members
- Subscription status badge
- Payment status and amount
- Important dates
- Action buttons

#### 4. **Action Buttons**

**Activate/Deactivate**:
- Green "Activate" for expired subscriptions
- Red "Deactivate" for active subscriptions

**Mark Paid/Unpaid**:
- Blue "Mark Paid" for unpaid accounts
- Orange "Mark Unpaid" for paid accounts

#### 5. **Analytics Footer** (Bottom)
- Monthly Recurring Revenue (MRR)
- Average users per admin
- Total users in system

---

## Step 4: Common Admin Tasks

### Task 1: Activate New Customer After Payment

1. Search for customer by email
2. Verify payment received externally
3. Click **"Mark Paid"**
4. Click **"Activate"**
5. Customer can now access the system

### Task 2: Deactivate Non-Paying Customer

1. Search for customer
2. Click **"Deactivate"**
3. Click **"Mark Unpaid"**
4. Customer will see payment modal on next login

### Task 3: View Revenue Report

1. Scroll to bottom of dashboard
2. Check **Total Revenue** in statistics
3. Note **MRR** (Monthly Recurring Revenue)
4. Export data if needed

### Task 4: Check User Count

1. Find customer in table
2. Look at **Users** column
3. Shows total team members
4. Used for subscription calculation

---

## Step 5: Secure the Admin Dashboard

### Recommended Security Measures

1. **Change Default Password**
   ```typescript
   // In /AdminDashboard.tsx
   const ADMIN_PASSWORD = 'VerySecurePassword2024!';
   ```

2. **Restrict by IP (DigitalOcean Firewall)**
   - Create firewall rule
   - Allow only office IP addresses
   - Apply to your app

3. **Use VPN**
   - Set up DigitalOcean VPN
   - Only accessible through VPN

4. **Add Session Timeout**
   ```typescript
   // Auto-logout after 30 minutes
   setTimeout(() => {
     sessionStorage.removeItem('copcca_admin_auth');
     setIsAuthenticated(false);
   }, 30 * 60 * 1000);
   ```

5. **Enable Logging**
   - Log all admin actions
   - Track who accessed when
   - Store in database

---

## Step 6: Bookmark for Easy Access

Create bookmarks for your team:

**Admin Dashboard**:
```
Name: COPCCA CRM Admin
URL: https://your-app.ondigitalocean.app/#/copcca-admin
```

**Main App** (for testing):
```
Name: COPCCA CRM App
URL: https://your-app.ondigitalocean.app
```

---

## Quick Reference Card

### Admin Dashboard Access

| Item | Value |
|------|-------|
| **URL** | `https://your-app.ondigitalocean.app/#/copcca-admin` |
| **Password** | `COPCCA_ADMIN_2024` (change this!) |
| **Purpose** | Manage customer subscriptions |
| **Who Can Access** | COPCCA CRM office staff only |

### Actions Available

| Action | What It Does |
|--------|-------------|
| **Activate** | Enables customer access for 1 year |
| **Deactivate** | Blocks customer access immediately |
| **Mark Paid** | Updates payment status to paid |
| **Mark Unpaid** | Updates payment status to unpaid |

### Subscription Pricing

| Item | Amount |
|------|--------|
| **Per User/Month** | TSH 30,000 |
| **Annual (per user)** | TSH 360,000 |
| **Example (5 users)** | TSH 1,800,000/year |

---

## Troubleshooting

### Issue: Can't Access Admin Dashboard

**Solutions**:
1. Check URL is correct: `/#/copcca-admin`
2. Try hard refresh: Ctrl + Shift + R
3. Clear browser cache
4. Verify password is correct
5. Check browser console for errors

### Issue: No Users Showing

**Solutions**:
1. Check backend is deployed
2. Verify database connection
3. Check Network tab for API errors
4. Ensure subscriptions exist in database

### Issue: Actions Don't Work

**Solutions**:
1. Check browser console for errors
2. Verify API endpoints are working
3. Check authentication
4. Try logging out and back in

---

## Next Steps After Migration

1. ✅ Test the entire app thoroughly
2. ✅ Change admin dashboard password
3. ✅ Set up custom domain
4. ✅ Configure SSL certificate
5. ✅ Set up monitoring (DigitalOcean Monitoring)
6. ✅ Create backups (Supabase backups)
7. ✅ Document your deployment
8. ✅ Train your team on admin dashboard
9. ✅ Set up payment gateway integration
10. ✅ Launch to customers!

---

## Cost Breakdown

### DigitalOcean

| Service | Cost |
|---------|------|
| **App Platform (Basic)** | $5/month |
| **App Platform (Professional)** | $12/month |
| **Droplet (1GB RAM)** | $6/month |
| **Droplet (2GB RAM)** | $12/month |

### Supabase

| Service | Cost |
|---------|------|
| **Free Tier** | $0/month (500MB database, 2GB bandwidth) |
| **Pro Plan** | $25/month (8GB database, 50GB bandwidth) |

### Total Estimated Cost

**Minimum**: $5/month (DO App + Supabase Free)
**Recommended**: $17-30/month (DO App + Supabase Pro)

---

## Support Resources

### DigitalOcean
- Docs: https://docs.digitalocean.com
- Community: https://www.digitalocean.com/community
- Support: https://cloud.digitalocean.com/support

### Supabase
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- Support: support@supabase.io

### COPCCA CRM
- Main App: `https://your-app.ondigitalocean.app`
- Admin Dashboard: `https://your-app.ondigitalocean.app/#/copcca-admin`
- Documentation: See `/SUBSCRIPTION_SYSTEM.md` and `/ADMIN_DASHBOARD_GUIDE.md`

---

**Good luck with your deployment! 🚀**

If you encounter any issues, check the browser console and network tab for detailed error messages.
