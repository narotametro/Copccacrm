# COPCCA CRM

A modern, production-ready Customer Relationship Management system built with React, TypeScript, and Supabase.

## 🚀 Features

### Core Capabilities
- **Multi-tenant Architecture** - Secure, scalable data isolation
- **Role-based Access Control** - Admin, Manager, and User roles
- **Real-time Data Sync** - Live updates across all users
- **Progressive Web App** - Install as native app on any device
- **AI Assistant** - Floating AI helper available on all pages

### Modules

1. **Dashboard** - Central command center with KPI widgets, AI insights, and priority tasks
2. **Customer 360°** - Complete customer profiles with health scores and interaction history
3. **Sales Pipeline** - Visual Kanban board with drag-and-drop deal management
4. **After Sales Tracker** - Order follow-ups and satisfaction monitoring
5. **Debt Collection** - Automated payment tracking and reminder system
6. **Competitor Intelligence** - Market analysis and competitive insights
7. **Sales & Marketing Strategies** - Campaign management and ROI tracking
8. **KPI Tracking** - Real-time performance metrics and targets
9. **Analytical Reports** - Advanced reporting with data visualization
10. **User Management** - Team collaboration and permissions

## 🛠️ Tech Stack

- **Frontend**: React 18.3.1, TypeScript, Vite 6.3.5
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **State Management**: Zustand
- **UI Components**: Custom component library
- **Icons**: Lucide React
- **Notifications**: Sonner
- **PWA**: Vite PWA Plugin

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project

### Setup

1. **Clone the repository**
   ```bash
   cd COPCCA-CRM
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**

   Run these SQL commands in your Supabase SQL editor:

   ```sql
   -- Enable UUID extension
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- Create tables
   CREATE TABLE users (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     email TEXT UNIQUE NOT NULL,
     full_name TEXT NOT NULL,
     role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
     avatar_url TEXT,
     phone TEXT,
     department TEXT,
     status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE companies (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     industry TEXT,
     size TEXT,
     website TEXT,
     phone TEXT,
     email TEXT,
     address TEXT,
     status TEXT DEFAULT 'prospect' CHECK (status IN ('active', 'inactive', 'prospect')),
     health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     created_by UUID REFERENCES users(id)
   );

   CREATE TABLE deals (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     value DECIMAL NOT NULL,
     stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
     probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
     expected_close_date DATE,
     assigned_to UUID REFERENCES users(id),
     notes TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE after_sales (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
     order_id TEXT NOT NULL,
     product TEXT NOT NULL,
     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'issue')),
     follow_up_date DATE,
     satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
     notes TEXT,
     assigned_to UUID REFERENCES users(id),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE debt_collection (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
     invoice_number TEXT NOT NULL,
     amount DECIMAL NOT NULL,
     due_date DATE NOT NULL,
     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reminded', 'overdue', 'paid', 'written_off')),
     days_overdue INTEGER DEFAULT 0,
     last_reminder_date DATE,
     notes TEXT,
     assigned_to UUID REFERENCES users(id),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE competitors (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     industry TEXT NOT NULL,
     strengths TEXT,
     weaknesses TEXT,
     market_share DECIMAL,
     pricing_strategy TEXT,
     target_customers TEXT,
     notes TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE sales_strategies (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     type TEXT CHECK (type IN ('campaign', 'promotion', 'outreach', 'event')),
     status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
     budget DECIMAL,
     target_audience TEXT,
     start_date DATE NOT NULL,
     end_date DATE,
     roi DECIMAL,
     notes TEXT,
     created_by UUID REFERENCES users(id),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE kpi_data (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     metric_name TEXT NOT NULL,
     value DECIMAL NOT NULL,
     target DECIMAL,
     period TEXT NOT NULL,
     category TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE interactions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
     type TEXT CHECK (type IN ('call', 'email', 'meeting', 'note')),
     subject TEXT NOT NULL,
     description TEXT,
     user_id UUID REFERENCES users(id),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
   ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
   ALTER TABLE after_sales ENABLE ROW LEVEL SECURITY;
   ALTER TABLE debt_collection ENABLE ROW LEVEL SECURITY;
   ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
   ALTER TABLE sales_strategies ENABLE ROW LEVEL SECURITY;
   ALTER TABLE kpi_data ENABLE ROW LEVEL SECURITY;
   ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

   -- Create policies (allow authenticated users)
   CREATE POLICY "Allow authenticated users" ON users FOR ALL USING (auth.uid() = id);
   CREATE POLICY "Allow authenticated users" ON companies FOR ALL USING (auth.role() = 'authenticated');
   CREATE POLICY "Allow authenticated users" ON deals FOR ALL USING (auth.role() = 'authenticated');
   CREATE POLICY "Allow authenticated users" ON after_sales FOR ALL USING (auth.role() = 'authenticated');
   CREATE POLICY "Allow authenticated users" ON debt_collection FOR ALL USING (auth.role() = 'authenticated');
   CREATE POLICY "Allow authenticated users" ON competitors FOR ALL USING (auth.role() = 'authenticated');
   CREATE POLICY "Allow authenticated users" ON sales_strategies FOR ALL USING (auth.role() = 'authenticated');
   CREATE POLICY "Allow authenticated users" ON kpi_data FOR ALL USING (auth.role() = 'authenticated');
   CREATE POLICY "Allow authenticated users" ON interactions FOR ALL USING (auth.role() = 'authenticated');
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173)

## 🏗️ Build for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
COPCCA-CRM/
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── layout/        # Layout components (sidebar, header, AI assistant)
│   │   └── ui/            # Reusable UI components
│   ├── lib/
│   │   ├── supabase.ts    # Supabase client
│   │   └── types/         # TypeScript type definitions
│   ├── pages/             # Page components for each module
│   ├── store/             # Zustand state management
│   ├── App.tsx            # Main app with routing
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

## 🎨 Design System

### Colors
- **Primary**: Indigo/Blue gradient (`#4f46e5` to `#6366f1`)
- **Secondary**: Purple gradient
- **Success**: Green
- **Warning**: Orange
- **Danger**: Red

### Components
- Glassmorphism effects on cards
- Gradient buttons and accents
- Smooth animations and transitions
- Responsive grid layouts
- Professional iconography

## 🔐 Authentication & Security

- JWT-based authentication via Supabase
- Row Level Security (RLS) policies
- Role-based access control (RBAC)
- Secure password reset flow
- Session management with auto-refresh

## 📱 PWA Features

- Offline capability
- Install prompt
- Service worker caching
- Native app-like experience
- Push notifications ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software for COPCCA.

## 🆘 Support

For support, email support@copcca.com or open an issue in the repository.

## 🙏 Acknowledgments

- React Team for the amazing framework
- Supabase for the backend infrastructure
- Tailwind CSS for the utility-first CSS framework
- Lucide for the beautiful icons

---

**Built with ❤️ for COPCCA**
