import { Plus, Minus, Calendar } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useCurrency } from '../lib/currency-context';
import { formatNumberWithCommas, formatInputWithCommas, removeCommas } from '../lib/utils';
import { CurrencyInput } from './shared/CurrencyInput';

interface PerformanceDataFormProps {
  performanceEntry: any;
  setPerformanceEntry: (entry: any) => void;
  category: string;
}

export function PerformanceDataForm({ performanceEntry, setPerformanceEntry, category }: PerformanceDataFormProps) {
  const { currency } = useCurrency();
  
  const updateProductField = (arrayField: string, index: number, field: string, value: string) => {
    const updated = [...(performanceEntry as any)[arrayField]];
    updated[index] = { ...updated[index], [field]: value };
    setPerformanceEntry({
      ...performanceEntry,
      [arrayField]: updated
    });
  };

  const addProductField = (field: string, defaultValue: any) => {
    setPerformanceEntry({
      ...performanceEntry,
      [field]: [...(performanceEntry[field] || []), defaultValue]
    });
  };

  const removeProductField = (field: string, index: number) => {
    if (performanceEntry[field] && performanceEntry[field].length > 1) {
      setPerformanceEntry({
        ...performanceEntry,
        [field]: performanceEntry[field].filter((_: any, i: number) => i !== index)
      });
    }
  };

  // Product Available Form
  if (category === 'productAvailable') {
    return (
      <div className="space-y-4">
        <label className="block">
          <span className="block mb-2">Products Available</span>
          {performanceEntry.products.map((product: any, index: number) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Product Name"
                value={product.name}
                onChange={(e) => updateProductField('products', index, 'name', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <input
                type="text"
                placeholder="Quantity"
                value={product.quantity}
                onChange={(e) => updateProductField('products', index, 'quantity', e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              {performanceEntry.products.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProductField('products', index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Minus size={20} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addProductField('products', { name: '', quantity: '' })}
            className="flex items-center gap-2 px-3 py-2 text-sm text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Product
          </button>
        </label>
      </div>
    );
  }

  // Pricing Form
  if (category === 'pricing') {
    return (
      <div className="space-y-4">
        <label className="block">
          <span className="block mb-2">Product Pricing</span>
          {performanceEntry.pricingProducts.map((product: any, index: number) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Product Name"
                value={product.product}
                onChange={(e) => updateProductField('pricingProducts', index, 'product', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <input
                type="number"
                placeholder="Unit Price"
                value={product.unitPrice}
                onChange={(e) => updateProductField('pricingProducts', index, 'unitPrice', e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              {performanceEntry.pricingProducts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProductField('pricingProducts', index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Minus size={20} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addProductField('pricingProducts', { product: '', unitPrice: '' })}
            className="flex items-center gap-2 px-3 py-2 text-sm text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Product
          </button>
        </label>
      </div>
    );
  }

  // Revenue Generated Form (Multiple entries with running total)
  if (category === 'revenueGenerated') {
    // Calculate running total
    const totalRevenue = performanceEntry.revenueMonths
      .filter((m: any) => m.revenue && m.revenue.toString().trim())
      .reduce((sum: number, m: any) => sum + (parseFloat(m.revenue) || 0), 0);

    return (
      <div className="space-y-4">
        <label className="block">
          <span className="block mb-2">Revenue Entries</span>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {performanceEntry.revenueMonths.map((monthData: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={monthData.month}
                  onChange={(e) => updateProductField('revenueMonths', index, 'month', e.target.value)}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Select Month</option>
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
                <input
                  type="number"
                  placeholder="Revenue amount"
                  value={monthData.revenue}
                  onChange={(e) => updateProductField('revenueMonths', index, 'revenue', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                {performanceEntry.revenueMonths.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProductField('revenueMonths', index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addProductField('revenueMonths', { month: '', revenue: '' })}
            className="flex items-center gap-2 px-3 py-2 text-sm text-pink-600 hover:bg-pink-50 rounded-lg transition-colors mt-2"
          >
            <Plus size={16} /> Add Revenue Entry
          </button>
        </label>
        
        {/* Running Total Display */}
        {totalRevenue > 0 && (
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total Revenue:</span>
              <span className="text-xl font-bold text-amber-700">{currency} {formatNumberWithCommas(totalRevenue)}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Last Order Form
  if (category === 'lastOrder') {
    return (
      <div className="space-y-4">
        <label className="block">
          <span className="block mb-2">Products Ordered</span>
          {performanceEntry.lastOrderProducts.map((product: any, index: number) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Product Name"
                value={product.product}
                onChange={(e) => updateProductField('lastOrderProducts', index, 'product', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <input
                type="text"
                placeholder="Quantity"
                value={product.quantity}
                onChange={(e) => updateProductField('lastOrderProducts', index, 'quantity', e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              {performanceEntry.lastOrderProducts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProductField('lastOrderProducts', index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Minus size={20} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addProductField('lastOrderProducts', { product: '', quantity: '' })}
            className="flex items-center gap-2 px-3 py-2 text-sm text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Product
          </button>
        </label>
      </div>
    );
  }

  // Price Protection Form
  if (category === 'priceProtection') {
    const totalProtected = performanceEntry.priceProtectionProducts.reduce((sum: number, p: any) => {
      const qty = parseFloat(p.quantity) || 0;
      const price = parseFloat(p.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);

    return (
      <div className="space-y-4">
        <label className="block">
          <span className="block mb-2">Price Protection Details</span>
          {performanceEntry.priceProtectionProducts.map((product: any, index: number) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Product"
                value={product.product}
                onChange={(e) => updateProductField('priceProtectionProducts', index, 'product', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <input
                type="number"
                placeholder="Qty"
                value={product.quantity}
                onChange={(e) => updateProductField('priceProtectionProducts', index, 'quantity', e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <input
                type="number"
                placeholder="Unit Price"
                value={product.unitPrice}
                onChange={(e) => updateProductField('priceProtectionProducts', index, 'unitPrice', e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              {performanceEntry.priceProtectionProducts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProductField('priceProtectionProducts', index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Minus size={20} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addProductField('priceProtectionProducts', { product: '', quantity: '', unitPrice: '' })}
            className="flex items-center gap-2 px-3 py-2 text-sm text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Product
          </button>
          {totalProtected > 0 && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm"><span>Total Price Protected:</span> <span>{currency} {totalProtected.toFixed(2)}</span></p>
            </div>
          )}
        </label>
      </div>
    );
  }

  // Return Information Form
  if (category === 'returnInformation') {
    return (
      <div className="space-y-4">
        <label className="block">
          <span className="block mb-2">Return Details</span>
          {performanceEntry.returnProducts.map((product: any, index: number) => (
            <div key={index} className="space-y-2 mb-3 p-3 border border-gray-200 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={product.product}
                  onChange={(e) => updateProductField('returnProducts', index, 'product', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <input
                  type="text"
                  placeholder="Quantity"
                  value={product.quantity}
                  onChange={(e) => updateProductField('returnProducts', index, 'quantity', e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                {performanceEntry.returnProducts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProductField('returnProducts', index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                )}
              </div>
              <textarea
                placeholder="Problem Description"
                value={product.problem}
                onChange={(e) => updateProductField('returnProducts', index, 'problem', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows={2}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => addProductField('returnProducts', { product: '', quantity: '', problem: '' })}
            className="flex items-center gap-2 px-3 py-2 text-sm text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Return
          </button>
        </label>
      </div>
    );
  }

  // Average Sales Cycle Form
  if (category === 'averageSalesCycle') {
    return (
      <div className="space-y-4">
        <label className="block">
          <span className="block mb-2">Sales Cycle Duration</span>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Duration"
              value={performanceEntry.salesCycleDuration}
              onChange={(e) => setPerformanceEntry({ ...performanceEntry, salesCycleDuration: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <select
              value={performanceEntry.salesCycleUnit}
              onChange={(e) => setPerformanceEntry({ ...performanceEntry, salesCycleUnit: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Example: 5 days, 3 weeks, or 2 months
          </p>
        </label>
      </div>
    );
  }

  // Default form for other categories
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="block mb-2">Value</span>
        <input
          type="text"
          value={performanceEntry.value}
          onChange={(e) => setPerformanceEntry({ ...performanceEntry, value: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter value"
        />
      </label>
    </div>
  );
}