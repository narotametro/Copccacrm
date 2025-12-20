# ✅ COPCCA CRM Deployment Checklist

## Pre-Deployment

- [ ] Have DigitalOcean account
- [ ] Have GitHub account  
- [ ] Have Supabase project URL and keys
- [ ] Have all environment variables ready
- [ ] Code is working in Figma Make
- [ ] All features tested locally

---

## Migration to DigitalOcean

### 1. Export Code
- [ ] Download code from Figma Make as ZIP
- [ ] Extract to local folder
- [ ] Verify all files are present

### 2. GitHub Setup
- [ ] Create new repository on GitHub
- [ ] Initialize git in project folder
- [ ] Add remote origin
- [ ] Commit all files
- [ ] Push to GitHub

### 3. DigitalOcean App Platform
- [ ] Login to DigitalOcean
- [ ] Create new App
- [ ] Connect to GitHub repository
- [ ] Select branch (main)
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Deploy app
- [ ] Wait for deployment (5-10 minutes)
- [ ] Get app URL

### 4. Environment Variables
Add these to DigitalOcean:
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_DB_URL`
- [ ] `WHATSAPP_API_KEY`
- [ ] `RESEND_API_KEY`

---

## Supabase Connection

### 1. Verify Supabase Project
- [ ] Login to Supabase
- [ ] Locate COPCCA CRM project
- [ ] Copy Project URL
- [ ] Copy Anon Key
- [ ] Copy Service Role Key

### 2. Deploy Edge Functions
- [ ] Install Supabase CLI
- [ ] Login to Supabase via CLI
- [ ] Link to project
- [ ] Deploy function: `make-server-a2294ced`
- [ ] Set secrets in Supabase

### 3. Database Setup
- [ ] Verify `kv_store_a2294ced` table exists
- [ ] Check table schema is correct
- [ ] Test database connection

### 4. Test Connection
- [ ] Open browser console on app
- [ ] Test health endpoint
- [ ] Try login/signup
- [ ] Verify data saves
- [ ] Check network requests

---

## Admin Dashboard Setup

### 1. Access Dashboard
- [ ] Navigate to `/#/copcca-admin`
- [ ] Login with password: `COPCCA_ADMIN_2024`
- [ ] Verify dashboard loads

### 2. Security
- [ ] Change admin password in code
- [ ] Redeploy with new password
- [ ] Test new password works
- [ ] Document password securely

### 3. Test Features
- [ ] Search for users
- [ ] Filter by status
- [ ] Test "Activate" button
- [ ] Test "Mark Paid" button
- [ ] Verify statistics update

---

## Production Readiness

### 1. Custom Domain (Optional)
- [ ] Add domain in DigitalOcean
- [ ] Update DNS records
- [ ] Wait for propagation
- [ ] Verify SSL certificate

### 2. Performance
- [ ] Test page load speed
- [ ] Verify images load
- [ ] Check mobile responsiveness
- [ ] Test on different browsers

### 3. Security
- [ ] Change all default passwords
- [ ] Verify HTTPS is working
- [ ] Test authentication flow
- [ ] Enable rate limiting (if needed)

### 4. Monitoring
- [ ] Enable DigitalOcean monitoring
- [ ] Set up error tracking
- [ ] Configure alerts
- [ ] Set up backup schedule

---

## User Testing

### 1. Admin User
- [ ] Create test admin account
- [ ] Test all 6 modules
- [ ] Test subscription modal
- [ ] Test payment flow
- [ ] Test team member invite

### 2. Team Member
- [ ] Create test team member
- [ ] Accept invite
- [ ] Test limited access
- [ ] Verify data visibility

### 3. Payment Flow
- [ ] Test subscription check
- [ ] Verify payment modal appears
- [ ] Test M-Pesa flow
- [ ] Test card payment flow
- [ ] Test bank transfer info

---

## Go-Live

### 1. Final Checks
- [ ] All features working
- [ ] No console errors
- [ ] All API calls successful
- [ ] Database saving correctly
- [ ] Admin dashboard accessible

### 2. Documentation
- [ ] Update README with new URLs
- [ ] Document admin access
- [ ] Create user guide
- [ ] Share with team

### 3. Launch
- [ ] Share app URL with users
- [ ] Monitor first logins
- [ ] Be ready for support
- [ ] Collect feedback

---

## Post-Launch

### 1. Week 1
- [ ] Monitor daily active users
- [ ] Check for errors in logs
- [ ] Respond to support queries
- [ ] Fix any critical bugs

### 2. Month 1
- [ ] Review subscription payments
- [ ] Analyze usage patterns
- [ ] Collect user feedback
- [ ] Plan improvements

### 3. Ongoing
- [ ] Regular backups
- [ ] Security updates
- [ ] Feature enhancements
- [ ] User training

---

## Quick Access URLs

| Item | URL |
|------|-----|
| **Main App** | `https://your-app.ondigitalocean.app` |
| **Admin Dashboard** | `https://your-app.ondigitalocean.app/#/copcca-admin` |
| **DigitalOcean Console** | `https://cloud.digitalocean.com` |
| **Supabase Console** | `https://app.supabase.com` |
| **GitHub Repo** | `https://github.com/YOUR_USERNAME/copcca-crm` |

---

## Important Credentials

| Service | Username/ID | Password/Key | Notes |
|---------|-------------|--------------|-------|
| **Admin Dashboard** | - | `COPCCA_ADMIN_2024` | Change this! |
| **DigitalOcean** | your-email | your-password | - |
| **Supabase** | your-email | your-password | - |
| **GitHub** | your-username | your-password | - |

⚠️ **Store these credentials securely!**

---

## Troubleshooting Reference

| Issue | Solution |
|-------|----------|
| App not loading | Check DigitalOcean build logs |
| Database errors | Verify Supabase connection |
| Login not working | Check auth endpoints |
| Admin dashboard 404 | Verify URL has `#/` |
| Slow loading | Enable subscription check flag |
| Payment modal stuck | Disable subscription temporarily |

---

## Support Contacts

| Issue Type | Contact |
|------------|---------|
| **DigitalOcean** | support@digitalocean.com |
| **Supabase** | support@supabase.io |
| **Technical** | Your dev team |
| **Business** | Your admin team |

---

## Success Criteria

You're ready to launch when:
- ✅ App loads in under 3 seconds
- ✅ All 6 modules working
- ✅ Subscription system functional
- ✅ Admin dashboard accessible
- ✅ Database saving data
- ✅ No critical errors in console
- ✅ Mobile responsive
- ✅ HTTPS enabled
- ✅ Admin password changed
- ✅ Team trained

---

**Print this checklist and mark items as you complete them!**

Good luck with your deployment! 🚀
