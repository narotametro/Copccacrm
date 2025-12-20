import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { companyAPI } from '../lib/api';

export function CompanyBranding() {
  const [companyName, setCompanyName] = useState('');
  const [showCompanyName, setShowCompanyName] = useState(false);

  useEffect(() => {
    loadCompanySettings();

    // Listen for settings updates
    const handleUpdate = () => {
      loadCompanySettings();
    };
    
    window.addEventListener('company-settings-updated', handleUpdate);
    return () => window.removeEventListener('company-settings-updated', handleUpdate);
  }, []);

  const loadCompanySettings = async () => {
    try {
      const { settings } = await companyAPI.getSettings();
      if (settings) {
        setCompanyName(settings.companyName || '');
        setShowCompanyName(settings.showCompanyName !== false);
      }
    } catch (error) {
      console.error('Failed to load company settings:', error);
    }
  };

  if (!showCompanyName || !companyName) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 border border-pink-100 rounded-lg">
      <Building2 size={18} className="text-pink-600" />
      <span className="text-sm text-gray-800">{companyName}</span>
    </div>
  );
}
