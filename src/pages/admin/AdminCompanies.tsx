import React, { useState } from 'react';
import { Building2, Users, Mail, Phone, Calendar, CheckCircle, XCircle, Settings, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { formatName, formatEmail } from '@/lib/textFormat';

interface Company {
  id: string;
  name: string;
  adminEmail: string;
  adminName: string;
  status: 'active' | 'suspended' | 'trial';
  userCount: number;
  createdDate: string;
  lastActive: string;
}

export const AdminCompanies: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companies] = useState<Company[]>([
    {
      id: '1',
      name: 'TechCorp Nigeria Ltd',
      adminEmail: 'admin@techcorp.ng',
      adminName: 'Chukwuma Okafor',
      status: 'active',
      userCount: 45,
      createdDate: '2025-06-15',
      lastActive: '2 hours ago',
    },
    {
      id: '2',
      name: 'Global Trade Solutions',
      adminEmail: 'admin@globaltrade.com',
      adminName: 'Amina Mohammed',
      status: 'trial',
      userCount: 8,
      createdDate: '2026-01-08',
      lastActive: '1 day ago',
    },
    {
      id: '3',
      name: 'Innovation Hub Lagos',
      adminEmail: 'contact@innovationhub.ng',
      adminName: 'Oluwaseun Adeyemi',
      status: 'active',
      userCount: 22,
      createdDate: '2025-09-20',
      lastActive: '5 hours ago',
    },
  ]);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = (companyId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    toast.success(`Company ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
  };

  const handleDeleteCompany = (companyId: string, companyName: string) => {
    if (confirm(`Are you sure you want to delete ${companyName}? This action cannot be undone.`)) {
      toast.success('Company deleted successfully');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Company Management</h1>
          <p className="text-purple-200">Manage all registered companies</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-white">{companies.length}</p>
          <p className="text-purple-200 text-sm">Total Companies</p>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <Input
          placeholder="Search by company name or admin email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-purple-200/50"
        />
      </Card>

      {/* Companies List */}
      <div className="space-y-4">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="bg-white/10 backdrop-blur-sm border-white/20">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                  <Building2 className="text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{formatName(company.name)}</h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-purple-200 text-sm">
                      <Mail size={14} />
                      <span>{formatEmail(company.adminEmail)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-200 text-sm">
                      <Users size={14} />
                      <span>{company.userCount} users</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-200 text-sm">
                      <Calendar size={14} />
                      <span>Created {company.createdDate} • Last active {company.lastActive}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  company.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  company.status === 'trial' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {company.status.toUpperCase()}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleToggleStatus(company.id, company.status)}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    {company.status === 'active' ? 'Suspend' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Settings}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    Manage
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Trash2}
                    onClick={() => handleDeleteCompany(company.id, company.name)}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
