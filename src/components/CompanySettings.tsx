import { useState, useEffect } from 'react';
import { Building2, Edit2, Trash2, Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { toast } from 'sonner@2.0.3';
import { companyAPI } from '../lib/api';

export function CompanySettings() {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [showCompanyName, setShowCompanyName] = useState(true);
  const [originalName, setOriginalName] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Only load settings after auth is complete and user is available
    if (!authLoading && user && isAdmin) {
      loadCompanySettings();
    }
  }, [authLoading, user, isAdmin]);

  useEffect(() => {
    // Track if there are unsaved changes
    setHasChanges(companyName !== originalName);
  }, [companyName, originalName]);

  const loadCompanySettings = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getSettings();
      console.log('Company settings loaded:', response);
      
      if (response && response.settings) {
        const name = response.settings.companyName || '';
        setCompanyName(name);
        setOriginalName(name);
        setShowCompanyName(response.settings.showCompanyName !== false);
        
        if (!name) {
          setEditing(true); // Start in edit mode if no name set
        }
      } else {
        setEditing(true); // Start in edit mode if no settings
      }
    } catch (error: any) {
      console.error('Failed to load company settings:', error);
      toast.error(`Failed to load company settings: ${error.message || 'Unknown error'}`);
      setEditing(true); // Start in edit mode on error
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    try {
      setSaving(true);
      console.log('Saving company settings:', { companyName, showCompanyName });
      
      const response = await companyAPI.updateSettings({
        companyName: companyName.trim(),
        showCompanyName,
      });
      
      console.log('Company settings saved:', response);
      
      setOriginalName(companyName.trim());
      setEditing(false);
      toast.success('✓ Company settings saved successfully!', {
        duration: 3000,
      });
      
      // Trigger a page reload to update the header
      window.dispatchEvent(new Event('company-settings-updated'));
    } catch (error: any) {
      console.error('Failed to save company settings:', error);
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove the company name?')) {
      return;
    }

    try {
      setSaving(true);
      await companyAPI.updateSettings({
        companyName: '',
        showCompanyName: false,
      });
      
      setCompanyName('');
      setOriginalName('');
      setShowCompanyName(false);
      setEditing(true);
      
      toast.success('Company name removed');
      window.dispatchEvent(new Event('company-settings-updated'));
    } catch (error: any) {
      console.error('Failed to delete company settings:', error);
      toast.error('Failed to remove company name');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setCompanyName(originalName);
    setEditing(false);
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-center py-8 text-gray-500">
          <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Only admins can manage company settings</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-pink-500" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
            <Building2 size={20} className="text-pink-600" />
          </div>
          <div>
            <h3 className="text-lg">Company Branding</h3>
            <p className="text-sm text-gray-500">Customize your company information</p>
          </div>
        </div>
        
        {/* Edit/Delete Actions */}
        {!editing && companyName && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit company name"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Remove company name"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Company Name */}
        <div>
          <label className="block text-sm mb-2">
            Company / Business Name
          </label>
          {editing ? (
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter your company name"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              autoFocus
            />
          ) : (
            <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-800">
              {companyName || 'No company name set'}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            This name will be displayed to all team members when visibility is enabled
          </p>
        </div>

        {/* Visibility Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {showCompanyName ? (
              <Eye size={20} className="text-pink-600" />
            ) : (
              <EyeOff size={20} className="text-gray-400" />
            )}
            <div>
              <p className="text-sm">Show company name to team</p>
              <p className="text-xs text-gray-500">
                {showCompanyName 
                  ? 'Company name is visible in the header' 
                  : 'Company name is hidden from team members'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCompanyName(!showCompanyName)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showCompanyName ? 'bg-pink-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showCompanyName ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Preview */}
        {companyName && showCompanyName && (
          <div className="p-4 bg-pink-50 rounded-lg border border-pink-100">
            <p className="text-xs text-gray-600 mb-2">Preview:</p>
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-pink-600" />
              <span className="font-medium text-gray-800">{companyName}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          {editing && originalName && (
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <X size={18} />
              Cancel
            </button>
          )}
          
          {(editing || hasChanges) && (
            <button
              onClick={handleSave}
              disabled={saving || !companyName.trim()}
              className="px-6 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}