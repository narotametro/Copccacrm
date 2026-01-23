import React, { useState, useEffect } from 'react';
import { MapPin, Banknote, Plus, Edit, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

interface Persona {
  id: string;
  name: string;
  segment: string;
  location: string;
  income: string;
  pain: string[];
  jtbd: string;
  channels: string[];
  performance: { leads: number; conversion: number; revenue: number };
}

export const TargetPersonas: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaSegment, setNewPersonaSegment] = useState('Small-Medium Business');

  // Load personas on component mount
  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = () => {
    try {
      const saved = localStorage.getItem('copcca-target-personas');
      const personaData = saved ? JSON.parse(saved) : [];
      setPersonas(personaData);
    } catch (error) {
      console.error('Failed to load personas:', error);
    }
  };

  const handleAddPersona = () => {
    if (!newPersonaName.trim()) {
      toast.error('Please enter a persona name');
      return;
    }

    const newPersona: Persona = {
      id: Date.now().toString(),
      name: newPersonaName,
      segment: newPersonaSegment,
      location: 'Nigeria',
      income: '₦500K - ₦2M',
      pain: ['Manual processes', 'Customer tracking', 'Sales forecasting'],
      jtbd: 'Manage customer relationships and grow sales efficiently',
      channels: ['Email', 'Social Media', 'Website'],
      performance: { leads: 0, conversion: 0, revenue: 0 },
    };

    const updatedPersonas = [...personas, newPersona];
    setPersonas(updatedPersonas);
    localStorage.setItem('copcca-target-personas', JSON.stringify(updatedPersonas));
    setNewPersonaName('');
    setNewPersonaSegment('Small-Medium Business');
    setShowAddModal(false);
    toast.success('Persona added successfully');
  };

  const handleRemovePersona = (id: string) => {
    const updatedPersonas = personas.filter(p => p.id !== id);
    setPersonas(updatedPersonas);
    localStorage.setItem('copcca-target-personas', JSON.stringify(updatedPersonas));
    toast.success('Persona removed');
  };

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
            <Button onClick={handleAddPersona}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <div className="grid lg:grid-cols-2 gap-6">
        {personas.map((persona) => (
          <Card key={persona.id} className="hover:shadow-lg transition-all">
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
                  onClick={() => handleRemovePersona(persona.id)}
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
