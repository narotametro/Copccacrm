import React, { useState } from 'react';
import { MapPin, Banknote, Plus, Edit, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export const TargetPersonas: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaSegment, setNewPersonaSegment] = useState('Small-Medium Business');
  const personas = [
    {
      name: 'Enterprise James',
      segment: 'Large Businesses',
      location: 'Urban - Lagos, Abuja',
      income: '₦5M - ₦20M monthly',
      pain: ['Unreliable suppliers', 'Poor after-sales', 'Delayed delivery'],
      jtbd: 'Keep operations running without supply chain issues',
      channels: ['Direct Sales', 'LinkedIn', 'Industry Events'],
      performance: { leads: 145, conversion: 4.2, revenue: 8500000 },
    },
    {
      name: 'SME Sarah',
      segment: 'Small-Medium Business',
      location: 'Semi-Urban - State Capitals',
      income: '₦500K - ₦2M monthly',
      pain: ['High prices', 'Complex procurement', 'Limited support'],
      jtbd: 'Affordable quality equipment with easy access',
      channels: ['Online Store', 'WhatsApp', 'SMS', 'Email'],
      performance: { leads: 312, conversion: 3.5, revenue: 4200000 },
    },
    {
      name: 'Reseller Mike',
      segment: 'Channel Partners',
      location: 'Regional - All States',
      income: '₦200K - ₦1M monthly',
      pain: ['Margin pressure', 'Inventory management', 'Training gaps'],
      jtbd: 'Reliable partner with good margins and support',
      channels: ['Partner Portal', 'Direct Contact', 'Training Events'],
      performance: { leads: 87, conversion: 5.1, revenue: 2100000 },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Target Customer Personas</h3>
          <p className="text-slate-600 text-sm mt-1">Detailed customer profiles linked to live data</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddModal(true)}>Add Persona</Button>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Persona"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Persona Name</label>
            <Input
              value={newPersonaName}
              onChange={(e) => setNewPersonaName(e.target.value)}
              placeholder="e.g., SME Sarah"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Segment</label>
            <select
              value={newPersonaSegment}
              onChange={(e) => setNewPersonaSegment(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option>Large Businesses</option>
              <option>Small-Medium Business</option>
              <option>Channel Partners</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button
              onClick={() => {
                toast.success('Persona added', {
                  description: `${newPersonaName || 'New persona'} • ${newPersonaSegment}`,
                });
                setShowAddModal(false);
                setNewPersonaName('');
                setNewPersonaSegment('Small-Medium Business');
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <div className="grid lg:grid-cols-2 gap-6">
        {personas.map((persona, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">{persona.name}</h4>
                <p className="text-sm text-purple-600">{persona.segment}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{persona.performance.conversion}%</div>
                <div className="text-xs text-slate-600">Conv. Rate</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-slate-400" />
                <span className="text-slate-700">{persona.location}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Banknote size={16} className="text-slate-400" />
                <span className="text-slate-700">{persona.income}</span>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-600 mb-1">PAIN POINTS</div>
                <div className="flex flex-wrap gap-1">
                  {persona.pain.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-600 mb-1">JOB TO BE DONE</div>
                <p className="text-sm text-slate-700 italic">"{persona.jtbd}"</p>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-600 mb-1">PREFERRED CHANNELS</div>
                <div className="flex flex-wrap gap-1">
                  {persona.channels.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-slate-900">{persona.performance.leads}</div>
                  <div className="text-xs text-slate-600">Leads</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">{persona.performance.conversion}%</div>
                  <div className="text-xs text-slate-600">Conv.</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    ₦{(persona.performance.revenue / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-slate-600">Revenue</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit}
                  onClick={() => toast.message('Edit persona', { description: persona.name })}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Trash2}
                  onClick={() => toast.success('Persona removed', { description: persona.name })}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
