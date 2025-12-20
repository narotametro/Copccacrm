import { ProfessionalAnalyticalReport } from './ProfessionalAnalyticalReport';

interface EnhancedDailyReportProps {
  afterSalesData: any[];
  kpiData: any[];
  competitorsData: any[];
  salesData: any[];
  debtData: any[];
  tasksData: any[];
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function EnhancedDailyReport(props: EnhancedDailyReportProps) {
  // Ensure all props are arrays with defaults
  const safeProps = {
    afterSalesData: Array.isArray(props.afterSalesData) ? props.afterSalesData : [],
    kpiData: Array.isArray(props.kpiData) ? props.kpiData : [],
    competitorsData: Array.isArray(props.competitorsData) ? props.competitorsData : [],
    salesData: Array.isArray(props.salesData) ? props.salesData : [],
    debtData: Array.isArray(props.debtData) ? props.debtData : [],
    tasksData: Array.isArray(props.tasksData) ? props.tasksData : [],
    isRefreshing: props.isRefreshing || false,
    onRefresh: props.onRefresh,
  };

  // Directly render the Professional Analytical Report
  return (
    <ProfessionalAnalyticalReport
      afterSalesData={safeProps.afterSalesData}
      kpiData={safeProps.kpiData}
      competitorsData={safeProps.competitorsData}
      salesData={safeProps.salesData}
      marketingData={[]}
      debtData={safeProps.debtData}
      tasksData={safeProps.tasksData}
    />
  );
}
