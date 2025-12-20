# 💼 Pocket CRM - AI-Powered Business Management System

> Production-ready CRM system for customer follow-up, debt collection, and comprehensive business management with multi-user support.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-production-success)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Technology Stack](#technology-stack)
- [License](#license)

---

## 🎯 Overview

**Pocket CRM** is a comprehensive, AI-powered customer relationship management system designed for:
- After-sales follow-up and customer satisfaction tracking
- Debt collection and payment management
- KPI tracking and performance monitoring
- Competitor intelligence gathering
- Sales and marketing strategy management
- Team task management and collaboration

### Key Highlights

✅ **Multi-user authentication** with role-based access control  
✅ **Real-time data synchronization** across team members  
✅ **AI-powered analytics** and reporting  
✅ **80+ global currencies** support  
✅ **PWA support** for offline functionality  
✅ **Responsive design** for mobile and desktop  
✅ **Production-ready** with comprehensive backend integration  

---

## ✨ Features

### 🏠 Dashboard & Analytics
- Real-time business metrics and KPIs
- AI-powered insights and recommendations
- Historical data tracking with calendar view
- Team activity monitoring
- Customizable currency display

### 👥 Multi-User System
- Phone number-based authentication (with country codes)
- Role-based access control (Admin/User)
- User invitation system
- View-as-user capability for admins
- Team presence indicators

### 📊 Six Core Modules

#### 1. **After-Sales Follow-up Tracker**
- Customer issue tracking
- Satisfaction monitoring
- Follow-up scheduling
- Issue resolution tracking

#### 2. **KPI Tracking**
- Performance metric monitoring
- Goal setting and tracking
- Progress visualization
- Achievement analytics

#### 3. **Competitor Intelligence**
- Competitor information database
- Pricing comparison
- Market positioning analysis
- Competitive advantage tracking

#### 4. **Sales & Marketing Strategies**
- Campaign management
- Marketing initiative tracking
- ROI analysis
- Strategy effectiveness monitoring

#### 5. **Debt Collection**
- Outstanding payment tracking
- Payment reminder system
- Collection status monitoring
- Payment history tracking

#### 6. **Task Management**
- Team task assignment
- Priority management
- Due date tracking
- Task feedback system

### 🤖 AI Assistant
- Contextual business insights
- Automated activity reports
- Bullet-point summaries
- Trend analysis

### 🌍 Global Currency Support
- 80+ currencies (USD, EUR, GBP, JPY, INR, AED, SAR, etc.)
- Automatic currency formatting
- Comma-separated number display
- Symbol-based currency selection

### 🎨 User Experience
- Smooth animations with Motion/Framer
- Loading skeletons with shimmer effects
- Toast notifications
- Custom scrollbars
- Responsive design
- PWA support with offline caching

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                         PRODUCTION STACK                          │
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                            │
│                   (Azure Static Web Apps)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   React 18   │  │  TypeScript  │  │ Tailwind CSS │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Vite 5     │  │ Motion/React │  │  Lucide Icons│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Components:                                                     │
│  • Lazy-loaded modules for performance                          │
│  • Optimistic UI updates                                        │
│  • Service Worker for PWA                                       │
│  • Real-time collaboration features                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / REST API
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                             │
│                      (Supabase Cloud)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │            Edge Functions (Hono Server)                │    │
│  │                                                         │    │
│  │  Routes:                                               │    │
│  │  • POST   /signup        - User registration           │    │
│  │  • POST   /make-server-a2294ced/*  - API endpoints    │    │
│  │  • GET    /health        - Health check                │    │
│  │                                                         │    │
│  │  Features:                                              │    │
│  │  • CORS handling                                        │    │
│  │  • Request logging                                      │    │
│  │  • Error handling                                       │    │
│  │  • KV store operations                                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Authentication Service                     │    │
│  │                                                         │    │
│  │  • Email/Password authentication                        │    │
│  │  • Social login (Google, GitHub, etc.)                  │    │
│  │  • JWT token management                                 │    │
│  │  • Session management                                   │    │
│  │  • Role-based access control                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           PostgreSQL Database                           │    │
│  │                                                         │    │
│  │  Tables:                                                │    │
│  │  • kv_store_a2294ced  - Key-value data store           │    │
│  │  • auth.users         - User accounts                   │    │
│  │                                                         │    │
│  │  Features:                                              │    │
│  │  • Row Level Security (RLS)                             │    │
│  │  • Automatic backups                                    │    │
│  │  • Connection pooling                                   │    │
│  │  • Performance indexes                                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Storage Buckets                            │    │
│  │                                                         │    │
│  │  • make-a2294ced-files  - Private file storage          │    │
│  │  • Signed URL generation for secure access              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      CI/CD PIPELINE                              │
│                    (GitHub Actions)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Workflow:                                                       │
│  1. Code push to main branch                                    │
│  2. Run tests and linters                                       │
│  3. Build React application                                     │
│  4. Deploy to Azure Static Web Apps                             │
│  5. Deploy Edge Functions to Supabase                           │
│  6. Run smoke tests                                             │
│  7. Send deployment notifications                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action
    │
    ▼
React Component
    │
    ├─→ Optimistic Update (Immediate UI feedback)
    │
    ▼
API Call (fetch)
    │
    ▼
Azure → Supabase Edge Function
    │
    ├─→ Authentication Check (JWT validation)
    │
    ▼
Database Operation (KV Store)
    │
    ├─→ Row Level Security Check
    │
    ▼
Response
    │
    ▼
Update React State
    │
    ▼
Re-render UI
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Git**
- **Azure account** (for deployment)
- **Supabase account** (for backend)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/pocket-crm.git
cd pocket-crm

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env

# Edit .env with your Supabase credentials:
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=your_anon_key

# 4. Start development server
npm run dev

# 5. Open in browser
# http://localhost:5173
```

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

---

## 🌐 Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Run the automated deployment script
chmod +x deploy-azure.sh
./deploy-azure.sh
```

The script will:
1. ✅ Check prerequisites
2. ✅ Create Azure resources
3. ✅ Set up CI/CD pipeline
4. ✅ Configure environment variables
5. ✅ Deploy your application

### Option 2: Manual Deployment

See detailed guides:
- **[Complete Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Full step-by-step instructions
- **[Management Guide](./MANAGEMENT_GUIDE.md)** - Operations and maintenance
- **[Quick Reference](./QUICK_REFERENCE.md)** - Cheat sheet for common tasks

### Deployment Checklist

After deployment, verify:

- [ ] Frontend is accessible at production URL
- [ ] Users can sign up and login
- [ ] All six modules are functional
- [ ] Data persists correctly
- [ ] Environment variables are set
- [ ] CORS is configured in Supabase
- [ ] CI/CD pipeline is working
- [ ] Custom domain is configured (optional)
- [ ] SSL certificate is active
- [ ] Monitoring alerts are set up

---

## 📚 Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Complete deployment instructions | DevOps, Developers |
| [MANAGEMENT_GUIDE.md](./MANAGEMENT_GUIDE.md) | Operations and maintenance | SysAdmins, Support |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | Quick commands and tips | Everyone |
| [README.md](./README.md) | This file - Project overview | Everyone |

### Key Sections

#### For Developers
- Local development setup
- Code structure and architecture
- API reference
- Contributing guidelines

#### For DevOps
- Deployment procedures
- CI/CD configuration
- Monitoring setup
- Troubleshooting guide

#### For Business Users
- User management
- Feature documentation
- FAQ and support

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI framework |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 5.x | Build tool |
| **Tailwind CSS** | 4.x | Styling |
| **Motion** | Latest | Animations |
| **Lucide React** | Latest | Icons |
| **Sonner** | 2.0.3 | Toast notifications |
| **Recharts** | Latest | Charts and graphs |

### Backend

| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend as a Service |
| **PostgreSQL** | Database |
| **Hono** | Edge function framework |
| **Deno** | Runtime for edge functions |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Azure Static Web Apps** | Frontend hosting |
| **Azure CDN** | Content delivery |
| **Supabase Cloud** | Backend services |
| **GitHub Actions** | CI/CD |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Git** | Version control |
| **Azure CLI** | Azure management |
| **Supabase CLI** | Supabase management |

---

## 📁 Project Structure

```
pocket-crm/
├── public/                      # Static assets
│   ├── service-worker.js       # PWA service worker
│   └── manifest.json           # PWA manifest
│
├── src/
│   ├── components/             # React components
│   │   ├── ui/                # ShadCN UI components
│   │   ├── shared/            # Shared components
│   │   ├── Home.tsx           # Dashboard
│   │   ├── AfterSalesTracker.tsx
│   │   ├── KPITracking.tsx
│   │   ├── CompetitorIntel.tsx
│   │   ├── SalesStrategies.tsx
│   │   ├── DebtCollection.tsx
│   │   ├── TaskManagement.tsx
│   │   ├── AIAssistant.tsx
│   │   └── ...
│   │
│   ├── lib/                    # Utility functions
│   │   ├── auth-context.tsx   # Authentication
│   │   ├── currency-context.tsx # Currency management
│   │   ├── use-data.ts        # Data hooks
│   │   ├── useTeamData.ts     # Team collaboration
│   │   └── utils.ts           # Helper functions
│   │
│   ├── styles/                 # Global styles
│   │   └── globals.css        # Tailwind configuration
│   │
│   ├── utils/                  # Utilities
│   │   └── supabase/          # Supabase configuration
│   │       └── info.tsx       # Supabase credentials
│   │
│   └── App.tsx                 # Main app component
│
├── supabase/                    # Backend code
│   └── functions/
│       └── server/             # Edge functions
│           ├── index.tsx      # Main server file
│           └── kv_store.tsx   # Database utilities
│
├── .github/
│   └── workflows/              # CI/CD workflows
│       └── azure-static-web-apps.yml
│
├── deploy-azure.sh             # Deployment script
├── DEPLOYMENT_GUIDE.md         # Deployment documentation
├── MANAGEMENT_GUIDE.md         # Operations guide
├── QUICK_REFERENCE.md          # Quick reference
├── package.json                # Dependencies
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

---

## 🔐 Security

### Authentication
- ✅ JWT-based authentication via Supabase
- ✅ Secure password hashing
- ✅ Role-based access control (RBAC)
- ✅ Session management
- ✅ Email verification (configurable)

### Data Security
- ✅ Row Level Security (RLS) in database
- ✅ HTTPS only (enforced)
- ✅ Environment variable protection
- ✅ API key rotation capability
- ✅ CORS configuration

### Best Practices
- ✅ No secrets in code
- ✅ Separate dev/staging/production environments
- ✅ Regular security audits (`npm audit`)
- ✅ Dependency updates
- ✅ Input validation and sanitization

---

## 📊 Monitoring & Analytics

### Available Metrics

**Frontend (Azure Application Insights):**
- Page load times
- User sessions
- JavaScript errors
- API call performance
- User flows

**Backend (Supabase Dashboard):**
- API request count
- Database CPU/RAM usage
- Edge function invocations
- Storage usage
- Authentication metrics

### Alerting

Set up alerts for:
- High error rate (> 5%)
- Slow response times (> 5s)
- High resource usage (> 80%)
- Failed deployments
- Budget exceeded

---

## 🐛 Troubleshooting

### Common Issues

**Issue: "Failed to fetch" errors**
```bash
# Check environment variables
az staticwebapp appsettings list --name pocket-crm-app

# Verify CORS in Supabase
# Dashboard → Settings → API → Allowed Origins
```

**Issue: Authentication not working**
```typescript
// Check Supabase auth configuration
// 1. Verify redirect URLs
// 2. Check email confirmation settings
// 3. Test with curl
```

**Issue: Build failures**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

For more troubleshooting, see [MANAGEMENT_GUIDE.md](./MANAGEMENT_GUIDE.md).

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
   ```bash
   npm run build
   npm run preview
   ```
5. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Commit Message Convention

```
feat: New feature
fix: Bug fix
docs: Documentation changes
style: Code style changes (formatting)
refactor: Code refactoring
test: Adding tests
chore: Build process or auxiliary tool changes
```

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Pocket CRM

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Support

### Documentation
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Management Guide](./MANAGEMENT_GUIDE.md)
- [Quick Reference](./QUICK_REFERENCE.md)

### Community
- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/pocket-crm/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/pocket-crm/discussions)

### Professional Support
For enterprise support, contact: **support@your-company.com**

---

## 🎉 Acknowledgments

Built with:
- [React](https://react.dev) - UI framework
- [Supabase](https://supabase.com) - Backend infrastructure
- [Azure](https://azure.microsoft.com) - Cloud hosting
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [ShadCN UI](https://ui.shadcn.com) - Component library
- [Motion](https://motion.dev) - Animations

Special thanks to all contributors and the open-source community!

---

## 🗺️ Roadmap

### ✅ Completed
- Multi-user authentication system
- Six core business modules
- AI-powered analytics
- Real-time collaboration
- PWA support
- Production deployment

### 🚧 In Progress
- Mobile app (React Native)
- Advanced reporting
- Email integration
- WhatsApp notifications

### 📋 Planned
- Multi-language support
- Advanced AI features
- Third-party integrations (Salesforce, HubSpot)
- Custom branding per user
- API for external integrations

---

## 📈 Stats

![GitHub Stars](https://img.shields.io/github/stars/YOUR_USERNAME/pocket-crm?style=social)
![GitHub Forks](https://img.shields.io/github/forks/YOUR_USERNAME/pocket-crm?style=social)
![GitHub Issues](https://img.shields.io/github/issues/YOUR_USERNAME/pocket-crm)
![GitHub PRs](https://img.shields.io/github/issues-pr/YOUR_USERNAME/pocket-crm)

---

<div align="center">

**Made with ❤️ by Your Team**

[Website](https://your-domain.com) • [Documentation](./DEPLOYMENT_GUIDE.md) • [Support](mailto:support@your-company.com)

</div>
