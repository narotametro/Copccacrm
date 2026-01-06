# 📚 POCKET CRM - COMPLETE DOCUMENTATION

## 🎯 SYSTEM OVERVIEW

**Pocket** is an AI-powered customer relationship management system for automating customer follow-up after sales and debt collection. It features a pink-themed sidebar interface with role-based access control and multi-user team collaboration.

---

## 🏗️ ARCHITECTURE

### **Technology Stack**
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno + Hono)
- **Database**: Supabase KV Store
- **Auth**: Supabase Auth (phone-based)
- **Email**: Resend API
- **Storage**: Supabase Storage (for file uploads)

### **Three-Tier Architecture**
```
Frontend (React)
    ↓
Server (Hono/Deno)
    ↓
Database (KV Store)
```

---

## 🔐 AUTHENTICATION SYSTEM

### **Phone-Based Authentication**
- 195+ countries with country code selection
- Phone number validation
- Role-based access (Admin/User)
- Secure password hashing

### **Team Invitations**
- WhatsApp-only invitation links
- Unique invite codes
- Automatic team assignment
- 7-day expiration

### **User Roles**
- **Admin**: Full access, can view all users' data, manage team members
- **User**: Limited to own data, team member

---

## 📦 CORE MODULES

### **1. Dashboard (Home)**
- Activity feed
- Quick stats
- AI Assistant with context-aware insights
- Recent activities across all modules

### **2. After-Sales Follow-up Tracker**
- Customer management
- Product catalog with price tracking
- Follow-up scheduling
- AI agents for automated outreach (Voice, SMS, WhatsApp)
- Performance data collection

### **3. Competitor Intelligence**
- Product-based competitor tracking
- Threat level analysis
- AI-powered competitive insights
- Brand comparison view
- Customer loss tracking

### **4. Debt Collection**
- Invoice management
- Payment tracking
- Automated follow-up scheduling
- AI agents for payment reminders
- Overdue payment alerts

### **5. Sales & Marketing Strategies**
- Campaign management
- Budget tracking
- ROI calculation
- Timeline planning
- Category-based organization

### **6. KPI Tracking**
- Custom KPI creation
- Performance monitoring
- Trend analysis
- AI insights on performance
- Multiple KPI categories

### **7. Data Integrations**
- Import/Export functionality
- Third-party integrations (placeholder)
- Data synchronization

### **8. User Management (Admin Only)**
- Team member invitation
- User role management
- Company branding settings
- Team overview

### **9. Reports**
- Cross-module analytics
- Export capabilities
- Custom date ranges
- Performance summaries

---

## 🎨 FEATURES

### **Company Branding**
- Custom business/company name
- Visibility toggle (show/hide on all pages)
- Admin-only configuration

### **User Selector (Admin)**
- View all users' data aggregated
- Select specific users to view individual data
- Seamless switching between user views
- Available on all module pages except User Management

### **AI Agents**
- **After-Sales**: Voice, SMS, WhatsApp outreach
- **Debt Collection**: Automated payment reminders
- **Scheduling**: Customizable timing and frequency
- **Message Templates**: Pre-configured messaging

### **Name Formatting**
- Automatic capitalization (First Letter Of Each Word)
- Applied across all user-facing displays
- Handles multiple spaces gracefully

### **Currency Support**
- Multi-currency system
- Currency symbol display
- Context-aware currency selection

---

## 🗄️ DATA STORAGE

### **KV Store Structure**
```
users:profile:{userId}     - User profiles
team:{teamId}              - Team information
team:members:{teamId}      - Team member lists
invite:{inviteCode}        - Invitation data
aftersales:{userId}        - After-sales records
competitors:{userId}       - Competitor intel records
myproducts:{userId}        - Product catalog
debt:{userId}              - Debt collection records
strategies:{userId}        - Sales strategies
kpi:{userId}               - KPI records
activities:{userId}        - Activity log
company:settings:{userId}  - Company branding
```

### **Future Database Migration**
- Complete PostgreSQL schema available in `/database/schema.sql`
- 11 tables with proper relationships
- Row-level security configured
- 25+ indexes for performance
- Migration guide available in `/database/MIGRATION_GUIDE.md`

---

## 🔧 API ENDPOINTS

### **Authentication**
- `POST /make-server-a2294ced/signup` - User registration
- `POST /make-server-a2294ced/password-reset-request` - Request reset
- `POST /make-server-a2294ced/password-reset-confirm` - Confirm reset
- `GET /make-server-a2294ced/profile` - Get user profile

### **Users**
- `GET /make-server-a2294ced/users` - Get all users (admin)
- `GET /make-server-a2294ced/users/:id` - Get specific user
- `PUT /make-server-a2294ced/users/:id` - Update user profile

### **After-Sales**
- `GET /make-server-a2294ced/aftersales` - Get records
- `POST /make-server-a2294ced/aftersales` - Create record
- `PUT /make-server-a2294ced/aftersales/:id` - Update record
- `DELETE /make-server-a2294ced/aftersales/:id` - Delete record

### **Competitors**
- `GET /make-server-a2294ced/competitors` - Get all
- `POST /make-server-a2294ced/competitors` - Create
- `PUT /make-server-a2294ced/competitors/:id` - Update
- `DELETE /make-server-a2294ced/competitors/:id` - Delete

### **Products**
- `GET /make-server-a2294ced/myproducts` - Get all
- `POST /make-server-a2294ced/myproducts` - Create
- `PUT /make-server-a2294ced/myproducts/:id` - Update
- `DELETE /make-server-a2294ced/myproducts/:id` - Delete

### **Debt**
- `GET /make-server-a2294ced/debt` - Get all
- `POST /make-server-a2294ced/debt` - Create
- `PUT /make-server-a2294ced/debt/:id` - Update
- `DELETE /make-server-a2294ced/debt/:id` - Delete

### **Strategies**
- `GET /make-server-a2294ced/strategies` - Get all
- `POST /make-server-a2294ced/strategies` - Create
- `PUT /make-server-a2294ced/strategies/:id` - Update
- `DELETE /make-server-a2294ced/strategies/:id` - Delete

### **KPIs**
- `GET /make-server-a2294ced/kpi` - Get all
- `POST /make-server-a2294ced/kpi` - Create
- `PUT /make-server-a2294ced/kpi/:id` - Update
- `DELETE /make-server-a2294ced/kpi/:id` - Delete

### **Activities**
- `GET /make-server-a2294ced/activities` - Get activity log

### **Company Settings**
- `GET /make-server-a2294ced/company-settings` - Get settings
- `PUT /make-server-a2294ced/company-settings` - Update settings

### **Team Management**
- `POST /make-server-a2294ced/invite` - Create invitation
- `GET /make-server-a2294ced/invite/:code` - Get invitation details
- `GET /make-server-a2294ced/team/members` - Get team members

### **Email**
- `POST /make-server-a2294ced/email/send` - Send email
- `POST /make-server-a2294ced/email/send-invitation` - Send invite

### **WhatsApp**
- `POST /make-server-a2294ced/whatsapp/send` - Send message
- `POST /make-server-a2294ced/whatsapp/bulk` - Bulk send
- `POST /make-server-a2294ced/whatsapp/template` - Send template

---

## 📱 RESPONSIVE DESIGN

- Mobile-first approach
- Responsive tables and grids
- Collapsible sidebar on mobile
- Touch-friendly UI elements
- Optimized for all screen sizes

---

## ⚡ PERFORMANCE OPTIMIZATIONS

### **Code Splitting**
- Lazy-loaded route components
- Suspense boundaries for loading states
- Memoized components for re-render prevention

### **React Optimizations**
- `memo()` for expensive components
- Proper dependency arrays in hooks
- Debounced search inputs
- Virtualized long lists (where applicable)

### **API Optimizations**
- Request caching
- Parallel data fetching
- Error boundary protection
- Retry logic for failed requests

---

## 🔒 SECURITY FEATURES

### **Authentication**
- Secure password hashing
- JWT token-based auth
- Access token validation
- Auto-logout on token expiry

### **Authorization**
- Role-based access control
- User data isolation
- Team-based data sharing
- Protected API routes

### **Data Protection**
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration

---

## 🚀 DEPLOYMENT

### **Environment Variables**
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
WHATSAPP_API_KEY (optional)
```

### **Build Process**
1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Deploy frontend to hosting service
4. Deploy backend functions to Supabase

---

## 🧪 TESTING GUIDE

### **User Account Testing**
1. Sign up as Admin
2. Set company name
3. Create team invite
4. Sign up as User (using invite)
5. Test data isolation
6. Test admin viewing user data

### **Module Testing**
1. Create sample data in each module
2. Test CRUD operations
3. Test search and filters
4. Test AI agent scheduling
5. Test data export

---

## 🐛 TROUBLESHOOTING

### **Authentication Issues**
- Check Supabase project URL and keys
- Verify phone number format
- Check invite code expiration
- Clear browser cache

### **Data Not Loading**
- Check browser console for errors
- Verify API endpoint availability
- Check user authentication status
- Verify correct user ID in requests

### **AI Features Not Working**
- Check environment variables
- Verify API key configuration
- Check backend logs
- Test API connectivity

---

## 📄 LICENSE & ATTRIBUTIONS

See `/Attributions.md` for full details.

---

## 🎯 QUICK START

1. **Clone repository**
2. **Install dependencies**: `npm install`
3. **Set up Supabase project**
4. **Configure environment variables**
5. **Run development server**: `npm run dev`
6. **Create admin account**
7. **Set company name**
8. **Invite team members**
9. **Start adding data**

---

## 📞 SUPPORT

For issues or questions:
1. Check this documentation
2. Review `/database/README.md` for database details
3. Check `/LAUNCH_GUIDE.md` for deployment steps
4. Review `/QUICK_START_GUIDE.md` for getting started

---

**Version**: 1.0  
**Last Updated**: November 2024  
**Status**: Production Ready ✅
