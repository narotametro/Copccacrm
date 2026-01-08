# 🤝 Contributing to COPCCA CRM

Thank you for your interest in contributing to COPCCA CRM! This guide will help you get started.

## 📋 Table of Contents
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Common Tasks](#common-tasks)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)
- Supabase account

### Setup Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/copcca-crm.git
   cd copcca-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔄 Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature

```bash
# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Commit your work
git add .
git commit -m "feat: add new feature description"

# Push to remote
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new customer filtering
fix: resolve login redirect issue
docs: update README installation steps
style: format code with prettier
refactor: simplify authentication logic
test: add unit tests for Dashboard
chore: update dependencies
```

## 📝 Code Standards

### TypeScript
- Always use TypeScript
- Enable strict mode
- Define proper types (avoid `any`)
- Use interfaces for objects
- Export types separately

**Example:**
```typescript
interface Customer {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

export const getCustomers = async (): Promise<Customer[]> => {
  // implementation
};
```

### React Components
- Use functional components with hooks
- Props should have TypeScript interfaces
- Use meaningful component names
- Extract reusable logic to custom hooks

**Example:**
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary' 
}) => {
  return (
    <button 
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
};
```

### Styling
- Use Tailwind CSS utility classes
- Follow existing design system
- Use custom classes sparingly
- Keep responsive design in mind

**Example:**
```tsx
<div className="glass rounded-xl p-6 hover:shadow-lg transition-shadow">
  <h2 className="text-2xl font-bold text-slate-900">Title</h2>
  <p className="text-slate-600 mt-2">Description</p>
</div>
```

### File Organization
```
src/
├── components/
│   ├── ui/          # Reusable UI components
│   ├── layout/      # Layout components
│   └── auth/        # Authentication components
├── pages/           # Page components
├── lib/            # Utilities and helpers
├── store/          # State management
└── hooks/          # Custom React hooks
```

### Naming Conventions
- **Components:** PascalCase (`UserProfile.tsx`)
- **Utilities:** camelCase (`formatDate.ts`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Hooks:** camelCase with "use" prefix (`useAuth.ts`)
- **Types/Interfaces:** PascalCase (`UserProfile`)

## 🔍 Code Review Checklist

Before submitting a PR, ensure:

- [ ] Code follows TypeScript/React best practices
- [ ] No console.logs or debugging code
- [ ] Components are properly typed
- [ ] Responsive design works on mobile
- [ ] No ESLint errors or warnings
- [ ] Code is formatted (run `npm run lint`)
- [ ] New features have error handling
- [ ] Loading states are implemented
- [ ] Empty states are handled
- [ ] Real-time updates work (if applicable)
- [ ] Comments explain complex logic
- [ ] No hardcoded values (use constants)

## 📤 Pull Request Process

### Before Creating PR

1. **Update from main**
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git merge main
   ```

2. **Run linter**
   ```bash
   npm run lint
   ```

3. **Build successfully**
   ```bash
   npm run build
   ```

4. **Test locally**
   - Test your changes
   - Check console for errors
   - Verify responsive design

### Creating the PR

1. **Write a clear title**
   ```
   feat: Add customer export to CSV functionality
   ```

2. **Provide description**
   ```markdown
   ## Changes
   - Added CSV export button to Customer page
   - Implemented export logic using papaparse
   - Added loading state during export
   
   ## Testing
   - Tested with 100+ customers
   - Verified CSV format
   - Checked error handling
   
   ## Screenshots
   [Add screenshots if UI changes]
   ```

3. **Link related issues**
   ```
   Closes #123
   ```

### PR Review Process

1. Automated checks must pass
2. At least one approval required
3. Address review comments
4. Merge when approved

## 🏗️ Project Structure

### Key Directories

```
COPCCA-CRM/
├── src/
│   ├── components/       # Reusable components
│   │   ├── ui/          # UI components (Button, Input, etc.)
│   │   ├── layout/      # Layout components (Sidebar, Header)
│   │   └── auth/        # Auth components (ProtectedRoute)
│   ├── pages/           # Page components (one per route)
│   ├── lib/             # Utilities and configurations
│   │   ├── supabase.ts  # Supabase client
│   │   └── types/       # Type definitions
│   ├── store/           # Zustand stores
│   └── hooks/           # Custom React hooks
├── public/              # Static assets
└── docs/               # Documentation
```

### Adding a New Module

1. **Create page component**
   ```typescript
   // src/pages/NewModule.tsx
   export const NewModule: React.FC = () => {
     return <div>New Module</div>;
   };
   ```

2. **Add route**
   ```typescript
   // src/App.tsx
   <Route path="new-module" element={<NewModule />} />
   ```

3. **Add navigation**
   ```typescript
   // src/components/layout/AppLayout.tsx
   { icon: Icon, label: 'New Module', path: '/new-module' }
   ```

4. **Create types if needed**
   ```typescript
   // src/lib/types/database.ts
   // Add to Database interface
   ```

## 🛠️ Common Tasks

### Adding a New UI Component

```typescript
// src/components/ui/NewComponent.tsx
import React from 'react';

interface NewComponentProps {
  title: string;
  children: React.ReactNode;
}

export const NewComponent: React.FC<NewComponentProps> = ({ 
  title, 
  children 
}) => {
  return (
    <div className="card">
      <h3>{title}</h3>
      {children}
    </div>
  );
};
```

### Adding a New Database Table

1. **Update database schema**
   ```sql
   -- Add to database-setup.sql
   CREATE TABLE new_table (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Update TypeScript types**
   ```typescript
   // src/lib/types/database.ts
   new_table: {
     Row: {
       id: string;
       name: string;
       created_at: string;
     }
     // ... Insert and Update types
   }
   ```

3. **Add RLS policies**
   ```sql
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "policy_name" ON new_table FOR ALL 
   USING (auth.role() = 'authenticated');
   ```

### Adding Real-time Subscription

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('table_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'your_table' },
      (payload) => {
        // Handle real-time update
        loadData();
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## 🐛 Reporting Bugs

### Before Reporting
- Search existing issues
- Verify bug in latest version
- Check if it's a configuration issue

### Bug Report Template
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Browser: [e.g. Chrome 120]
- OS: [e.g. Windows 11]
- Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

## 💡 Feature Requests

### Before Requesting
- Check if feature already exists
- Search existing feature requests
- Consider if it fits project scope

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution**
What you want to happen.

**Describe alternatives**
Other solutions you've considered.

**Additional context**
Mockups, examples, or additional information.
```

## 📚 Resources

### Documentation
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev)

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Tailwind CSS Intellisense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## ❓ Questions?

- Check existing documentation
- Search closed issues
- Ask in discussions
- Contact maintainers

## 🙏 Thank You!

Your contributions make COPCCA CRM better for everyone!

---

**Happy Coding! 💻**
