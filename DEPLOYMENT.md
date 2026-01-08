# 🚀 Deployment Guide

Complete guide to deploy your COPCCA CRM system to production.

## 📋 Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database setup completed in Supabase
- [ ] Application tested locally
- [ ] Build succeeds without errors
- [ ] All features working as expected
- [ ] Supabase RLS policies enabled
- [ ] Authentication flows tested

## 🌐 Deployment Options

### Option 1: Vercel (Recommended) ⭐

**Advantages:**
- Free tier available
- Automatic deployments
- Built-in CI/CD
- Global CDN
- Zero configuration

**Steps:**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Configure Environment Variables**
   - Go to your project on vercel.com
   - Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

5. **Redeploy**
   ```bash
   vercel --prod
   ```

**Custom Domain:**
```bash
vercel domains add yourdomain.com
```

---

### Option 2: Netlify

**Advantages:**
- Free tier available
- Form handling
- Serverless functions
- Easy rollbacks

**Steps:**

1. **Build the Project**
   ```bash
   npm run build
   ```

2. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

3. **Login**
   ```bash
   netlify login
   ```

4. **Initialize**
   ```bash
   netlify init
   ```

5. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

6. **Set Environment Variables**
   ```bash
   netlify env:set VITE_SUPABASE_URL "your_url"
   netlify env:set VITE_SUPABASE_ANON_KEY "your_key"
   ```

7. **Deploy**
   ```bash
   netlify deploy --prod
   ```

**Or via Web UI:**
1. Go to app.netlify.com
2. Drag and drop the `dist` folder
3. Configure environment variables in Settings

---

### Option 3: Cloudflare Pages

**Advantages:**
- Free unlimited bandwidth
- Global CDN
- Fast performance
- Built-in analytics

**Steps:**

1. **Build the Project**
   ```bash
   npm run build
   ```

2. **Via Git Integration:**
   - Push code to GitHub/GitLab
   - Go to pages.cloudflare.com
   - Connect repository
   - Configure:
     - Build command: `npm run build`
     - Build output: `dist`
   - Add environment variables

3. **Via Wrangler CLI:**
   ```bash
   npm install -g wrangler
   wrangler login
   wrangler pages publish dist
   ```

---

### Option 4: AWS Amplify

**Advantages:**
- AWS integration
- Auto-scaling
- Custom domains
- SSL included

**Steps:**

1. **Push to Git** (GitHub, GitLab, or Bitbucket)

2. **Go to AWS Amplify Console**
   - Connect repository
   - Configure build settings:
     ```yaml
     version: 1
     frontend:
       phases:
         preBuild:
           commands:
             - npm install
         build:
           commands:
             - npm run build
       artifacts:
         baseDirectory: dist
         files:
           - '**/*'
       cache:
         paths:
           - node_modules/**/*
     ```

3. **Add Environment Variables**
   - In Amplify Console → App Settings → Environment Variables
   - Add Supabase credentials

4. **Deploy**
   - Amplify auto-deploys on push to main branch

---

### Option 5: Docker + Any Cloud

**Dockerfile:**

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**

```nginx
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Build and Run:**

```bash
# Build image
docker build -t copcca-crm .

# Run container
docker run -d -p 80:80 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  copcca-crm
```

**Deploy to:**
- AWS ECS/EKS
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform

---

## 🔧 Post-Deployment Configuration

### 1. Configure Supabase for Production

**Update Auth Settings:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your production URL to:
   - Site URL
   - Redirect URLs
   - Additional Redirect URLs

**Example:**
```
Site URL: https://your-domain.com
Redirect URLs: 
  - https://your-domain.com
  - https://your-domain.com/reset-password
```

### 2. Enable Email Templates

Go to Supabase → Authentication → Email Templates
Customize:
- Confirmation email
- Reset password email
- Invite email

### 3. Configure CORS

In Supabase → Settings → API:
- Add your production domain to allowed origins

### 4. Set Up Custom Domain

**For Vercel:**
```bash
vercel domains add yourdomain.com
```

**DNS Configuration:**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 5. Enable HTTPS

All platforms enable HTTPS automatically with Let's Encrypt.

### 6. Configure PWA

Ensure `vite-plugin-pwa` is properly configured:
- Update manifest with production URL
- Test offline functionality
- Verify service worker registration

---

## 🔒 Security Best Practices

### Environment Variables
- ✅ Never commit `.env` file
- ✅ Use platform-specific env variable management
- ✅ Rotate keys regularly
- ✅ Use different keys for dev/staging/prod

### Supabase Security
- ✅ Enable RLS on all tables
- ✅ Review and test policies
- ✅ Limit API key permissions
- ✅ Enable email verification
- ✅ Set up MFA for admin accounts

### Application Security
- ✅ Keep dependencies updated
- ✅ Use HTTPS only
- ✅ Implement rate limiting
- ✅ Enable CORS properly
- ✅ Sanitize user inputs
- ✅ Use secure headers

---

## 📊 Monitoring & Analytics

### 1. Supabase Analytics
- Monitor database queries
- Track authentication events
- Review API usage

### 2. Application Monitoring

**Add Error Tracking (Optional):**

Install Sentry:
```bash
npm install @sentry/react @sentry/tracing
```

Configure in `main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### 3. Performance Monitoring

Use built-in browser tools:
- Lighthouse scores
- Core Web Vitals
- Network performance

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🧪 Testing Before Deployment

### Manual Testing Checklist
- [ ] Login/Registration works
- [ ] All pages load correctly
- [ ] Real-time updates work
- [ ] Forms submit properly
- [ ] Data displays correctly
- [ ] Mobile responsive
- [ ] PWA installs
- [ ] Offline mode works
- [ ] Search functionality
- [ ] Navigation works
- [ ] Logout works

### Performance Testing
```bash
# Build and analyze bundle
npm run build
npx vite-bundle-visualizer
```

### Lighthouse Audit
1. Open DevTools
2. Go to Lighthouse tab
3. Generate report
4. Aim for 90+ scores

---

## 🚨 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Environment Variables Not Working
- Ensure variables start with `VITE_`
- Restart dev server after changes
- Check platform-specific env var syntax

### Supabase Connection Issues
- Verify URL and key
- Check CORS settings
- Ensure RLS policies are correct
- Test connection from browser console

### PWA Not Installing
- Check manifest.json is accessible
- Verify service worker registration
- Ensure HTTPS is enabled
- Test in Chrome DevTools → Application

---

## 📈 Scaling Considerations

### Database
- Monitor Supabase usage
- Upgrade plan if needed
- Add indexes for slow queries
- Consider connection pooling

### Frontend
- Enable CDN caching
- Use image optimization
- Implement lazy loading
- Consider code splitting

### Backend
- Use Supabase edge functions for complex logic
- Implement rate limiting
- Cache frequently accessed data
- Monitor API usage

---

## 🎉 Deployment Complete!

After deployment:
1. ✅ Test all features in production
2. ✅ Share URL with team
3. ✅ Set up monitoring
4. ✅ Create admin account
5. ✅ Import initial data
6. ✅ Train users
7. ✅ Celebrate! 🎊

---

**Need Help?**
- Check application logs
- Review Supabase logs
- Test in browser DevTools
- Consult platform documentation

**Support:**
- Vercel: vercel.com/support
- Netlify: netlify.com/support
- Supabase: supabase.com/docs

---

**Happy Deploying! 🚀**
