# COPCCA CRM - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd COPCCA-CRM
npm install
```

### Step 2: Set Up Supabase

1. **Create a Supabase account** at [supabase.com](https://supabase.com)
2. **Create a new project**
3. **Get your credentials**:
   - Go to Project Settings > API
   - Copy the `Project URL` and `anon/public` key

### Step 3: Configure Environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Set Up Database

1. Go to your Supabase project
2. Click on "SQL Editor" in the left sidebar
3. Copy and paste the contents of `database-setup.sql`
4. Click "Run" to execute the script

### Step 5: Start the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser!

## 📝 First Login

### Create Your Admin Account

1. Click "Create account" on the login page
2. Fill in your details:
   - Full Name
   - Email
   - Password (min 6 characters)
3. Check your email for verification link
4. After verification, you can sign in!

### Set Yourself as Admin

After creating your account, run this SQL in Supabase:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## 🎨 Customization

### Branding
- Logo: Replace logo files in `/public`
- Colors: Edit `tailwind.config.js`
- Fonts: Update `src/index.css`

### Features
All features are modular and can be enabled/disabled in:
- Routes: `src/App.tsx`
- Navigation: `src/components/layout/AppLayout.tsx`

## 📱 Deploy as PWA

### Build for Production
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

### Deploy Options
- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop `dist` folder
- **Cloudflare Pages**: Connect Git repository

## 🔧 Common Issues

### "Missing Supabase credentials"
- Make sure `.env` file exists in root directory
- Verify the environment variables are correct
- Restart the dev server after changing `.env`

### Database errors
- Run `database-setup.sql` in Supabase SQL Editor
- Check that RLS policies are enabled
- Verify authentication is working

### Build errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `rm -rf dist && npm run build`
- Check TypeScript errors: `npm run build`

## 🎯 Next Steps

1. **Add Sample Data**: Create some test customers and deals
2. **Invite Team Members**: Use the User Management module
3. **Customize Workflows**: Adjust stages and statuses
4. **Set Up Reports**: Configure KPI tracking
5. **Enable Notifications**: Set up email templates in Supabase

## 📚 Documentation

- [Full Documentation](README.md)
- [Supabase Docs](https://supabase.com/docs)
- [React Router Docs](https://reactrouter.com)
- [Tailwind CSS Docs](https://tailwindcss.com)

## 💡 Pro Tips

- Use `Ctrl+K` to open search (when implemented)
- Access AI Assistant from bottom-right corner
- Sidebar is collapsible for more screen space
- All data updates in real-time across users
- PWA works offline after first load

## 🆘 Need Help?

- Check the [README.md](README.md) for detailed information
- Review the database schema in `database-setup.sql`
- Inspect component code in `src/components/`
- Look at page examples in `src/pages/`

---

**Happy CRM-ing! 🎉**
