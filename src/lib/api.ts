import { projectId, publicAnonKey } from '../utils/supabase/info';
import { requestCache } from './request-cache';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-a2294ced`;

// Token management
const getAuthToken = (): string | null => sessionStorage.getItem('access_token');
export const setAuthToken = (token: string) => sessionStorage.setItem('access_token', token);
export const clearAuthToken = () => sessionStorage.removeItem('access_token');

// Get auth headers for manual fetch requests
export const getAuthHeaders = async (): Promise<HeadersInit> => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || publicAnonKey}`,
  };
};

// Generic fetch wrapper with better error handling and caching
async function apiFetch(endpoint: string, options: RequestInit = {}, useAuth = true, cacheOptions?: { ttl?: number; skipCache?: boolean }): Promise<any> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${useAuth && token ? token : publicAnonKey}`,
    ...options.headers,
  };

  // Include the full URL with query params in the cache key for proper isolation
  const cacheKey = `${options.method || 'GET'}:${endpoint}`;
  
  // Only cache GET requests by default
  const shouldCache = !options.method || options.method === 'GET';
  const skipCache = cacheOptions?.skipCache || !shouldCache;

  const fetcher = async () => {
    try {
      // Extract query params for better logging
      const [path, query] = endpoint.split('?');
      const params = query ? Object.fromEntries(new URLSearchParams(query)) : {};
      
      console.log(`🌐 API Request: ${options.method || 'GET'} ${path}`, {
        params,
        hasToken: !!token,
        cacheKey,
        fromCache: false
      });
      
      const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

      console.log(`📥 API Response: ${options.method || 'GET'} ${path}`, {
        params,
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error(`❌ API Error Response [${endpoint}]:`, errorData);
        throw new Error(errorData.error || `Request failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API Success [${endpoint}]:`, data);
      return data;
    } catch (error: any) {
      console.error(`❌ API Error [${endpoint}]:`, error.message);
      throw error;
    }
  };

  // Use cache for GET requests
  if (shouldCache) {
    return requestCache.fetch(cacheKey, fetcher, { ttl: cacheOptions?.ttl, skipCache });
  }
  
  // For mutations, invalidate related cache and execute directly
  const result = await fetcher();
  
  // Invalidate cache for the resource
  const resourceMatch = endpoint.match(/^\/([^/?]+)/);
  if (resourceMatch) {
    requestCache.invalidate(new RegExp(`^GET:/${resourceMatch[1]}`));
  }
  
  return result;
}

// Helper to build query params
const buildQuery = (params: Record<string, any>) => {
  const query = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return query ? `?${query}` : '';
};

// ============= AUTH API =============
export const authAPI = {
  signup: (name: string, phoneOrEmail: string, password: string, role: 'admin' | 'user' = 'user', inviteCode?: string) =>
    apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ name, phoneOrEmail, password, role, inviteCode }) }, false),
  
  getProfile: () => apiFetch('/auth/profile'),
  
  requestPasswordReset: (phoneOrEmail: string) =>
    apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ phoneOrEmail }) }, false),
  
  resetPassword: (token: string, newPassword: string) =>
    apiFetch('/auth/reset-password/confirm', { method: 'POST', body: JSON.stringify({ token, newPassword }) }, false),
};

// ============= USER API =============
export const userAPI = {
  getAll: () => apiFetch('/users'),
  
  getTeamMembers: () => apiFetch('/users'),
  
  add: (name: string, phone: string, password: string, role: string) =>
    apiFetch('/users', { method: 'POST', body: JSON.stringify({ name, phone, password, role }) }),
  
  delete: (userId: string) =>
    apiFetch(`/users/${userId}`, { method: 'DELETE' }),
};

// ============= AFTER SALES API =============
export const afterSalesAPI = {
  getAll: (userId?: string, all?: boolean) =>
    apiFetch(`/aftersales${buildQuery({ userId, all })}`),
  
  create: (data: any) =>
    apiFetch('/aftersales', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (id: string, data: any, userId?: string) =>
    apiFetch(`/aftersales/${id}${buildQuery({ userId })}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  delete: (id: string, userId?: string) =>
    apiFetch(`/aftersales/${id}${buildQuery({ userId })}`, { method: 'DELETE' }),
};

// ============= COMPETITORS API =============
export const competitorsAPI = {
  getAll: (userId?: string, all?: boolean) =>
    apiFetch(`/competitor${buildQuery({ userId, all })}`),
  
  create: (data: any) =>
    apiFetch('/competitor', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (id: string, data: any, userId?: string) =>
    apiFetch(`/competitor/${id}${buildQuery({ userId })}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  delete: (id: string, userId?: string) =>
    apiFetch(`/competitor/${id}${buildQuery({ userId })}`, { method: 'DELETE' }),
};

// ============= MY PRODUCTS API =============
export const myProductsAPI = {
  getAll: (userId?: string, all?: boolean) =>
    apiFetch(`/myproducts${buildQuery({ userId, all })}`),
  
  create: (data: any) =>
    apiFetch('/myproducts', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (id: string, data: any, userId?: string) =>
    apiFetch(`/myproducts/${id}${buildQuery({ userId })}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  delete: (id: string, userId?: string) =>
    apiFetch(`/myproducts/${id}${buildQuery({ userId })}`, { method: 'DELETE' }),
};

// ============= DEBT COLLECTION API =============
export const debtAPI = {
  getAll: (userId?: string, all?: boolean) =>
    apiFetch(`/debt${buildQuery({ userId, all })}`),
  
  create: (data: any) =>
    apiFetch('/debt', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (id: string, data: any, userId?: string) =>
    apiFetch(`/debt/${id}${buildQuery({ userId })}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  delete: (id: string, userId?: string) =>
    apiFetch(`/debt/${id}${buildQuery({ userId })}`, { method: 'DELETE' }),
};

// ============= SALES STRATEGIES API =============
export const salesAPI = {
  getAll: (userId?: string, all?: boolean) =>
    apiFetch(`/sales${buildQuery({ userId, all })}`),
  
  create: (data: any) =>
    apiFetch('/sales', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (id: string, data: any, userId?: string) =>
    apiFetch(`/sales/${id}${buildQuery({ userId })}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  delete: (id: string, userId?: string) =>
    apiFetch(`/sales/${id}${buildQuery({ userId })}`, { method: 'DELETE' }),
};

// ============= TASK API =============
export const taskAPI = {
  getAll: (userId?: string, all?: boolean) =>
    apiFetch(`/tasks${buildQuery({ userId, all })}`),
  
  getByUser: (userId: number) =>
    apiFetch(`/tasks/user/${userId}`),
  
  getStats: (userId?: number) =>
    apiFetch(`/tasks/stats${buildQuery({ userId })}`),
  
  create: (data: {
    title: string;
    description: string;
    assignedTo: string | number;
    assignedBy: string | number;
    assignedByName: string;
    assignedToName: string;
    assignedToPhone: string;
    priority?: 'high' | 'medium' | 'low';
    dueDate?: string;
  }) =>
    apiFetch('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (id: number, data: any) =>
    apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  updateStatus: (id: number, status: 'assigned' | 'in_progress' | 'completed', feedback?: string) =>
    apiFetch(`/tasks/${id}/status`, { 
      method: 'PATCH', 
      body: JSON.stringify({ status, feedback }) 
    }),
  
  delete: (id: number) =>
    apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
};

// ============= KPI API =============
export const kpiAPI = {
  getAll: (userId?: string, all?: boolean) =>
    apiFetch(`/kpi${buildQuery({ userId, all })}`),
  
  create: (data: any) =>
    apiFetch('/kpi', { method: 'POST', body: JSON.stringify(data) }),
};

// ============= ACTIVITIES API =============
export const activitiesAPI = {
  getAll: (userId?: string) =>
    apiFetch(`/activities${buildQuery({ userId })}`),
};

// ============= COMPANY SETTINGS API =============
export const companyAPI = {
  getSettings: () => apiFetch('/company/settings'),
  
  updateSettings: (settings: any) =>
    apiFetch('/company/settings', { method: 'PUT', body: JSON.stringify(settings) }),
};

// ============= INVITATIONS API =============
export const invitationAPI = {
  generate: (data: { email?: string; name: string; role: 'user' | 'admin' }) =>
    apiFetch('/invitations/generate', { method: 'POST', body: JSON.stringify(data) }),
  
  sendEmail: (data: { email: string; name: string; role: 'user' | 'admin'; inviteLink: string }) =>
    apiFetch('/invitations/email', { method: 'POST', body: JSON.stringify(data) }),
  
  verify: (inviteCode: string) =>
    apiFetch(`/invitations/verify/${inviteCode}`),
};

// ============= REPORTS API =============
export const reportsAPI = {
  getAfterSales: () => apiFetch('/reports/aftersales'),
  getDebt: () => apiFetch('/reports/debt'),
  getKPI: () => apiFetch('/reports/kpi'),
  getSales: () => apiFetch('/reports/sales'),
};

// ============= WHATSAPP API =============
export const whatsappAPI = {
  sendMessage: (to: string, message: string) =>
    apiFetch('/whatsapp/send', { method: 'POST', body: JSON.stringify({ to, message }) }),
  
  sendTemplate: (to: string, templateName: string, language: string, components: any[]) =>
    apiFetch('/whatsapp/send-template', { method: 'POST', body: JSON.stringify({ to, templateName, language, components }) }),
};

// ============= REPORT HISTORY API =============
export const reportHistoryAPI = {
  save: (period: string, reportData: any, insights: any[], summary: any) =>
    apiFetch('/reports', { method: 'POST', body: JSON.stringify({ period, reportData, insights, summary }) }),
  
  getAll: async () => {
    try {
      const data = await apiFetch('/reports');
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('getAll reports error:', error);
      return [];
    }
  },
  
  getById: (id: number) =>
    apiFetch(`/reports/${id}`),
  
  delete: (id: number) =>
    apiFetch(`/reports/${id}`, { method: 'DELETE' }),
};