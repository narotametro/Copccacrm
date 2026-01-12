# COPCCA CRM System Architecture

## System Separation

COPCCA CRM is now separated into two distinct systems:

### 1. COPCCA CRM APP (Customer-Facing)
**Access:** All registered customers/companies
**URL:** `/app/*`
**Login:** `/login`

**Features:**
- Dashboard with AI insights
- Customer management (360-degree view)
- Sales pipeline tracking
- Marketing strategies
- Product catalog
- Competitor analysis
- Debt collection management
- Reports & analytics
- User management (company-level)
- Settings & profile

**Security:**
- Standard user authentication via Supabase
- Role-based access (admin, manager, user)
- Company-level data isolation
- 7-day free trial system
- Payment popup for expired subscriptions

---

### 2. COPCCA PLATFORM ADMIN (Internal Office Only)
**Access:** COPCCA office staff ONLY
**URL:** `/copcca-admin/*`
**Login:** `/copcca-admin/login`

**Credentials:**
- Email: `admin@copcca.com`
- Password: `COPCCA2026Admin!`

**Features:**
- Master dashboard with all companies
- Subscription management for all customers
- 7-day trial tracking
- Payment popup control (enable/disable per company)
- User management across all companies
- Revenue tracking and analytics
- System-wide monitoring
- Company enable/disable/delete functionality

**Security:**
- Hardcoded credentials (maximum security)
- Session-based authentication (24-hour timeout)
- Completely separate from customer CRM
- No customer can access, even admins
- All activities logged and monitored

---

## Access Control

### Customer CRM Users:
✅ Can access `/app/*` routes
✅ Can manage their own company data
✅ Can manage users within their company (if admin)
❌ **CANNOT** access `/copcca-admin/*` routes
❌ **CANNOT** see other companies' data
❌ **CANNOT** control platform-level settings

### COPCCA Office Staff:
✅ Can access `/copcca-admin/*` routes
✅ Can see all companies and subscriptions
✅ Can enable/disable payment popups
✅ Can manage any user in any company
✅ Can track revenue across all customers
❌ Must use separate login at `/copcca-admin/login`
❌ Session expires after 24 hours

---

## Authentication Flow

### Customer Login Flow:
1. User visits `/login`
2. Enters email/password
3. Authenticated via Supabase
4. Redirected to `/app/dashboard`
5. Can navigate all `/app/*` routes

### COPCCA Admin Login Flow:
1. Staff visits `/copcca-admin/login`
2. Enters COPCCA credentials
3. Session stored in sessionStorage (24 hours)
4. Redirected to `/copcca-admin/dashboard`
5. Can navigate all `/copcca-admin/*` routes

---

## Key Differences

| Feature | Customer CRM | COPCCA Platform Admin |
|---------|--------------|----------------------|
| **Access** | All registered customers | COPCCA office only |
| **Authentication** | Supabase Auth | Hardcoded credentials |
| **Data Scope** | Single company | All companies |
| **User Management** | Own company only | All companies |
| **Payment Control** | View only (if popup shown) | Full control |
| **Trial Management** | Automatic | Manual override |
| **URL Path** | `/app/*` | `/copcca-admin/*` |
| **Login URL** | `/login` | `/copcca-admin/login` |

---

## Session Management

### Customer Sessions:
- Managed by Supabase Auth
- Token-based authentication
- Automatic refresh
- Cross-tab synchronization

### COPCCA Admin Sessions:
- sessionStorage-based
- 24-hour timeout
- Single-tab only
- Manual logout required

---

## Security Features

### Customer CRM:
- Row-level security (RLS) in database
- Company-level data isolation
- Role-based access control
- Password reset via email
- Email verification

### COPCCA Platform Admin:
- No database connection for auth
- Hardcoded credentials in code
- Session timeout after 24 hours
- Activity logging (planned)
- IP restriction (planned)
- 2FA (planned for future)

---

## Navigation

### Customer CRM Navigation:
Located in left sidebar of `/app/*`:
- Home (AI Center)
- Customers
- Sales
- Marketing
- Products
- Competitors
- Debt Collection
- Reports & AI
- Admin (company users)
- My Workplace

### COPCCA Admin Navigation:
Located in top tabs of `/copcca-admin/*`:
- Dashboard
- Companies
- Subscriptions
- System

---

## Deployment Notes

1. Customer CRM and Platform Admin are in same codebase but completely separated
2. No shared state between the two systems
3. No shared authentication
4. No shared navigation
5. Different color schemes (Customer: Blue/Purple, Admin: Dark Purple/Black)
6. Platform Admin credentials should be changed before production deployment
7. Consider moving Platform Admin to separate subdomain in production

---

## Future Enhancements

### Planned for COPCCA Platform Admin:
- [ ] Activity logging and audit trail
- [ ] IP whitelisting
- [ ] Two-factor authentication (2FA)
- [ ] Email alerts for critical actions
- [ ] Advanced analytics dashboard
- [ ] Automated backup system
- [ ] Export functionality for reports
- [ ] Integration with accounting systems

### Planned for Customer CRM:
- [ ] Mobile app
- [ ] Advanced AI features
- [ ] Workflow automation
- [ ] Custom reporting builder
- [ ] Third-party integrations
- [ ] API access for customers

---

## Support

For COPCCA office staff issues with Platform Admin, contact IT department.
For customer CRM issues, contact support@copcca.com.
