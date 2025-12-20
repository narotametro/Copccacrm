import { useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import * as api from './api';
import type { Report, CreateReportInput } from './types';

export function useReports() {
  const { user, accessToken } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await api.getReports(accessToken);
      setReports(data);
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      setError(err.message || 'Failed to load reports');
      setReports([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && user) {
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user ID, not the whole accessToken

  const createReport = async (input: CreateReportInput): Promise<Report | null> => {
    if (!accessToken) return null;

    try {
      const newReport = await api.createReport(accessToken, input);
      await fetchReports();
      return newReport;
    } catch (err: any) {
      console.error('Failed to create report:', err);
      setError(err.message || 'Failed to create report');
      return null;
    }
  };

  const updateReport = async (id: string, updates: Partial<Report>): Promise<Report | null> => {
    if (!accessToken) return null;

    try {
      const updated = await api.updateReport(accessToken, id, updates);
      await fetchReports();
      return updated;
    } catch (err: any) {
      console.error('Failed to update report:', err);
      setError(err.message || 'Failed to update report');
      return null;
    }
  };

  const deleteReport = async (id: string): Promise<boolean> => {
    if (!accessToken) return false;

    try {
      await api.deleteReport(accessToken, id);
      await fetchReports();
      return true;
    } catch (err: any) {
      console.error('Failed to delete report:', err);
      setError(err.message || 'Failed to delete report');
      return false;
    }
  };

  return {
    reports,
    loading,
    error,
    createReport,
    updateReport,
    deleteReport,
    refetch: fetchReports,
  };
}
