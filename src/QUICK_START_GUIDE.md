# 🚀 Quick Start Guide - Pocket AI System

## ⚠️ IMPORTANT: First-Time Setup

If you're seeing **"Invalid login credentials"** errors, it means **no accounts exist yet** in the system. You need to **create your first account** before you can log in.

---

## ✅ Step-by-Step: Create Your First Account

### Step 1: Open the App
When you open Pocket, you'll see the login/signup screen.

### Step 2: Look for the "Sign Up" Tab
- The **"Sign Up" tab should be selected by default** (highlighted in white)
- If you see "Login" selected instead, **click the "Sign Up" tab**

### Step 3: Fill in Your Information
```
Name:     [Your Full Name]
Email:    [your.email@example.com]
Password: [Choose a secure password]
```

**Example:**
```
Name:     John Smith
Email:    john.smith@company.com
Password: MySecurePassword123
```

### Step 4: Click "Create Account"
- The button will show "Please wait..." while processing
- Wait for the account creation to complete

### Step 5: Automatic Login
- After signup, you'll be **automatically logged in**
- You'll be redirected to the **Home dashboard**

### Step 6: Load Sample Data (Recommended)
- On the Home page, you'll see a blue box that says **"Load Sample Data"**
- Click the button to add demo data (customers, competitors, debts, etc.)
- This helps you explore all the features

---

## 🎯 What You Get

Your first account automatically has:
- ✅ **Admin Privileges** - Full access to all features
- ✅ **Team Management** - Ability to add other users
- ✅ **All Modules** - Access to all 5 core modules
- ✅ **Data Control** - Can view and manage all team data

---

## 📧 Logging In (After Account Creation)

Once you've created an account:

1. **Click "Login" tab** (if you're not already logged in)
2. **Enter your email and password** (the ones you used to sign up)
3. **Click "Login"**
4. You'll be logged in to your dashboard

---

## ❌ Troubleshooting Common Errors

### Error: "Invalid email or password"

**Cause:** Account doesn't exist with those credentials

**Solutions:**
1. **If you haven't created an account:**
   - Click the **"Sign Up" tab**
   - Create your account (see steps above)

2. **If you already created an account:**
   - Make sure you're using the **correct email**
   - Check your password (it's **case-sensitive**)
   - Look for typos in your email

3. **Still not working?**
   - Open browser console (F12)
   - Look for error messages
   - Check if you see: `✅ Auth successful` or `❌ Supabase auth error`

### Error: "This email is already registered"

**Cause:** An account already exists with this email

**Solution:**
- Switch to **"Login" tab**
- Use your password to log in
- If you forgot your password, you'll need to create a new account with a different email (password reset not yet implemented)

### Can't See the Sign Up Tab?

**Check:**
- Make sure you're on the login/signup screen
- You should see two tabs at the top: **"Login"** and **"Sign Up"**
- Click **"Sign Up"** to switch to account creation

---

## 🔍 Visual Guide

### What You Should See (Sign Up Tab Selected):

```
┌─────────────────────────────────────┐
│  [P]  Welcome to Pocket             │
│  AI-powered customer follow-up      │
│                                     │
│  👋 Create your first account!      │
│                                     │
│  ┌──────────┬──────────┐           │
│  │  Login   │ Sign Up  │ ← Click   │
│  └──────────┴──────────┘           │
│                                     │
│  Full Name:                         │
│  [Enter your name................]  │
│                                     │
│  Email:                             │
│  [Enter your email...............]  │
│                                     │
│  Password:                          │
│  [Enter your password............]  │
│                                     │
│  ✨ Create Your Admin Account       │
│  ✅ Full admin privileges           │
│  ✅ Manage team members             │
│  ✅ Access all modules              │
│  ✅ Load sample data to explore     │
│                                     │
│  [    Create Account    ]           │
│                                     │
└─────────────────────────────────────┘
```

---

## 📱 Browser Console Messages

When you successfully sign up, you'll see these messages in the console (F12):

```
📝 Creating user account for: John Smith john.smith@company.com
✅ User created successfully, userId: abc123xyz
🔐 Signing in new user...
✅ Auth successful, fetching profile...
✅ Profile fetched: John Smith (admin)
✅ Login completed successfully
```

If you see these ✅ messages, everything is working!

If you see ❌ messages, something went wrong - check the error details.

---

## 🏢 System Architecture

### Authentication Flow:

```
1. Sign Up → Creates Supabase Auth User → Creates Profile in Database → Auto Login
2. Login → Verifies Supabase Auth → Fetches Profile → Access Granted
```

### First Account:
- **Role:** Admin (automatically)
- **Team:** New team created with you as the admin
- **Access:** Full system access

### Additional Users:
- Added by admin through User Management
- Can be "admin" or "user" role
- Join the admin's team

---

## 🎓 Next Steps After Login

1. **Explore the Dashboard**
   - View system overview
   - See activity stream
   - Check integrations

2. **Load Sample Data**
   - Click "Load Sample Data" button
   - Wait for data to load
   - Explore with demo data

3. **Add Your First Customer**
   - Go to "After-Sales Follow-up"
   - Click "Add Customer"
   - Fill in details
   - Save

4. **Invite Team Members** (Optional)
   - Go to "User Management" (admin only)
   - Click "Add User"
   - Enter their details
   - They can now log in

5. **Connect Integrations** (Optional)
   - Click "Integrations" icon on Home
   - Add Salesforce, QuickBooks, etc.
   - Sync your data

---

## 💡 Pro Tips

### Tip 1: Use a Real Email
While any email works, use a real one you can remember for logging in later.

### Tip 2: Save Your Password
Write down your password somewhere safe. There's no password reset yet.

### Tip 3: Load Sample Data
If you're just exploring, load the sample data first. It's much easier than adding everything manually.

### Tip 4: Check Browser Console
If something goes wrong, press F12 and look at the Console tab. The error messages are very helpful.

### Tip 5: One Admin Account First
Create ONE admin account first. Then add team members through User Management.

---

## 🆘 Still Having Issues?

### Check These:

1. **Browser Console (F12)**
   - Are there any red error messages?
   - Do you see ✅ or ❌ symbols?

2. **Internet Connection**
   - Is your internet working?
   - Can you access other websites?

3. **Browser Compatibility**
   - Use Chrome, Firefox, Safari, or Edge
   - Make sure JavaScript is enabled

4. **Clear Cache**
   - Sometimes old data causes issues
   - Try clearing browser cache
   - Or use an incognito/private window

### Get More Help:

1. Check `/AUTHENTICATION_FIX.md` for detailed authentication info
2. Check `/AFTER_SALES_DEBUG.md` for module-specific debugging
3. Check `/DEBUG_API_ISSUES.md` for API troubleshooting

---

## ✅ Success Checklist

After completing these steps, you should have:

- [ ] Created your admin account
- [ ] Logged in successfully
- [ ] Seen the Home dashboard
- [ ] Loaded sample data (optional)
- [ ] Explored at least one module
- [ ] Understood how to add team members

---

## 🎉 You're All Set!

Congratulations! You've successfully set up your Pocket AI system. Now you can:

- Track after-sales follow-ups
- Monitor competitors
- Manage debt collection
- Create sales strategies
- Track KPIs
- Use the AI assistant

**Happy tracking! 🚀**
