import { useAfterSalesData } from './use-aftersales-data';
import { useKPIData } from './use-kpi-data';
import { useCompetitorsData } from './use-competitors-data';
import { useSalesData } from './use-sales-data';
import { useDebtData } from './use-debt-data';
import { useTasksData } from './use-tasks-data';

export function useTeamData() {
  const { data: afterSalesData, loading: loadingAS, error: errorAS } = useAfterSalesData();
  const { data: kpiData, loading: loadingKPI, error: errorKPI } = useKPIData();
  const { data: competitorsData, loading: loadingComp, error: errorComp } = useCompetitorsData();
  const { data: salesData, loading: loadingSales, error: errorSales } = useSalesData();
  const { data: debtData, loading: loadingDebt, error: errorDebt } = useDebtData();
  const { data: tasksData, loading: loadingTasks, error: errorTasks } = useTasksData();

  const loading = loadingAS || loadingKPI || loadingComp || loadingSales || loadingDebt || loadingTasks;
  const error = errorAS || errorKPI || errorComp || errorSales || errorDebt || errorTasks;

  return {
    afterSalesData,
    kpiData,
    competitorsData,
    salesData,
    debtData,
    tasksData,
    loading,
    error
  };
}
