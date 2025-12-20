# 📊 ENTITY RELATIONSHIP DIAGRAM

## Database Schema Visualization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                          SUPABASE AUTH.USERS                                │
│                         (Managed by Supabase)                               │
│                                                                             │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ id (UUID)
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │        USERS           │
                    │  (User Profiles)       │
                    ├────────────────────────┤
                    │ • id (PK, FK)          │
                    │ • email (UNIQUE)       │
                    │ • name                 │
                    │ • role (admin/user)    │
                    │ • status               │
                    │ • avatar_url           │
                    │ • phone                │
                    │ • created_at           │
                    │ • updated_at           │
                    └────────┬───────────────┘
                             │
            ┌────────────────┼────────────────────────────┐
            │                │                            │
            │                │                            │
            ▼                ▼                            ▼
    ┌──────────────┐  ┌──────────────┐         ┌─────────────────┐
    │  COMPANIES   │  │    TEAM_     │         │  INVITATIONS    │
    │              │  │ MEMBERSHIPS  │         │                 │
    ├──────────────┤  ├──────────────┤         ├─────────────────┤
    │ • id (PK)    │  │ • id (PK)    │         │ • id (PK)       │
    │ • owner_id   │  │ • admin_id   │◄────────┤ • admin_id (FK) │
    │   (FK)       │  │   (FK)       │         │ • code (UNIQUE) │
    │ • name       │  │ • member_id  │         │ • email         │
    │ • logo_url   │  │   (FK)       │         │ • name          │
    │ • industry   │  │ • joined_at  │         │ • role          │
    │ • website    │  └──────────────┘         │ • expires_at    │
    │ • show_on_   │                           │ • used          │
    │   all_pages  │                           │ • used_by (FK)  │
    │ • created_at │                           │ • used_at       │
    │ • updated_at │                           │ • created_at    │
    └──────────────┘                           └─────────────────┘
            │
            │ owner_id
            │
            ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                      BUSINESS DATA                            │
    │                    (user_id FK in all)                        │
    └──────────────────────────────────────────────────────────────┘
            │
            │
     ┌──────┴──────┬──────────┬──────────┬──────────┬─────────┐
     │             │          │          │          │         │
     ▼             ▼          ▼          ▼          ▼         ▼
┌─────────┐  ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐
│ AFTER_  │  │COMPETI- │ │   MY_  │ │  DEBT_ │ │ SALES_ │ │   KPI_  │
│ SALES_  │  │  TORS   │ │PRODUCTS│ │RECORDS │ │STRATE- │ │ RECORDS │
│ RECORDS │  │         │ │        │ │        │ │  GIES  │ │         │
├─────────┤  ├─────────┤ ├────────┤ ├────────┤ ├────────┤ ├─────────┤
│• id (PK)│  │• id (PK)│ │• id(PK)│ │• id(PK)│ │• id(PK)│ │• id (PK)│
│• user_id│  │• user_id│ │• user_ │ │• user_ │ │• user_ │ │• user_id│
│  (FK)   │  │  (FK)   │ │  id(FK)│ │  id(FK)│ │  id(FK)│ │  (FK)   │
│• cust_  │  │• name   │ │• name  │ │• cust_ │ │• title │ │• date   │
│  name   │  │• indus- │ │• categ-│ │  name  │ │• descr-│ │  (UNIQ) │
│• cust_  │  │  try    │ │  ory   │ │• cust_ │ │  iption│ │• revenue│
│  email  │  │• website│ │• price │ │  email │ │• categ-│ │• expense│
│• cust_  │  │• streng-│ │• curre-│ │• cust_ │ │  ory   │ │• profit │
│  phone  │  │  ths    │ │  ncy   │ │  phone │ │• target│ │  (CALC) │
│• product│  │• weak-  │ │• descr-│ │• invoic│ │• budget│ │• sales_ │
│• purch- │  │  nesses │ │  iption│ │  e_num │ │• curre-│ │  count  │
│  ase_   │  │• pricing│ │• featu-│ │• invoic│ │  ncy   │ │• new_   │
│  date   │  │  _strat │ │  res[] │ │  e_date│ │• start_│ │  custom │
│• follow │  │• market │ │• target│ │• due_  │ │  date  │ │• satisf │
│  _up_   │  │  _share │ │  _mark │ │  date  │ │• end_  │ │• conver│
│  date   │  │• threat │ │• comp_ │ │• amount│ │  date  │ │  _rate  │
│• status │  │  _level │ │  _adv  │ │  _total│ │• status│ │• churn_ │
│• priori │  │• notes  │ │• status│ │• amount│ │• priori│ │  rate   │
│  ty     │  │• last_  │ │• tags[]│ │  _paid │ │  ty    │ │• curren │
│• notes  │  │  analyz │ │• create│ │• amount│ │• expect│ │  cy     │
│• satisf │  │  ed_    │ │  d_at  │ │  _rema │ │  ed_roi│ │• notes  │
│  _score │  │  date   │ │• update│ │  ining │ │• actual│ │• tags[] │
│• ai_    │  │• tags[] │ │  d_at  │ │  (CALC)│ │  _roi  │ │• create │
│  enabled│  │• create │ └────────┘ │• curre │ │• kpis[]│ │  d_at   │
│• last_  │  │  d_at   │            │  ncy   │ │• notes │ │• update │
│  contact│  │• update │            │• status│ │• tags[]│ │  d_at   │
│• next_  │  │  d_at   │            │• priori│ │• create│ └─────────┘
│  action │  └─────────┘            │  ty    │ │  d_at  │
│• tags[] │                         │• days_ │ │• update│
│• create │                         │  overdu│ │  d_at  │
│  d_at   │                         │  e     │ └────────┘
│• update │                         │  (CALC)│
│  d_at   │                         │• paym_ │
└─────────┘                         │  method│
                                    │• last_ │
                                    │  contac│
                                    │• next_ │
                                    │  follow│
                                    │• notes │
                                    │• ai_   │
                                    │  enable│
                                    │• tags[]│
                                    │• create│
                                    │  d_at  │
                                    │• update│
                                    │  d_at  │
                                    └────────┘
                                         │
                                         │
                                         ▼
                                  ┌──────────┐
                                  │ACTIVITIES│
                                  │ (Logs)   │
                                  ├──────────┤
                                  │• id (PK) │
                                  │• user_id │
                                  │  (FK)    │
                                  │• type    │
                                  │• action  │
                                  │• entity_ │
                                  │  type    │
                                  │• entity_ │
                                  │  id      │
                                  │• entity_ │
                                  │  name    │
                                  │• descr-  │
                                  │  iption  │
                                  │• metadata│
                                  │  (JSONB) │
                                  │• created │
                                  │  _at     │
                                  └──────────┘
```

---

## Relationships

### **One-to-Many (1:N)**
```
users ──┬──→ companies (one user owns many companies)
        ├──→ after_sales_records
        ├──→ competitors
        ├──→ my_products
        ├──→ debt_records
        ├──→ sales_strategies
        ├──→ kpi_records
        └──→ activities
```

### **Many-to-Many (M:N)**
```
admins ←──── team_memberships ────→ members
(users)                              (users)
```

### **Self-Referencing**
```
users ←──── invitations.admin_id
users ←──── invitations.used_by
```

---

## Table Categories

### **🔐 Authentication & Users**
- `users` - Core user profiles
- `companies` - Company branding
- `team_memberships` - Team structure
- `invitations` - Invitation system

### **📊 Business Data**
- `after_sales_records` - Customer follow-ups
- `competitors` - Competitive intelligence
- `my_products` - Product catalog
- `debt_records` - Payment tracking
- `sales_strategies` - Marketing campaigns
- `kpi_records` - Performance metrics

### **📝 System**
- `activities` - Audit log

---

## Key Constraints

### **Primary Keys (PK)**
- All tables use UUID primary keys
- Format: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`

### **Foreign Keys (FK)**
- All business tables reference `users(id)`
- Format: `user_id UUID REFERENCES users(id) ON DELETE CASCADE`
- Cascading delete ensures data cleanup

### **Unique Constraints**
- `users.email` - One email per user
- `invitations.code` - One-time use codes
- `kpi_records(user_id, date)` - One record per user per day

### **Check Constraints**
- `role IN ('admin', 'user')`
- `status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')`
- `priority IN ('Low', 'Medium', 'High', 'Urgent')`
- `satisfaction_score BETWEEN 1 AND 5`

---

## Indexes

### **Primary Indexes (Automatic)**
- All primary keys (11 indexes)

### **Foreign Key Indexes**
- All user_id columns (11 indexes)
- team_memberships (admin_id, member_id)
- invitations (admin_id, used_by)

### **Query Optimization Indexes**
- Status fields (5 indexes)
- Date fields (4 indexes)
- Email lookups (1 index)
- Custom indexes for common queries

**Total: 25+ indexes**

---

## Computed Fields

### **Auto-Calculated**
```sql
-- Debt Records
amount_remaining = amount_total - amount_paid
days_overdue = CURRENT_DATE - due_date (if overdue)

-- KPI Records
profit = revenue - expenses
```

### **Automatically Updated**
```sql
-- All tables with updated_at
updated_at = NOW() (on every UPDATE via trigger)
```

---

## Data Flow

### **User Signup**
```
1. Supabase auth.users created
2. Backend creates users record
3. Activities log created
```

### **Data Creation**
```
1. User creates record (e.g., after_sales_record)
2. Record inserted with user_id
3. Activity logged automatically
4. Timestamps set automatically
```

### **Admin Views Team Data**
```
1. Admin queries after_sales_records
2. RLS checks team_memberships
3. Returns admin's data + team members' data
```

---

## Views

### **overdue_debts**
```sql
SELECT * FROM debt_records
WHERE status NOT IN ('Paid', 'Written Off')
AND due_date < CURRENT_DATE
ORDER BY days_overdue DESC
```

### **upcoming_followups**
```sql
-- Combines after_sales and debt follow-ups
-- Sorted by date ascending
```

### **user_performance**
```sql
-- Aggregates stats from all tables
-- One row per user with counts and totals
```

---

## Security (RLS)

### **Policy Pattern**
```sql
-- SELECT: Users see own data + team data (if admin)
CREATE POLICY table_select ON table FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM team_memberships 
            WHERE admin_id = auth.uid() AND member_id = user_id
        )
    );

-- INSERT/UPDATE/DELETE: Users manage only their own data
CREATE POLICY table_manage ON table FOR ALL
    USING (user_id = auth.uid());
```

### **Applied To**
- ✅ All 11 tables
- ✅ All operations (SELECT, INSERT, UPDATE, DELETE)
- ✅ Enforced at database level (can't bypass)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| PK | Primary Key |
| FK | Foreign Key |
| UNIQUE | Unique constraint |
| CALC | Computed/Generated field |
| [] | Array type |
| JSONB | JSON document |
| → | One-to-Many relationship |
| ←→ | Many-to-Many relationship |

---

## Summary

- **11 core tables** organized by function
- **3 utility views** for common queries
- **25+ indexes** for performance
- **UUID primary keys** for scalability
- **Foreign keys** enforce integrity
- **Cascading deletes** maintain consistency
- **RLS policies** ensure security
- **Automatic timestamps** and computed fields
- **Well-documented** with comments

Your database structure is **clean, organized, and production-ready!** 🎉
