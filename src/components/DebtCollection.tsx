import { useState, memo, useMemo } from 'react';
import { Search, DollarSign, Calendar, Clock, AlertCircle, CheckCircle, XCircle, Phone, MessageSquare, Mail, Plus, Edit2, Trash2, Filter, Bell, TrendingUp, AlertTriangle } from 'lucide-react';
import { useDebtCollection } from '../lib/use-data';
import { useCurrency } from '../lib/currency-context';
import { toast } from 'sonner@2.0.3';
import { SkeletonLoader } from './shared/SkeletonLoader';
import { DataModeBanner } from './DataModeBanner';
import { PageHeader } from './shared/PageHeader';
import { StatCard } from './shared/StatCard';
import { SearchInput } from './shared/SearchInput';
import { DebtCollectionRow } from './DebtCollectionRow';
import { DebtEditModal } from './DebtEditModal';
import { DebtScheduleModal } from './DebtScheduleModal';
import { useDebtReminders } from '../lib/useDebtReminders';
import { formatNumberWithCommas } from '../lib/utils';

export const DebtCollection = memo(function DebtCollection() {
  const { records: debtRecords, loading, update, remove } = useDebtCollection();
  const { currencySymbol } = useCurrency();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [schedulingRecord, setSchedulingRecord] = useState<any>(null);

  // Enable reminder notifications
  const { upcomingReminders, overdueReminders } = useDebtReminders(debtRecords);

  const totalOutstanding = debtRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  const pendingCount = debtRecords.filter(r => r.status !== 'Paid' && r.status !== 'Resolved').length;
  const avgDaysOverdue = debtRecords.length > 0
    ? Math.round(debtRecords.reduce((sum, r) => sum + (r.daysOverdue || 0), 0) / debtRecords.length)
    : 0;
  const criticalCount = debtRecords.filter(r => r.priority === 'critical').length;

  const stats = [
    {
      label: 'Total Outstanding',
      value: currencySymbol + formatNumberWithCommas(totalOutstanding),
      change: pendingCount + ' accounts',
      icon: DollarSign,
      color: 'bg-red-500',
    },
    {
      label: 'Avg Days Overdue',
      value: avgDaysOverdue.toString(),
      change: 'days average',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
    {
      label: 'Critical Cases',
      value: criticalCount.toString(),
      change: 'require attention',
      icon: AlertTriangle,
      color: 'bg-yellow-500',
    },
  ];

  const filteredRecords = useMemo(() => {
    return debtRecords.filter(record => {
      const matchesSearch = !searchQuery || 
        record.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [debtRecords, searchQuery, filterStatus]);

  const handleEdit = (record: any) => {
    setEditingRecord(record);
  };

  const handleSaveEdit = async (updates: any) => {
    try {
      await update(editingRecord.id, updates);
      setEditingRecord(null);
      toast.success('Payment record updated successfully');
    } catch (error) {
      toast.error('Failed to update record');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment record?')) {
      return;
    }
    
    try {
      console.log('🗑️ Deleting debt record:', id);
      await remove(id);
      toast.success('Payment record deleted successfully');
    } catch (error: any) {
      console.error('❌ Failed to delete debt record:', error);
      toast.error(error.message || 'Failed to delete record');
    }
  };

  const handleSchedule = (record: any) => {
    setSchedulingRecord(record);
  };

  const handleSaveSchedule = async (scheduleData: any) => {
    try {
      await update(schedulingRecord.id, scheduleData);
      setSchedulingRecord(null);
      toast.success('Follow-up scheduled successfully! You will receive a reminder notification.');
    } catch (error) {
      toast.error('Failed to schedule follow-up');
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  const totalReminders = upcomingReminders.length + overdueReminders.length;

  return (
    <div className="p-6">
      <DataModeBanner />

      {totalReminders > 0 && (
        <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold">Follow-up Reminders Active</h3>
                <p className="text-sm text-blue-100">
                  {overdueReminders.length > 0 && `${overdueReminders.length} overdue`}
                  {overdueReminders.length > 0 && upcomingReminders.length > 0 && ' • '}
                  {upcomingReminders.length > 0 && `${upcomingReminders.length} upcoming`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Debt Collection"
        subtitle="Manage and track outstanding payments"
        action={{
          label: 'Add Payment Record',
          onClick: () => toast.info('Add functionality - coming soon'),
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {stats.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by customer or invoice..."
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Overdue">Overdue</option>
              <option value="Paid">Paid</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <DebtCollectionRow
                  key={record.id}
                  record={record}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSchedule={handleSchedule}
                />
              ))}
            </tbody>
          </table>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payment records</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new payment record.</p>
            </div>
          )}
        </div>
      </div>

      {editingRecord && (
        <DebtEditModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={handleSaveEdit}
        />
      )}

      {schedulingRecord && (
        <DebtScheduleModal
          record={schedulingRecord}
          onClose={() => setSchedulingRecord(null)}
          onSchedule={handleSaveSchedule}
        />
      )}
    </div>
  );
});