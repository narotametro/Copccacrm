# Components Directory

Organized component structure for COPCCA CRM.

## Directory Structure

### 📱 `/layout`
Core layout and navigation components used across the application.
- `Sidebar.tsx` - Main navigation sidebar
- `UserProfile.tsx` - User profile dropdown
- `UserSelector.tsx` - Admin user view selector
- `CompanyBranding.tsx` - Company branding display
- `NotificationCenter.tsx` - Notification bell and panel
- `PerformanceIndicator.tsx` - Performance metrics display
- `PerformanceMonitor.tsx` - System performance monitoring
- `SubscriptionGate.tsx` - Subscription access control
- `SubscriptionStatus.tsx` - Subscription status display
- `SyncIndicator.tsx` - Real-time sync indicator
- `DataModeBanner.tsx` - Data mode indicator banner
- `EmailSetupBanner.tsx` - Email setup prompt

### 🎯 `/modules`
Main business feature modules.
- `Home.tsx` - Dashboard overview
- `AfterSalesTracker.tsx` - Customer follow-up management
- `CompetitorIntelEnhanced.tsx` - Competitor intelligence tracking
- `DebtCollection.tsx` - Debt management system
- `DebtCollectionRow.tsx` - Individual debt row component
- `KPITracking.tsx` - Key performance indicators
- `SalesStrategies.tsx` - Sales and marketing strategies
- `TaskManagement.tsx` - Task tracking system
- `AIAssistant.tsx` - AI-powered assistant

### 🔧 `/modals`
Modal dialogs and popups.
- `AIAgentsModal.tsx` - AI agents configuration
- `AutomateDebtCollectionModal.tsx` - Debt automation settings
- `DebtAIAgentsModal.tsx` - Debt collection AI agents
- `DebtEditModal.tsx` - Debt entry editor
- `DebtScheduleModal.tsx` - Debt payment scheduling
- `ScheduleFollowUpModal.tsx` - Follow-up scheduling
- `SubscriptionModal.tsx` - Subscription management
- `InviteMember.tsx` - Team member invitation

### 📊 `/reports`
Reporting and analytics components.
- `Reports.tsx` - Main reports page
- `AnalyticalReports.tsx` - Advanced analytics
- `DailyReport.tsx` - Daily performance report
- `EnhancedDailyReport.tsx` - Enhanced daily report with AI
- `AIInsightReport.tsx` - AI-generated insights
- `ProfessionalAnalyticalReport.tsx` - Professional report templates
- `ReportComparison.tsx` - Report comparison tools
- `ReportQuickActions.tsx` - Quick report actions
- `ReportStats.tsx` - Report statistics
- `PerformanceDataForm.tsx` - Performance data entry

### ⚙️ `/settings`
Configuration and administration components.
- `Integrations.tsx` - Third-party integrations
- `CompanySettings.tsx` - Company configuration
- `UserManagement.tsx` - Team member management
- `AdminManagementDashboard.tsx` - Admin dashboard
- `CountrySelector.tsx` - Country/region selector

### 🔄 `/shared`
Reusable shared components.
- `AnimatedButton.tsx` - Animated button component
- `CurrencyInput.tsx` - Currency input with formatting
- `EmptyState.tsx` - Empty state placeholder
- `PageHeader.tsx` - Consistent page headers
- `SearchInput.tsx` - Search input component
- `SkeletonLoader.tsx` - Loading skeletons
- `StatCard.tsx` - Statistic card component
- `UserViewBanner.tsx` - User view notification banner

### 🎨 `/ui`
Base UI components from Radix UI library (buttons, inputs, dialogs, etc.)

### 🔐 Root Components
- `LandingPage.tsx` - Public landing page
- `Login.tsx` - Authentication page
- `PasswordReset.tsx` - Password reset flow
- `ErrorBoundary.tsx` - Error boundary wrapper
- `DebugPanel.tsx` - Debug information panel

## Usage

Import components using barrel exports:

```typescript
// Import from main index
import { Sidebar, UserProfile } from '@/components';

// Import from specific modules
import { Home, AfterSalesTracker } from '@/components/modules';
import { DebtEditModal } from '@/components/modals';
import { AnalyticalReports } from '@/components/reports';
```

## Best Practices

1. Keep components focused and single-purpose
2. Use TypeScript for type safety
3. Implement proper error boundaries
4. Memoize expensive components with React.memo
5. Use lazy loading for heavy components
6. Follow consistent naming conventions (PascalCase)
