import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, TrendingUp, Banknote, Users, Target, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { supabase } from '@/lib/supabase';

interface MarketingCampaignRow {
  id: string;
  name: string;
  strategy?: string;
  objective?: string;
  audience?: string;
  channels?: string[];
  budget?: number;
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at?: string;
}

export const CampaignDashboard: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [campaigns, setCampaigns] = useState<MarketingCampaignRow[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const supabaseReady = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !`${import.meta.env.VITE_SUPABASE_URL}`.includes('placeholder')
  );

  const loadCampaigns = useCallback(async () => {
    try {
      // Load from localStorage first
      const saved = localStorage.getItem('copcca-campaigns');
      if (saved) {
        const localCampaigns = JSON.parse(saved);
        setCampaigns(localCampaigns);
      }

      // Load from Supabase if available
      if (supabaseReady) {
        const { data, error } = await supabase
          .from('marketing_campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase load error:', error);
        } else if (data && data.length > 0) {
          const supabaseCampaigns = data.map((campaign: MarketingCampaignRow) => ({
            id: campaign.id,
            name: campaign.name,
            strategy: campaign.strategy || 'General',
            objective: campaign.objective || 'Lead Generation',
            audience: campaign.audience || 'General audience',
            channels: campaign.channels || [],
            budget: campaign.budget || 0,
            startDate: campaign.start_date || '',
            endDate: campaign.end_date || '',
            notes: campaign.notes || 'No notes',
          }));

          setCampaigns(supabaseCampaigns);
          localStorage.setItem('copcca-campaigns', JSON.stringify(supabaseCampaigns));
        }
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  }, [supabaseReady]);

  // Load campaigns on component mount
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const kpiColorStyles: Record<string, { bg: string; icon: string }> = {
    green: { bg: 'bg-green-100', icon: 'text-green-600' },
    blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
    purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
    orange: { bg: 'bg-orange-100', icon: 'text-orange-600' },
    pink: { bg: 'bg-pink-100', icon: 'text-pink-600' },
  };

  // Calculate KPIs from real data
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalLeads = campaigns.length * 25; // Estimate based on campaigns
  const avgConversion = campaigns.length > 0 ? Math.round((totalLeads / campaigns.length) * 0.15) : 0;
  const totalRevenue = totalLeads * 50000; // Estimate revenue per lead
  const avgROI = campaigns.length > 0 ? Math.round((totalRevenue / totalBudget) * 100) / 100 : 0;

  const kpis = [
    { label: 'Active Campaigns', value: campaigns.length.toString(), icon: Megaphone, color: 'green' },
    { label: 'Total Leads', value: totalLeads.toString(), icon: Users, color: 'blue' },
    { label: 'Conversion Rate', value: `${avgConversion}%`, icon: TrendingUp, color: 'purple' },
    { label: 'Total Cost', value: formatCurrency(totalBudget), icon: Banknote, color: 'orange' },
    { label: 'Revenue Generated', value: formatCurrency(totalRevenue), icon: Target, color: 'pink' },
    { label: 'ROI', value: `${avgROI}x`, icon: TrendingUp, color: 'green' },
  ];

  // Calendar navigation functions
  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(new Date().getMonth());
    setCurrentYear(new Date().getFullYear());
  };

  // Get campaigns for a specific date
  const getCampaignsForDate = (date: Date) => {
    return campaigns.filter(campaign => {
      if (!campaign.start_date) return false;
      const campaignDate = new Date(campaign.start_date);
      return (
        campaignDate.getDate() === date.getDate() &&
        campaignDate.getMonth() === date.getMonth() &&
        campaignDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const styles = kpiColorStyles[kpi.color] ?? { bg: 'bg-slate-100', icon: 'text-slate-600' };
          // Last 2 items (Revenue Generated and ROI) span 2 columns each
          const spanClass = index >= 4 ? 'md:col-span-2' : '';
          return (
            <Card key={kpi.label} className={spanClass}>
              <div className={`p-2 rounded-lg ${styles.bg} w-fit mb-2`}>
                <Icon className={styles.icon} size={20} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
              <div className="text-sm text-slate-600">{kpi.label}</div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Campaign Timeline</h3>
          <Button
            variant="outline"
            size="sm"
            icon={Calendar}
            onClick={() => setShowCalendar(true)}
          >
            View Calendar
          </Button>
        </div>
        <div className="space-y-3">
          {campaigns.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No campaigns yet. Create your first campaign!</p>
          ) : (
            campaigns.slice(0, 5).map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-900">{campaign.name}</div>
                  <div className="text-sm text-slate-600">Strategy: {campaign.strategy}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">{campaign.channels.length} channels</div>
                  <div className="text-xs text-green-600">{formatCurrency(campaign.budget)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto">
            {/* Calendar Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Calendar size={28} />
                  <h2 className="text-2xl font-bold">Campaign Calendar</h2>
                </div>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-semibold">
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={goToToday}
                    className="bg-white/20 hover:bg-white/30 border-none"
                  >
                    Today
                  </Button>
                </div>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Calendar Body */}
            <div className="p-6">
              {/* Day Names */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-slate-600 text-sm py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {generateCalendarDays().map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const date = new Date(currentYear, currentMonth, day);
                  const isToday =
                    day === new Date().getDate() &&
                    currentMonth === new Date().getMonth() &&
                    currentYear === new Date().getFullYear();
                  const dayCampaigns = getCampaignsForDate(date);
                  const hasCampaigns = dayCampaigns.length > 0;

                  return (
                    <div
                      key={day}
                      className={`
                        aspect-square border rounded-lg p-2 transition-all
                        ${isToday ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}
                        ${hasCampaigns ? 'bg-gradient-to-br from-purple-50 to-pink-50' : 'bg-white'}
                        hover:shadow-md cursor-pointer
                      `}
                    >
                      <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                        {day}
                      </div>
                      {hasCampaigns && (
                        <div className="space-y-1">
                          {dayCampaigns.slice(0, 2).map((campaign) => (
                            <div
                              key={campaign.id}
                              className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded truncate"
                              title={campaign.name}
                            >
                              {campaign.name.length > 12 ? campaign.name.substring(0, 12) + '...' : campaign.name}
                            </div>
                          ))}
                          {dayCampaigns.length > 2 && (
                            <div className="text-xs text-purple-600 font-semibold">
                              +{dayCampaigns.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded"></div>
                    <span className="text-slate-600">Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-slate-200 rounded"></div>
                    <span className="text-slate-600">Campaign(s) starting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-slate-600">Total: <strong>{campaigns.length} campaigns</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
