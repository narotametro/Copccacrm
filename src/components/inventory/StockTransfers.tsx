import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Package, Truck, CheckCircle, XCircle, Plus, Printer, ArrowRight } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  type: 'pos' | 'inventory';
  city?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_of_measure: string;
}

interface TransferItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity_requested: number;
  quantity_sent: number;
  quantity_received: number;
  unit_of_measure: string;
  notes: string;
}

interface StockTransfer {
  id: string;
  transfer_number: string;
  from_location_id: string;
  to_location_id: string;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  transfer_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  notes: string;
  created_by: string;
  approved_by?: string;
  received_by?: string;
  from_location?: Location;
  to_location?: Location;
  items?: TransferItem[];
}

export const StockTransfers: React.FC = () => {
  const { user } = useAuthStore();
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  
  const [newTransfer, setNewTransfer] = useState({
    from_location_id: '',
    to_location_id: '',
    expected_delivery_date: '',
    notes: '',
    items: [] as TransferItem[]
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get user's company
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) return;

      // Load locations
      const { data: locationsData } = await supabase
        .from('locations')
        .select('*')
        .eq('company_id', userData.company_id)
        .eq('status', 'active');

      if (locationsData) setLocations(locationsData);

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, sku, unit_of_measure')
        .eq('company_id', userData.company_id);

      if (productsData) setProducts(productsData);

      // Load transfers
      const { data: transfersData } = await supabase
        .from('stock_transfers')
        .select(`
          *,
          from_location:locations!from_location_id(id, name, type, city),
          to_location:locations!to_location_id(id, name, type, city)
        `)
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: false });

      if (transfersData) setTransfers(transfersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load stock transfers');
    } finally {
      setLoading(false);
    }
  };

  const addTransferItem = () => {
    setNewTransfer({
      ...newTransfer,
      items: [
        ...newTransfer.items,
        {
          product_id: '',
          product_name: '',
          product_sku: '',
          quantity_requested: 0,
          quantity_sent: 0,
          quantity_received: 0,
          unit_of_measure: 'pcs',
          notes: ''
        }
      ]
    });
  };

  const removeTransferItem = (index: number) => {
    setNewTransfer({
      ...newTransfer,
      items: newTransfer.items.filter((_, i) => i !== index)
    });
  };

  const updateTransferItem = (index: number, field: string, value: any) => {
    const updatedItems = [...newTransfer.items];
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index] = {
          ...updatedItems[index],
          product_id: value,
          product_name: product.name,
          product_sku: product.sku,
          unit_of_measure: product.unit_of_measure
        };
      }
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
    }
    
    setNewTransfer({ ...newTransfer, items: updatedItems });
  };

  const createTransfer = async () => {
    if (!user) return;
    
    if (!newTransfer.from_location_id || !newTransfer.to_location_id) {
      toast.error('Please select source and destination locations');
      return;
    }
    
    if (newTransfer.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) return;

      // Create transfer
      const { data: transfer, error: transferError } = await supabase
        .from('stock_transfers')
        .insert({
          company_id: userData.company_id,
          from_location_id: newTransfer.from_location_id,
          to_location_id: newTransfer.to_location_id,
          expected_delivery_date: newTransfer.expected_delivery_date || null,
          notes: newTransfer.notes,
          created_by: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (transferError) throw transferError;

      // Create transfer items
      const itemsToInsert = newTransfer.items.map(item => ({
        transfer_id: transfer.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity_requested: item.quantity_requested,
        quantity_sent: item.quantity_requested, // Initially set sent = requested
        quantity_received: 0,
        unit_of_measure: item.unit_of_measure,
        notes: item.notes
      }));

      const { error: itemsError } = await supabase
        .from('stock_transfer_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('Stock transfer created successfully');
      setShowCreateModal(false);
      setNewTransfer({
        from_location_id: '',
        to_location_id: '',
        expected_delivery_date: '',
        notes: '',
        items: []
      });
      loadData();
    } catch (error) {
      console.error('Error creating transfer:', error);
      toast.error('Failed to create stock transfer');
    }
  };

  const updateTransferStatus = async (transferId: string, status: string) => {
    try {
      const updates: any = { status };
      
      if (status === 'in_transit') {
        updates.approved_by = user?.id;
      } else if (status === 'completed') {
        updates.received_by = user?.id;
        updates.actual_delivery_date = new Date().toISOString();
        
        // Update all items to mark quantities as received
        await supabase
          .from('stock_transfer_items')
          .update({ quantity_received: supabase.raw('quantity_sent') })
          .eq('transfer_id', transferId);
      }

      const { error } = await supabase
        .from('stock_transfers')
        .update(updates)
        .eq('id', transferId);

      if (error) throw error;

      toast.success(`Transfer ${status === 'completed' ? 'completed' : 'updated'} successfully`);
      loadData();
    } catch (error) {
      console.error('Error updating transfer:', error);
      toast.error('Failed to update transfer status');
    }
  };

  const printDeliveryNote = async (transfer: StockTransfer) => {
    try {
      // Load transfer items
      const { data: items } = await supabase
        .from('stock_transfer_items')
        .select('*')
        .eq('transfer_id', transfer.id);

      const printWindow = window.open('', '', 'width=800,height=600');
      if (!printWindow) return;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Delivery Note - ${transfer.transfer_number}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              font-size: 12px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .info-box {
              border: 1px solid #ddd;
              padding: 10px;
              border-radius: 5px;
            }
            .info-box h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            .signature-box {
              display: inline-block;
              width: 45%;
              margin-right: 5%;
              vertical-align: top;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 60px;
              padding-top: 5px;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>STOCK TRANSFER DELIVERY NOTE</h1>
            <p><strong>Transfer #: ${transfer.transfer_number}</strong></p>
          </div>
          
          <div class="info-grid">
            <div class="info-box">
              <h3>From Location</h3>
              <p><strong>${transfer.from_location?.name || 'N/A'}</strong></p>
              <p>${transfer.from_location?.city || ''}</p>
              <p>Type: ${transfer.from_location?.type?.toUpperCase() || ''}</p>
            </div>
            
            <div class="info-box">
              <h3>To Location</h3>
              <p><strong>${transfer.to_location?.name || 'N/A'}</strong></p>
              <p>${transfer.to_location?.city || ''}</p>
              <p>Type: ${transfer.to_location?.type?.toUpperCase() || ''}</p>
            </div>
          </div>
          
          <div class="info-box">
            <p><strong>Transfer Date:</strong> ${new Date(transfer.transfer_date).toLocaleDateString()}</p>
            <p><strong>Expected Delivery:</strong> ${transfer.expected_delivery_date ? new Date(transfer.expected_delivery_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Status:</strong> ${transfer.status.toUpperCase()}</p>
            ${transfer.notes ? `<p><strong>Notes:</strong> ${transfer.notes}</p>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${items?.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.product_name}</td>
                  <td>${item.product_sku || '-'}</td>
                  <td>${item.quantity_sent}</td>
                  <td>${item.unit_of_measure}</td>
                  <td>${item.notes || '-'}</td>
                </tr>
              `).join('') || ''}
            </tbody>
            <tfoot>
              <tr>
                <th colspan="3">Total Items</th>
                <th>${items?.reduce((sum, item) => sum + Number(item.quantity_sent), 0) || 0}</th>
                <th colspan="2"></th>
              </tr>
            </tfoot>
          </table>
          
          <div class="footer">
            <div class="signature-box">
              <strong>Sent By:</strong>
              <div class="signature-line">Name & Signature</div>
              <p>Date: _________________</p>
            </div>
            
            <div class="signature-box">
              <strong>Received By:</strong>
              <div class="signature-line">Name & Signature</div>
              <p>Date: _________________</p>
            </div>
          </div>
          
          <p style="text-align: center; margin-top: 40px; font-size: 10px; color: #666;">
            Generated on ${new Date().toLocaleString()}
          </p>
          
          <button class="no-print" onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 10px 20px; cursor: pointer;">
            Print
          </button>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing delivery note:', error);
      toast.error('Failed to generate delivery note');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Package className="text-yellow-500" size={20} />;
      case 'in_transit':
        return <Truck className="text-blue-500" size={20} />;
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'cancelled':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Stock Transfers</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Transfer inventory between locations and manage deliveries
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus size={16} />
          New Transfer
        </Button>
      </div>

      {/* Transfers List */}
      <div className="grid gap-4">
        {transfers.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No stock transfers yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Create your first stock transfer to move inventory between locations.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>Create Transfer</Button>
          </Card>
        ) : (
          transfers.map((transfer) => (
            <Card key={transfer.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(transfer.status)}
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {transfer.transfer_number}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transfer.status)}`}>
                      {transfer.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">{transfer.from_location?.name}</span>
                    <ArrowRight size={16} />
                    <span className="font-medium">{transfer.to_location?.name}</span>
                  </div>
                  
                  <p className="text-sm text-slate-500 mt-1">
                    Date: {new Date(transfer.transfer_date).toLocaleDateString()}
                    {transfer.expected_delivery_date && ` • Expected: ${new Date(transfer.expected_delivery_date).toLocaleDateString()}`}
                  </p>
                  
                  {transfer.notes && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      <strong>Notes:</strong> {transfer.notes}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => printDeliveryNote(transfer)}
                    className="flex items-center gap-1"
                  >
                    <Printer size={14} />
                    Print
                  </Button>
                  
                  {transfer.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => updateTransferStatus(transfer.id, 'in_transit')}
                    >
                      Mark In Transit
                    </Button>
                  )}
                  
                  {transfer.status === 'in_transit' && (
                    <Button
                      size="sm"
                      onClick={() => updateTransferStatus(transfer.id, 'completed')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Complete Transfer
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Transfer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-4xl mx-4 my-8">
            <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">New Stock Transfer</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  From Location *
                </label>
                <select
                  value={newTransfer.from_location_id}
                  onChange={(e) => setNewTransfer({ ...newTransfer, from_location_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
                >
                  <option value="">Select source location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  To Location *
                </label>
                <select
                  value={newTransfer.to_location_id}
                  onChange={(e) => setNewTransfer({ ...newTransfer, to_location_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
                >
                  <option value="">Select destination location</option>
                  {locations.filter(l => l.id !== newTransfer.from_location_id).map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={newTransfer.expected_delivery_date}
                  onChange={(e) => setNewTransfer({ ...newTransfer, expected_delivery_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={newTransfer.notes}
                  onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                  placeholder="Any special instructions..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Items to Transfer *
                </label>
                <Button size="sm" onClick={addTransferItem} variant="outline">
                  <Plus size={14} className="mr-1" />
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {newTransfer.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 dark:bg-slate-700 rounded">
                    <div className="col-span-5">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateTransferItem(index, 'product_id', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded"
                      >
                        <option value="">Select product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.quantity_requested}
                        onChange={(e) => updateTransferItem(index, 'quantity_requested', parseFloat(e.target.value) || 0)}
                        placeholder="Qty"
                        className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded"
                      />
                    </div>
                    <div className="col-span-1 text-xs text-slate-600 dark:text-slate-400">
                      {item.unit_of_measure}
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => updateTransferItem(index, 'notes', e.target.value)}
                        placeholder="Notes..."
                        className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeTransferItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={createTransfer} className="flex-1">
                Create Transfer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
