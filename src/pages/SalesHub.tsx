import React, { useState, useEffect, useCallback, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  BarChart3,
  Trash2,
  Users,
  Receipt,
  Printer,
  AlertCircle,
  CheckCircle,
  Banknote,
  User,
  History,
  Check,
  X,
  Zap as ZapIcon,
  Loader2,
  Edit,
  Eye,
  Truck,
  Brain,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import { useSalesHubStore } from '@/store/salesHubStore';
import { useAuthStore } from '@/store/authStore';
import { StockTransfers } from '@/components/inventory/StockTransfers';
import { useOptimisticCache } from '@/lib/optimisticCache';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost_price?: number;
  stock_quantity: number;
  min_stock_level?: number;
  brand_id?: string;
  brands?: {
    id: string;
    name: string;
  };
  category_id?: string;
  categories?: {
    id: string;
    name: string;
  };
  location_id?: string;
  location?: {
    id: string;
    name: string;
    type: 'pos' | 'inventory';
  };
  image_url?: string;
  sales_velocity?: number;
}

type StockStatus = {
  status: 'out' | 'low' | 'healthy';
  color: string;
  text: string;
};

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Customer {
  id: string;
  customer_id: string;
  name: string;
  company_name?: string;
  email: string;
  phone?: string;
  mobile?: string;
  tier: string;
  health_score: number;
  churn_risk: string;
  upsell_potential: string;
  lifetime_value: number;
  outstanding_balance: number;
  preferred_payment?: string;
  status: string;
  total_orders: number;
  last_order_date?: string;
  tags: string[];
}

interface OrderItem {
  product_id: string;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface SalesHubOrder {
  id: string;
  order_number: string;
  customer_id: string;
  subtotal: number;
  tax_amount: number;
  discount_type: 'percentage' | 'monetary';
  discount_value: number;
  discount_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'credit';
  items: OrderItem[];
  status: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface StockHistoryEntry {
  id: string;
  date: string;
  product: string;
  sku?: string;
  brand?: string;
  variant?: string;
  action: string;
  qtyChange: number;
  stockBefore: number;
  stockAfter: number;
  location: string;
  reference: string;
  referenceType: string;
  performedBy: string;
  customer?: string;
  purchaseCostPerUnit?: number;
  purchaseCostTotal?: number;
}

interface AIInsight {
  id: string;
  type: 'trend' | 'alert' | 'opportunity' | 'insight';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendation: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  message: string;
  explanation?: string;
  action: string;
}

type Subsection = 'products' | 'carts-invoice' | 'order-history' | 'inventory-status' | 'customer-buying-patterns' | 'expenses' | 'product-stocking-history' | 'stock-transfers';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number, customPrice: number) => void;
  formatCurrency: (amount: number) => string;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

// COMPLETELY REWRITTEN: Input with isolated state - zero re-renders during typing
const CartPriceInput: React.FC<{
  productId: string;
  initialValue: number;
  onChange: (productId: string, value: number) => void;
}> = ({ productId, initialValue, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const committedValueRef = useRef(initialValue);
  
  // Initialize with prop value ONCE - never updates during component lifetime
  useEffect(() => {
    if (inputRef.current && !inputRef.current.value) {
      inputRef.current.value = initialValue > 0 ? initialValue.toString() : '';
      committedValueRef.current = initialValue;
    }
  }, []);

  const commitValue = useCallback(() => {
    if (!inputRef.current) return;
    
    const numValue = parseFloat(inputRef.current.value) || 0;
    if (numValue > 0 && numValue !== committedValueRef.current) {
      committedValueRef.current = numValue;
      onChange(productId, numValue);
    } else if (numValue <= 0 && committedValueRef.current > 0) {
      // Restore previous valid value
      inputRef.current.value = committedValueRef.current.toString();
    }
  }, [productId, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  }, []);

  return (
    <input
      ref={inputRef}
      type="number"
      min="0"
      step="0.01"
      defaultValue={initialValue > 0 ? initialValue : ''}
      onBlur={commitValue}
      onKeyDown={handleKeyDown}
      placeholder="Price"
      className="w-20 px-2 py-1 text-xs border border-slate-300 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
    />
  );
};

// COMPLETELY REWRITTEN: Input with isolated state - zero re-renders during typing
const CartQuantityInput: React.FC<{
  productId: string;
  initialValue: number;
  max: number;
  onChange: (productId: string, value: number) => void;
}> = ({ productId, initialValue, max, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const committedValueRef = useRef(initialValue);
  
  // Initialize with prop value ONCE - never updates during component lifetime
  useEffect(() => {
    if (inputRef.current && !inputRef.current.value) {
      inputRef.current.value = initialValue > 0 ? initialValue.toString() : '';
      committedValueRef.current = initialValue;
    }
  }, []);

  const commitValue = useCallback(() => {
    if (!inputRef.current) return;
    
    let numValue = parseInt(inputRef.current.value) || 0;
    
    // Enforce max constraint
    if (numValue > max) {
      numValue = max;
      inputRef.current.value = max.toString();
    }
    
    if (numValue > 0 && numValue !== committedValueRef.current) {
      committedValueRef.current = numValue;
      onChange(productId, numValue);
    } else if (numValue <= 0 && committedValueRef.current > 0) {
      // Restore previous valid value
      inputRef.current.value = committedValueRef.current.toString();
    }
  }, [productId, max, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  }, []);

  return (
    <input
      ref={inputRef}
      type="number"
      min="1"
      max={max}
      defaultValue={initialValue > 0 ? initialValue : ''}
      onBlur={commitValue}
      onKeyDown={handleKeyDown}
      placeholder="Qty"
      className="w-16 px-2 py-1 text-xs border border-slate-300 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
    />
  );
};

const DiscountInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = React.memo(({ value, onChange }) => {
  const [localValue, setLocalValue] = useState(() => value > 0 ? value.toString() : '');
  const previousValueRef = useRef(value);

  // Only sync if value changed externally (not from user typing)
  useEffect(() => {
    if (value !== previousValueRef.current && document.activeElement?.tagName !== 'INPUT') {
      setLocalValue(value > 0 ? value.toString() : '');
    }
    previousValueRef.current = value;
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    const numValue = parseFloat(newValue) || 0;
    onChange(numValue);
  };

  return (
    <input
      type="number"
      min="0"
      step="0.01"
      value={localValue}
      onChange={handleChange}
      placeholder="Enter amount"
      className="w-20 px-2 py-1 text-sm border border-slate-300 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-right"
    />
  );
});

// COMPLETELY REWRITTEN: CartItem with isolated input state - prevents re-renders
const CartItem: React.FC<{
  item: CartItem;
  itemKey: string;
  onUpdatePrice: (productId: string, price: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  formatCurrency: (amount: number) => string;
  getStockStatus: (product: Product) => StockStatus;
}> = ({ item, itemKey, onUpdatePrice, onUpdateQuantity, onRemove, formatCurrency, getStockStatus }) => {
  const stockInfo = getStockStatus(item.product);

  const handleRemove = useCallback(() => {
    onRemove(item.product.id);
  }, [onRemove, item.product.id]);

  return (
    <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
      {/* Product Icon */}
      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Package className="h-6 w-6 text-slate-400" />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h5 className="font-medium text-slate-900 text-sm leading-tight">{item.product.name}</h5>
        
        {/* SKU and Brand Info */}
        <div className="flex items-center gap-3 mt-1 mb-3">
          {item.product.sku && (
            <span className="text-xs text-slate-500">
              <span className="font-medium">SKU:</span> {item.product.sku}
            </span>
          )}
          {item.product.brands?.name && (
            <span className="text-xs text-blue-600 font-medium">
              🏷️ {item.product.brands.name}
            </span>
          )}
        </div>

        {/* Price and Quantity Controls */}
        <div className="grid grid-cols-2 gap-4">
          {/* Price Control */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600">Unit Price</label>
            <div className="flex items-center gap-2">
              <CartPriceInput
                productId={item.product.id}
                initialValue={item.price}
                onChange={onUpdatePrice}
              />
              <span className="text-xs text-slate-500">each</span>
            </div>
          </div>

          {/* Quantity Control */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600">Quantity</label>
            <div className="flex items-center gap-2">
              <CartQuantityInput
                productId={item.product.id}
                initialValue={item.quantity}
                max={item.product.stock_quantity}
                onChange={onUpdateQuantity}
              />
              <span className="text-xs text-slate-500">of {item.product.stock_quantity}</span>
            </div>
          </div>
        </div>

        {/* Stock Status */}
        <div className="mt-3">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockInfo.color}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></div>
            {stockInfo.text}
          </div>
        </div>
      </div>

      {/* Subtotal and Actions */}
      <div className="flex flex-col items-end gap-3">
        {/* Subtotal */}
        <div className="text-right">
          <div className="text-xs text-slate-500 font-medium">Subtotal</div>
          <div className="text-lg font-bold text-slate-900">{formatCurrency(item.subtotal)}</div>
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onAddToCart, formatCurrency, onEdit, onDelete }) => {
  const [inputState, setInputState] = useState({
    quantity: '1',
    customPrice: '',
    isVisible: false
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showQuantityInput = () => {
    setInputState({
      quantity: '1',
      customPrice: '',
      isVisible: true
    });
  };

  const hideQuantityInput = () => {
    setInputState(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  const handleAddToCart = () => {
    const quantity = parseInt(inputState.quantity) || 1;

    // Check if requested quantity exceeds available stock
    if (quantity > product.stock_quantity) {
      alert(`Cannot add ${quantity} units. Only ${product.stock_quantity} units available in stock.`);
      return;
    }

    const price = parseFloat(inputState.customPrice) || product.price;
    const validPrice = price < 0 ? product.price : price;

    onAddToCart(product, quantity, validPrice);
    
    // Build toast message with brand (if available), product name, and quantity
    const brandPrefix = product.brands?.name ? `${product.brands.name} - ` : '';
    const quantityText = `${quantity} ${quantity > 1 ? 'units' : 'unit'}`;
    const toastMessage = `✓ ${brandPrefix}${product.name} (${quantityText}) added to cart!`;
    
    toast.success(toastMessage, {
      position: 'top-right',
      duration: 3000,
    });
    
    hideQuantityInput();
  };

  const getStockStatus = (product: Product) => {
    const reorderLevel = product.min_stock_level || 10;
    if (product.stock_quantity === 0) {
      return { status: 'out', text: 'Out of Stock', color: 'text-red-700 shadow-lg shadow-red-200 bg-white border border-red-200' };
    } else if (product.stock_quantity <= reorderLevel) {
      return { status: 'low', text: 'Low Stock', color: 'text-yellow-700 shadow-lg shadow-yellow-200 bg-white border border-yellow-200' };
    } else {
      return { status: 'healthy', text: 'In Stock', color: 'text-green-700 shadow-lg shadow-green-200 bg-white border border-green-200' };
    }
  };

  const stockInfo = getStockStatus(product);

  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300 relative">
      <div className="flex items-center gap-4">
        {/* Product Image */}
        <div className="relative">
          <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-10 w-10 text-slate-400" />
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 text-lg">
                {product.brands?.name && product.brands.name !== '0' && product.brands.name !== 0 && (
                  <span className="text-green-600 mr-2">{product.brands.name}</span>
                )}
                {product.name}
              </h4>
              {product.sku && <p className="text-sm text-slate-600">SKU: {product.sku}</p>}
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  onClick={() => onEdit(product)}
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 gap-1.5 border-slate-300 hover:bg-blue-50 hover:border-blue-400"
                  title="Edit product"
                >
                  <Edit className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">Edit</span>
                </Button>
              )}
              {onDelete && (
                <Button
                  onClick={() => onDelete(product)}
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 gap-1.5 border-slate-300 hover:bg-red-50 hover:border-red-400"
                  title="Delete product"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-medium text-red-600">Delete</span>
                </Button>
              )}
              <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${stockInfo.color}`}>
                <div className="w-2 h-2 rounded-full bg-current opacity-75"></div>
                {stockInfo.text}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold text-slate-900">{formatCurrency(product.price)}</span>
              <span className="text-sm text-slate-600">
                Stock: {product.stock_quantity} units
              </span>
            </div>
            <div className="flex items-center gap-2 relative">
              <div className={`flex items-center gap-3 bg-blue-50 p-3 rounded-lg ${inputState.isVisible ? '' : 'hidden'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Qty:</span>
                  <input
                    type="text"
                    value={inputState.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*$/.test(value)) {
                        setInputState(prev => ({
                          ...prev,
                          quantity: value
                        }));
                      }
                    }}
                    className="w-16 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Price:</span>
                  <input
                    type="text"
                    value={inputState.customPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setInputState(prev => ({
                          ...prev,
                          customPrice: value
                        }));
                      }
                    }}
                    className="w-20 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={product.price.toString()}
                  />
                </div>
                <Button
                  onClick={handleAddToCart}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  onClick={hideQuantityInput}
                  size="sm"
                  variant="outline"
                  className="border-slate-300 hover:bg-slate-50"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Button
                onClick={() => showQuantityInput()}
                size="sm"
                className={`bg-blue-600 hover:bg-blue-700 ${inputState.isVisible ? 'hidden' : ''}`}
                disabled={stockInfo.status === 'out'}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
              
              {/* Success message that appears on product card */}
              {showSuccessMessage && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
                  <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-2xl text-sm font-semibold whitespace-nowrap">
                    {successMessage}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Product Hints */}
          {product.sales_velocity > 10 && (
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
              <ZapIcon className="h-3 w-3" />
              Fast-moving today
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

const CustomerSelector: React.FC<{
  customers: Customer[];
  loading: boolean;
  onSelectCustomer: (customer: Customer) => void;
  selectedCustomer: Customer | null;
}> = ({ customers, loading, onSelectCustomer, selectedCustomer: _selectedCustomer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.company_name && customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading Customers...
          </>
        ) : (
          <>
            <User className="h-4 w-4 mr-2" />
            Select Customer
          </>
        )}
      </Button>

      {isOpen && (
        <div className="absolute z-50 bottom-full mb-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-hidden">
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                {loading ? 'Loading customers...' : 'No customers found'}
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{customer.name}</div>
                      <div className="text-sm text-slate-600">{customer.email}</div>
                      {customer.company_name && (
                        <div className="text-xs text-slate-500">{customer.company_name}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customer.tier === 'platinum' ? 'bg-purple-100 text-purple-700' :
                        customer.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                        customer.tier === 'silver' ? 'bg-slate-100 text-slate-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {customer.tier}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          {customer.health_score}%
                        </div>
                        <div className="text-xs text-slate-500">Health</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-slate-200 bg-slate-50">
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Post-Order Completion Modal
const PostOrderModal = ({
  isOpen,
  onClose,
  orderData,
  onPrint,
  formatCurrency
}: {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    invoiceNumber: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
  } | null;
  onPrint: () => void;
  formatCurrency: (amount: number) => string;
}) => {
  if (!isOpen || !orderData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Order Completed!</h2>
            <p className="text-gray-600 mt-1">Invoice #{orderData.invoiceNumber}</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(orderData.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT (18%):</span>
              <span>{formatCurrency(orderData.taxAmount)}</span>
            </div>
            {orderData.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(orderData.discountAmount)}</span>
              </div>
            )}
            <hr />
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>{formatCurrency(orderData.total)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => {
                onClose();
                // Scroll to order history
                const orderHistorySection = document.getElementById('order-history-section');
                if (orderHistorySection) {
                  orderHistorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <History className="h-4 w-4 mr-2" />
              Go to Order History to Print Invoice
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderDetailsModal = ({
  isOpen,
  onClose,
  order,
  formatCurrency
}: {
  isOpen: boolean;
  onClose: () => void;
  order: SalesHubOrder | null;
  formatCurrency: (amount: number) => string;
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              <p className="text-gray-600">Order #{order.order_number}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Order Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Date:</span> {new Date(order.created_at).toLocaleDateString()}</p>
                <p><span className="font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </p>
                <p><span className="font-medium">Payment:</span> {order.payment_method}</p>
                {order.notes && <p><span className="font-medium">Notes:</span> {order.notes}</p>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Customer</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Customer ID:</span> {order.customer_id}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.sku && <p className="text-gray-500 text-xs">SKU: {item.sku}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(item.quantity * item.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VAT (18%):</span>
                <span>{formatCurrency(order.tax_amount)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({order.discount_type === 'percentage' ? `${order.discount_value}%` : formatCurrency(order.discount_value)}):</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={onClose}
              className="px-6"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Extracted ExpensesSection component to prevent recreation on parent renders
interface ExpensesSectionProps {
  expenses: any[];
  setExpenses: React.Dispatch<React.SetStateAction<any[]>>;
}

const ExpensesSection: React.FC<ExpensesSectionProps> = ({ expenses, setExpenses }) => {
  const { formatCurrency } = useCurrency();
  const [dateRange, setDateRange] = useState('this-month');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseKPIs, setExpenseKPIs] = useState({
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    topCategory: 'N/A',
    recurringExpenses: 0,
    unpaidExpenses: 0,
    taxRelated: 0,
    cashFlowRisk: 'Low'
  });
  const [expenseAIInsights, setExpenseAIInsights] = useState<string[]>([]);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [showAIInsightsModal, setShowAIInsightsModal] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form state
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Miscellaneous',
    paymentMethod: 'Cash',
    status: 'Paid',
    vendor: '',
    linkedTo: '',
    linkType: '',
    notes: '',
    isRecurring: false,
    frequency: 'Monthly',
    nextDueDate: '',
    receipt: null as File | null
  });

  // Default categories as fallback
  const defaultCategories = [
    'Rent', 'Salaries', 'Transport/Fuel', 'Inventory Purchase', 
    'Packaging', 'Marketing/Ads', 'Utilities', 'Internet & Airtime',
    'Equipment Repair', 'Taxes & Licenses', 'Loan Repayment', 'Miscellaneous'
  ];

  // Load categories from database
  const [dbCategories, setDbCategories] = React.useState<string[]>(defaultCategories);
  const expenseCategories = [...new Set([...dbCategories, ...customCategories])]; // Remove duplicates

  const loadExpenseCategories = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDbCategories(defaultCategories); // Fallback if not logged in
        return;
      }

      // Get user's company_id
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) {
        setDbCategories(defaultCategories); // Fallback if no company
        return;
      }

      // Load categories (default + custom) - filtered by company_id via RLS
      // Adding explicit OR filter as safeguard: is_default=true OR company_id matches
      const { data: categories, error } = await supabase
        .from('expense_categories')
        .select('name')
        .or(`is_default.eq.true,company_id.eq.${userData.company_id}`)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading categories:', error);
        setDbCategories(defaultCategories); // Fallback on error
        return;
      }

      if (categories && categories.length > 0) {
        setDbCategories(categories.map(c => c.name));
      } else {
        setDbCategories(defaultCategories); // Fallback if no categories in DB
      }
    } catch (error) {
      console.error('Error loading expense categories:', error);
      setDbCategories(defaultCategories); // Fallback on exception
    }
  }, []);

  const handleAddCustomCategory = async () => {
    if (newCategoryName.trim() && !expenseCategories.includes(newCategoryName.trim())) {
      const newCategory = newCategoryName.trim();
      
      try {
        // Get current user and company
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please log in to add categories');
          return;
        }

        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single();

        // Save to database (company_id optional)
        const { error } = await supabase
          .from('expense_categories')
          .insert([{
            name: newCategory,
            company_id: userData?.company_id || null,
            is_default: false
          }]);

        if (error) {
          console.error('Error adding category:', error);
          toast.error('Failed to add category');
          return;
        }

        setCustomCategories([...customCategories, newCategory]);
        setExpenseForm({ ...expenseForm, category: newCategory });
        setNewCategoryName('');
        setShowAddCategoryInput(false);
        toast.success(`Category "${newCategory}" added successfully!`);
        
        // Reload categories
        loadExpenseCategories();
      } catch (error) {
        console.error('Error adding custom category:', error);
        toast.error('Failed to add category');
      }
    } else if (expenseCategories.includes(newCategoryName.trim())) {
      toast.error('This category already exists');
    } else {
      toast.error('Please enter a category name');
    }
  };

  const loadExpensesData = useCallback(async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to view expenses');
        return;
      }

      // Calculate date range
      let endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      let startDate = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'yesterday':
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this-week':
          startDate.setDate(startDate.getDate() - startDate.getDay());
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'last-week':
          const lastWeekEnd = new Date();
          lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay() - 1);
          lastWeekEnd.setHours(23, 59, 59, 999);
          endDate = lastWeekEnd;
          startDate = new Date(lastWeekEnd);
          startDate.setDate(startDate.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'this-month':
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'last-30-days':
          startDate.setDate(startDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'january':
          startDate = new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 0, 31, 23, 59, 59, 999);
          break;
        case 'february':
          startDate = new Date(new Date().getFullYear(), 1, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 1, 28, 23, 59, 59, 999);
          // Handle leap year
          if (new Date().getFullYear() % 4 === 0) endDate.setDate(29);
          break;
        case 'march':
          startDate = new Date(new Date().getFullYear(), 2, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 2, 31, 23, 59, 59, 999);
          break;
        case 'april':
          startDate = new Date(new Date().getFullYear(), 3, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 3, 30, 23, 59, 59, 999);
          break;
        case 'may':
          startDate = new Date(new Date().getFullYear(), 4, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 4, 31, 23, 59, 59, 999);
          break;
        case 'june':
          startDate = new Date(new Date().getFullYear(), 5, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 5, 30, 23, 59, 59, 999);
          break;
        case 'july':
          startDate = new Date(new Date().getFullYear(), 6, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 6, 31, 23, 59, 59, 999);
          break;
        case 'august':
          startDate = new Date(new Date().getFullYear(), 7, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 7, 31, 23, 59, 59, 999);
          break;
        case 'september':
          startDate = new Date(new Date().getFullYear(), 8, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 8, 30, 23, 59, 59, 999);
          break;
        case 'october':
          startDate = new Date(new Date().getFullYear(), 9, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 9, 31, 23, 59, 59, 999);
          break;
        case 'november':
          startDate = new Date(new Date().getFullYear(), 10, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 10, 30, 23, 59, 59, 999);
          break;
        case 'december':
          startDate = new Date(new Date().getFullYear(), 11, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        case 'q1':
          startDate = new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 2, 31, 23, 59, 59, 999);
          break;
        case 'q2':
          startDate = new Date(new Date().getFullYear(), 3, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 5, 30, 23, 59, 59, 999);
          break;
        case 'q3':
          startDate = new Date(new Date().getFullYear(), 6, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 8, 30, 23, 59, 59, 999);
          break;
        case 'q4':
          startDate = new Date(new Date().getFullYear(), 9, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        case 'this-year':
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'last-year':
          startDate = new Date(new Date().getFullYear() - 1, 0, 1, 0, 0, 0, 0);
          endDate = new Date(new Date().getFullYear() - 1, 11, 31, 23, 59, 59, 999);
          break;
        case 'custom':
          // Custom date range will be handled separately
          // For now, default to this month
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
      }

      // Get user's company_id for filtering
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) {
        console.error('⚠️ User has no company_id - cannot load expenses');
        toast.error('Account setup incomplete. Please contact support.');
        return;
      }

      // Build query with filters - explicitly filter by company_id for data isolation
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('company_id', userData.company_id)
        .gte('expense_date', startDate.toISOString().split('T')[0])
        .lte('expense_date', endDate.toISOString().split('T')[0])
        .order('expense_date', { ascending: false });

      // Apply category filter
      if (categoryFilter !== 'all') {
        query = query.eq('category_name', categoryFilter);
      }

      // Apply payment method filter
      if (paymentMethodFilter !== 'all') {
        query = query.eq('payment_method', paymentMethodFilter);
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: expensesData, error } = await query;

      if (error) {
        console.error('Error loading expenses:', error);
        toast.error('Failed to load expenses');
        return;
      }

      // Transform database records to match UI format
      const processedExpenses = (expensesData || []).map(expense => ({
        id: expense.id,
        title: expense.title,
        amount: expense.amount,
        date: expense.expense_date,
        category: expense.category_name || 'Miscellaneous',
        paymentMethod: expense.payment_method,
        vendor: expense.vendor_name || '',
        status: expense.status,
        notes: expense.notes || '',
        linkedTo: expense.linked_to_name || '',
        isRecurring: expense.is_recurring || false,
        frequency: expense.recurrence_frequency || 'Monthly',
        nextDueDate: expense.next_due_date || ''
      }));

      setExpenses(processedExpenses);

      // Calculate KPIs
      const totalExpenses = processedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      
      // Fetch total sales for profit calculation
      const { data: salesData } = await supabase
        .from('sales_hub_orders')
        .select('total_amount')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const totalSales = salesData?.reduce((sum, s) => sum + s.total_amount, 0) || 0;
      const netProfit = totalSales - totalExpenses;
      const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100) : 0;

      // Category breakdown
      const categoryTotals = processedExpenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
      }, {} as Record<string, number>);

      const topCategory = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'N/A';

      const recurringExpenses = processedExpenses.filter(e => e.isRecurring).reduce((sum, e) => sum + Number(e.amount), 0);
      const unpaidExpenses = processedExpenses.filter(e => e.status === 'Pending').reduce((sum, e) => sum + Number(e.amount), 0);
      const taxRelated = processedExpenses.filter(e => e.category === 'Taxes & Licenses').reduce((sum, e) => sum + Number(e.amount), 0);

      // Calculate cash flow risk
      let cashFlowRisk = 'Low';
      if (profitMargin < 10) cashFlowRisk = 'High';
      else if (profitMargin < 25) cashFlowRisk = 'Medium';

      setExpenseKPIs({
        totalExpenses,
        netProfit,
        profitMargin,
        topCategory,
        recurringExpenses,
        unpaidExpenses,
        taxRelated,
        cashFlowRisk
      });

      // Generate AI Insights
      const insights: string[] = [];
      
      if (categoryTotals['Transport/Fuel'] && categoryTotals['Transport/Fuel'] > totalExpenses * 0.2) {
        insights.push(`🚗 Your transport costs increased and now represent ${((categoryTotals['Transport/Fuel'] / totalExpenses) * 100).toFixed(0)}% of total expenses. Consider route optimization.`);
      }
      
      if (categoryTotals['Packaging']) {
        insights.push(`📦 You spent ${formatCurrency(categoryTotals['Packaging'])} on packaging. Consider bulk supplier negotiations for better rates.`);
      }
      
      if (profitMargin < 25) {
        insights.push(`⚠️ Net profit margin is ${profitMargin.toFixed(1)}%. Recommended minimum is 25% for sustainable growth.`);
      }
      
      if (unpaidExpenses > 0) {
        insights.push(`💰 You have ${formatCurrency(unpaidExpenses)} in unpaid expenses. Settle pending bills to maintain good supplier relationships.`);
      }

      if (netProfit < 0) {
        insights.push(`❌ Negative cash flow detected. Expenses (${formatCurrency(totalExpenses)}) exceed sales (${formatCurrency(totalSales)}). Review spending urgently.`);
      }

      setExpenseAIInsights(insights);

    } catch (error) {
      console.error('Error loading expenses data:', error);
      toast.error('Failed to load expenses data');
    }
  }, [dateRange, categoryFilter, paymentMethodFilter, statusFilter, formatCurrency, setExpenses]);

  useEffect(() => {
    loadExpensesData();
  }, [loadExpensesData]);

  useEffect(() => {
    loadExpenseCategories();
  }, [loadExpenseCategories]);

  const handleAddExpense = async () => {
    try {
      if (!expenseForm.title || !expenseForm.amount) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Get current user for company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to add expenses');
        return;
      }

      // Get user's company_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      // Prepare expense data for database (company_id optional)
      const expenseData = {
        title: expenseForm.title,
        amount: parseFloat(expenseForm.amount),
        expense_date: expenseForm.date,
        category_name: expenseForm.category,
        payment_method: expenseForm.paymentMethod,
        status: expenseForm.status,
        vendor_name: expenseForm.vendor || null,
        linked_to_name: expenseForm.linkedTo || null,
        notes: expenseForm.notes || null,
        is_recurring: expenseForm.isRecurring,
        recurrence_frequency: expenseForm.isRecurring ? expenseForm.frequency : null,
        next_due_date: expenseForm.isRecurring ? expenseForm.nextDueDate : null,
        created_by: user.id,
        company_id: userData?.company_id || null
      };

      if (editingExpense) {
        // Update existing expense
        const { error: updateError } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id);

        if (updateError) {
          console.error('Error updating expense:', updateError);
          toast.error('Failed to update expense');
          return;
        }

        toast.success('Expense updated successfully!');
      } else {
        // Create new expense
        const { error: insertError } = await supabase
          .from('expenses')
          .insert([expenseData]);

        if (insertError) {
          console.error('Error adding expense:', insertError);
          toast.error('Failed to add expense');
          return;
        }

        toast.success('Expense added successfully!');
      }

      setShowAddExpenseModal(false);
      setEditingExpense(null);
      
      // Reset form
      setExpenseForm({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Miscellaneous',
        paymentMethod: 'Cash',
        status: 'Paid',
        vendor: '',
        linkedTo: '',
        linkType: '',
        notes: '',
        isRecurring: false,
        frequency: 'Monthly',
        nextDueDate: '',
        receipt: null
      });
      
      // Reload data to update KPIs
      loadExpensesData();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        console.error('Error deleting expense:', error);
        toast.error('Failed to delete expense');
        return;
      }

      toast.success('Expense deleted successfully');
      loadExpensesData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleDownloadReport = () => {
    try {
      const reportDate = new Date().toLocaleDateString();
      const reportTime = new Date().toLocaleTimeString();
      
      // Create PDF-ready HTML content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow pop-ups to download the report');
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Expenses Report - COPCCA CRM</title>
            <style>
              @media print {
                @page { margin: 1cm; }
                body { margin: 0; }
              }
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px;
                max-width: 1200px;
                margin: 20px auto;
                background: white;
                color: #1e293b;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 3px solid #2563eb;
              }
              .company-name {
                font-size: 28px;
                font-weight: bold;
                color: #1e40af;
                margin-bottom: 5px;
              }
              .report-title {
                font-size: 22px;
                color: #334155;
                margin: 10px 0;
              }
              .report-info {
                font-size: 14px;
                color: #64748b;
                margin-top: 10px;
              }
              .kpi-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin-bottom: 30px;
              }
              .kpi-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
              }
              .kpi-label {
                font-size: 12px;
                color: #64748b;
                text-transform: uppercase;
                font-weight: 600;
                margin-bottom: 8px;
              }
              .kpi-value {
                font-size: 20px;
                font-weight: bold;
                color: #1e293b;
              }
              .kpi-value.positive { color: #16a34a; }
              .kpi-value.negative { color: #dc2626; }
              .kpi-value.warning { color: #ea580c; }
              .section-title {
                font-size: 18px;
                font-weight: bold;
                color: #1e293b;
                margin: 30px 0 15px 0;
                padding-bottom: 8px;
                border-bottom: 2px solid #e2e8f0;
              }
              .expenses-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                font-size: 13px;
              }
              .expenses-table th {
                background: #f1f5f9;
                border: 1px solid #e2e8f0;
                padding: 12px 8px;
                text-align: left;
                font-weight: 600;
                color: #475569;
              }
              .expenses-table td {
                border: 1px solid #e2e8f0;
                padding: 10px 8px;
                color: #334155;
              }
              .expenses-table tr:nth-child(even) {
                background: #f8fafc;
              }
              .status-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
              }
              .status-paid { background: #dcfce7; color: #166534; }
              .status-pending { background: #fef3c7; color: #854d0e; }
              .status-recurring { background: #dbeafe; color: #1e40af; }
              .insights-section {
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                border-radius: 8px;
                padding: 20px;
                margin-top: 30px;
              }
              .insight-item {
                background: white;
                border-left: 4px solid #3b82f6;
                padding: 12px;
                margin-bottom: 10px;
                border-radius: 4px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #e2e8f0;
                text-align: center;
                color: #64748b;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">COPCCA CRM</div>
              <div class="report-title">💰 Expenses Report</div>
              <div class="report-info">
                Generated: ${reportDate} ${reportTime} | Period: ${dateRange}
              </div>
            </div>

            <div class="section-title">Financial Summary</div>
            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-label">Total Expenses</div>
                <div class="kpi-value negative">${formatCurrency(expenseKPIs.totalExpenses)}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Net Profit</div>
                <div class="kpi-value ${expenseKPIs.netProfit >= 0 ? 'positive' : 'negative'}">${formatCurrency(expenseKPIs.netProfit)}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Profit Margin</div>
                <div class="kpi-value ${expenseKPIs.profitMargin >= 25 ? 'positive' : expenseKPIs.profitMargin >= 10 ? 'warning' : 'negative'}">${expenseKPIs.profitMargin.toFixed(1)}%</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Top Category</div>
                <div class="kpi-value">${expenseKPIs.topCategory}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Recurring Expenses</div>
                <div class="kpi-value">${formatCurrency(expenseKPIs.recurringExpenses)}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Unpaid Expenses</div>
                <div class="kpi-value ${expenseKPIs.unpaidExpenses > 0 ? 'warning' : ''}">${formatCurrency(expenseKPIs.unpaidExpenses)}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Tax-Related</div>
                <div class="kpi-value">${formatCurrency(expenseKPIs.taxRelated)}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Cash Flow Risk</div>
                <div class="kpi-value ${expenseKPIs.cashFlowRisk === 'Low' ? 'positive' : expenseKPIs.cashFlowRisk === 'Medium' ? 'warning' : 'negative'}">${expenseKPIs.cashFlowRisk}</div>
              </div>
            </div>

            <div class="section-title">Expense Details</div>
            <table class="expenses-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Expense Name</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Vendor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${expenses.map(expense => `
                  <tr>
                    <td>${new Date(expense.date).toLocaleDateString()}</td>
                    <td>
                      <strong>${expense.title}</strong>
                      ${expense.notes ? `<br/><small style="color: #64748b;">${expense.notes}</small>` : ''}
                    </td>
                    <td>${expense.category}</td>
                    <td><strong>${formatCurrency(expense.amount)}</strong></td>
                    <td>${expense.paymentMethod}</td>
                    <td>${expense.vendor || '-'}</td>
                    <td>
                      <span class="status-badge status-${expense.status.toLowerCase()}">
                        ${expense.status}${expense.isRecurring ? ' (R)' : ''}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            ${expenseAIInsights.length > 0 ? `
              <div class="section-title">AI Insights & Recommendations</div>
              <div class="insights-section">
                ${expenseAIInsights.map(insight => `
                  <div class="insight-item">
                    ${insight}
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <div class="footer">
              <strong>COPCCA CRM</strong> - Business Intelligence & Expense Management<br/>
              This report is confidential and intended for internal use only.
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          toast.success('PDF report ready! Use "Save as PDF" in the print dialog.');
        }, 250);
      };
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">💰 Expenses</h3>
          <p className="text-slate-600">Track business spending, cash flow, and profit</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddExpenseModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Advanced Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <optgroup label="Quick Filters">
                  <option value="today">📅 Today</option>
                  <option value="yesterday">📅 Yesterday</option>
                  <option value="this-week">📅 This Week</option>
                  <option value="last-week">📅 Last Week</option>
                  <option value="this-month">📅 This Month</option>
                  <option value="last-30-days">📅 Last 30 Days</option>
                </optgroup>
                <optgroup label="Monthly">
                  <option value="january">January</option>
                  <option value="february">February</option>
                  <option value="march">March</option>
                  <option value="april">April</option>
                  <option value="may">May</option>
                  <option value="june">June</option>
                  <option value="july">July</option>
                  <option value="august">August</option>
                  <option value="september">September</option>
                  <option value="october">October</option>
                  <option value="november">November</option>
                  <option value="december">December</option>
                </optgroup>
                <optgroup label="Quarterly">
                  <option value="q1">Q1 (Jan-Mar)</option>
                  <option value="q2">Q2 (Apr-Jun)</option>
                  <option value="q3">Q3 (Jul-Sep)</option>
                  <option value="q4">Q4 (Oct-Dec)</option>
                </optgroup>
                <optgroup label="Yearly">
                  <option value="this-year">This Year</option>
                  <option value="last-year">Last Year</option>
                </optgroup>
                <optgroup label="Custom">
                  <option value="custom">📆 Custom Range</option>
                </optgroup>
              </select>
              {dateRange === 'custom' && (
                <div className="col-span-2 grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">From</label>
                    <input
                      type="date"
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        // Handle custom date start
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">To</label>
                    <input
                      type="date"
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        // Handle custom date end
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {dbCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              {customCategories.length > 0 && (
                <optgroup label="Custom Categories">
                  {customCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Bank">Bank Transfer</option>
              <option value="Credit">Credit</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Recurring">Recurring</option>
            </select>
          </div>
        </div>
      </Card>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-slate-600 mb-1">Total Expenses</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(expenseKPIs.totalExpenses)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600 mb-1">Net Profit</div>
          <div className={`text-2xl font-bold ${expenseKPIs.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(expenseKPIs.netProfit)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600 mb-1">Profit Margin</div>
          <div className={`text-2xl font-bold ${expenseKPIs.profitMargin >= 25 ? 'text-green-600' : expenseKPIs.profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
            {expenseKPIs.profitMargin.toFixed(1)}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600 mb-1">Top Category</div>
          <div className="text-lg font-bold text-slate-900 truncate">{expenseKPIs.topCategory}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-slate-600 mb-1">Recurring Expenses</div>
          <div className="text-xl font-bold text-blue-600">{formatCurrency(expenseKPIs.recurringExpenses)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600 mb-1">Unpaid Expenses</div>
          <div className="text-xl font-bold text-orange-600">{formatCurrency(expenseKPIs.unpaidExpenses)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600 mb-1">Tax-Related</div>
          <div className="text-xl font-bold text-purple-600">{formatCurrency(expenseKPIs.taxRelated)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600 mb-1">Cash Flow Risk</div>
          <div className={`text-xl font-bold ${expenseKPIs.cashFlowRisk === 'Low' ? 'text-green-600' : expenseKPIs.cashFlowRisk === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
            {expenseKPIs.cashFlowRisk}
          </div>
        </Card>
      </div>

      {/* AI Insights Panel */}
      {expenseAIInsights.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Insights & Recommendations
          </h4>
          <div className="space-y-2">
            {expenseAIInsights.map((insight, idx) => (
              <div key={idx} className="text-sm text-slate-700 bg-white p-3 rounded-lg">
                {insight}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Expense List */}
      <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Expense Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Category</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Payment</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Vendor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{expense.title}</div>
                      {expense.notes && <div className="text-xs text-slate-500">{expense.notes}</div>}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{expense.category}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{expense.paymentMethod}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{expense.vendor || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        expense.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        expense.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {expense.status}
                        {expense.isRecurring && ' (R)'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-3 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                          onClick={() => {
                            setEditingExpense(expense);
                            setExpenseForm(expense);
                            setShowAddExpenseModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-3 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {expenses.length === 0 && (
            <div className="text-center py-12">
              <Banknote className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No expenses found. Click "Add Expense" to get started.</p>
            </div>
          )}
        </Card>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddExpenseModal(false);
                    setEditingExpense(null);
                    setShowAddCategoryInput(false);
                    setNewCategoryName('');
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Section A: Basic Info */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Expense Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={expenseForm.title}
                        onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Office Rent, Marketing Campaign"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Amount (TZS) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      {!showAddCategoryInput ? (
                        <select
                          value={expenseForm.category}
                          onChange={(e) => {
                            if (e.target.value === '+ Add New Category') {
                              setShowAddCategoryInput(true);
                            } else {
                              setExpenseForm({ ...expenseForm, category: e.target.value });
                            }
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          {expenseCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="+ Add New Category" className="text-blue-600 font-semibold">
                            ➕ Add New Category
                          </option>
                        </select>
                      ) : (
                        <div className="w-full px-3 py-2 border border-blue-300 rounded-md bg-blue-50">
                          <span className="text-blue-600 font-medium">Adding new category...</span>
                        </div>
                      )}
                      
                      {showAddCategoryInput && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            New Category Name
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddCustomCategory();
                                }
                              }}
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g. Office Supplies, Training"
                            />
                            <Button
                              onClick={handleAddCustomCategory}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              size="sm"
                            >
                              Add
                            </Button>
                            <Button
                              onClick={() => {
                                setShowAddCategoryInput(false);
                                setNewCategoryName('');
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section B: Payment Info */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3">Payment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                      <select
                        value={expenseForm.paymentMethod}
                        onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Cash">Cash</option>
                        <option value="M-Pesa">M-Pesa</option>
                        <option value="Bank">Bank Transfer</option>
                        <option value="Credit">Credit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select
                        value={expenseForm.status}
                        onChange={(e) => setExpenseForm({ ...expenseForm, status: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Vendor/Supplier</label>
                      <input
                        type="text"
                        value={expenseForm.vendor}
                        onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="Vendor name"
                      />
                    </div>
                  </div>
                </div>

                {/* Section C: Business Link */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3">Business Link (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Link To</label>
                      <input
                        type="text"
                        value={expenseForm.linkedTo}
                        onChange={(e) => setExpenseForm({ ...expenseForm, linkedTo: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="Product, Campaign, Supplier, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Section D: Recurring */}
                <div>
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={expenseForm.isRecurring}
                      onChange={(e) => setExpenseForm({ ...expenseForm, isRecurring: e.target.checked })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="font-semibold text-slate-700">Recurring Expense?</span>
                  </label>
                  {expenseForm.isRecurring && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                        <select
                          value={expenseForm.frequency}
                          onChange={(e) => setExpenseForm({ ...expenseForm, frequency: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Quarterly">Quarterly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Next Due Date</label>
                        <input
                          type="date"
                          value={expenseForm.nextDueDate}
                          onChange={(e) => setExpenseForm({ ...expenseForm, nextDueDate: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Section E: Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleAddExpense}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddExpenseModal(false);
                    setEditingExpense(null);
                    setShowAddCategoryInput(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Modal */}
      {showAIInsightsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">AI Insights & Recommendations</h3>
                    <p className="text-sm text-slate-600">{expenseAIInsights.length} insights detected</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIInsightsModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {expenseAIInsights.map((insight, idx) => {
                  const isWarning = insight.includes('⚠️') || insight.includes('❌');
                  const isAction = insight.includes('💰') || insight.includes('📦');
                  const isPositive = insight.includes('✅');
                  
                  return (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-lg border-l-4 ${
                        isWarning ? 'bg-red-50 border-red-500' :
                        isAction ? 'bg-yellow-50 border-yellow-500' :
                        isPositive ? 'bg-green-50 border-green-500' :
                        'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-slate-800 leading-relaxed">{insight}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAIInsightsModal(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SalesHub: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const user = useAuthStore((state) => state.user);
  
  // Restore active subsection from localStorage on mount (for page refresh persistence)
  const [activeSubsection, setActiveSubsection] = useState<Subsection>(() => {
    const saved = localStorage.getItem('salesHubCurrentSubsection');
    const validSubsections: Subsection[] = ['products', 'carts-invoice', 'order-history', 'inventory-status', 'customer-buying-patterns', 'expenses', 'product-stocking-history', 'stock-transfers'];
    if (saved && validSubsections.includes(saved as Subsection)) {
      console.log('🔄 Restoring subsection from page refresh:', saved);
      return saved as Subsection;
    }
    return 'products';
  });
  
  // Instant loading with optimistic cache - zero spinners
  // ✨ INSTANT OPTIMISTIC CACHES - Zero loading spinners everywhere
  const { 
    data: rawProducts, 
    reload: reloadProducts,
    update: updateProduct,
    delete: deleteProductFromCache,
    create: createProduct
  } = useOptimisticCache<Product>({
    table: 'products',
    query: 'id, name, sku, price, stock_quantity, min_stock_level, category_id, brand_id, location_id, image_url, cost_price, brands(id, name), categories(id, name), location:locations(id, name, type)',
    queryFilters: user?.id ? [{ column: 'created_by', operator: 'eq', value: user.id }] : [],
    orderBy: { column: 'name', ascending: true },
  });
  
  const { data: rawCustomers } = useOptimisticCache<any>({
    table: 'companies',
    query: '*',
    queryFilters: user?.id ? [
      { column: 'is_own_company', operator: 'eq', value: false },
      { column: 'created_by', operator: 'eq', value: user.id }
    ] : [{ column: 'is_own_company', operator: 'eq', value: false }],
    orderBy: { column: 'name', ascending: true },
  });

  const { 
    data: categories, 
    create: createCategory 
  } = useOptimisticCache<any>({
    table: 'categories',
    query: 'id, name, description',
    queryFilters: user?.id ? [{ column: 'created_by', operator: 'eq', value: user.id }] : [],
    orderBy: { column: 'name', ascending: true },
  });

  const { 
    data: brands, 
    create: createBrand 
  } = useOptimisticCache<any>({
    table: 'brands',
    query: 'id, name, description',
    orderBy: { column: 'name', ascending: true },
  });
  
  // Transform raw data to expected formats
  const products = rawProducts.map(product => ({
    ...product,
    brands: Array.isArray(product.brands) && product.brands.length > 0 ? product.brands[0] : (product.brands || undefined),
    categories: Array.isArray(product.categories) && product.categories.length > 0 ? product.categories[0] : (product.categories || undefined),
    location: Array.isArray(product.location) && product.location.length > 0 ? product.location[0] : (product.location || undefined),
    sales_velocity: 0
  })) as Product[];
  
  const customers: Customer[] = rawCustomers.map((company: any) => ({
    id: company.id,
    customer_id: company.id,
    name: company.name,
    company_name: company.name,
    email: company.email || '',
    phone: company.phone || '',
    mobile: company.phone || '',
    tier: company.subscription_plan || 'bronze',
    health_score: company.health_score || 50,
    churn_risk: 'low',
    upsell_potential: 'medium',
    lifetime_value: company.annual_revenue || 0,
    outstanding_balance: 0,
    preferred_payment: 'bank_transfer',
    status: company.status,
    total_orders: 0,
    last_order_date: undefined,
    tags: []
  }));
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // Use persistent store for cart and customer data - OPTIMIZED with shallow comparison
  const {
    cart,
    selectedCustomer,
    clearCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    setSelectedCustomer,
    getCartTotal,
    clearDemoData,
  } = useSalesHubStore(
    (state) => ({
      cart: state.cart,
      selectedCustomer: state.selectedCustomer,
      clearCart: state.clearCart,
      addToCart: state.addToCart,
      updateCartItem: state.updateCartItem,
      removeFromCart: state.removeFromCart,
      setSelectedCustomer: state.setSelectedCustomer,
      getCartTotal: state.getCartTotal,
      clearDemoData: state.clearDemoData,
    }),
    shallow
  );

  // Discount and payment method state for Order Summary
  const [discountType, setDiscountType] = useState<'percentage' | 'monetary'>('percentage');
  const [customerSelectionMode, setCustomerSelectionMode] = useState<'walk-in' | 'select'>('walk-in');
  const [committedDiscountPercent, setCommittedDiscountPercent] = useState<number>(0);
  const [committedDiscountAmount, setCommittedDiscountAmount] = useState<number>(0);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [customDueDate, setCustomDueDate] = useState<string>('');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  
  // Warehouse/Location selection state
  const [locations, setLocations] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('main-store');

  // VAT type selection state
  const [vatType, setVatType] = useState<'inclusive' | 'exclusive'>('exclusive');

  // Tax rate constant (18% VAT for Tanzania)
  const taxRate = 0.18;

  // Auto-switch to select mode when customer is selected
  useEffect(() => {
    if (selectedCustomer && customerSelectionMode === 'walk-in') {
      setCustomerSelectionMode('select');
    }
  }, [selectedCustomer, customerSelectionMode]);

  // Post-order completion modal state
  const [showPostOrderModal, setShowPostOrderModal] = useState(false);
  const [completedOrderData, setCompletedOrderData] = useState<{
    invoiceNumber: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
  } | null>(null);

  // Order details modal state
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<SalesHubOrder | null>(null);

  // Stock validation modal state
  const [showStockValidationModal, setShowStockValidationModal] = useState(false);
  const [stockValidationErrors, setStockValidationErrors] = useState<Array<{
    productName: string;
    sku: string;
    brand: string;
    warehouse: string;
    needed: number;
    available: number;
  }>>([]);

  // Company payment info for invoice
  const [companyPaymentInfo, setCompanyPaymentInfo] = useState({
    m_pesa: { paybill: '', account: '' },
    bank_transfer: { account: '', bank: '' },
    cash_payment: { accepted_at: '', hours: '' }
  });

  // Company information for invoice
  const [companyInfo, setCompanyInfo] = useState({
    name: 'COPCCA CRM',
    address: 'Business Address',
    city: 'City',
    country: 'Country',
    phone: '+255 XXX XXX XXX',
    email: 'info@copcca.com',
    tin: '123456789'
  });
  const [showCompanySettingsModal, setShowCompanySettingsModal] = useState(false);
  const [isSavingCompanyInfo, setIsSavingCompanyInfo] = useState(false);

  // Load company info and locations from database on mount
  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (userData?.company_id) {
          // Load company info
          const { data: companyData } = await supabase
            .from('companies')
            .select('name, address, city, country, phone, email, tin')
            .eq('id', userData.company_id)
            .single();

          if (companyData) {
            setCompanyInfo({
              name: companyData.name || 'COPCCA CRM',
              address: companyData.address || 'Business Address',
              city: companyData.city || 'City',
              country: companyData.country || 'Country',
              phone: companyData.phone || '+255 XXX XXX XXX',
              email: companyData.email || 'info@copcca.com',
              tin: companyData.tin || '123456789'
            });
          }
          
          // Load locations/warehouses
          const { data: locationsData } = await supabase
            .from('locations')
            .select('id, name, type')
            .eq('company_id', userData.company_id)
            .eq('status', 'active')
            .order('name');
            
          if (locationsData && locationsData.length > 0) {
            setLocations(locationsData);
            // Set first location as default
            setSelectedWarehouse(locationsData[0].id);
          } else {
            // If no locations, keep 'main-store' as default
            setLocations([]);
          }
        }
      } catch (error) {
        // Don't log AbortErrors - they're expected during navigation/remounts
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error loading company info:', error);
        }
      }
    };
    loadCompanyInfo();
  }, []);

  // Save company info to database
  const handleSaveCompanyInfo = async () => {
    setIsSavingCompanyInfo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (userData?.company_id) {
        const { error } = await supabase
          .from('companies')
          .update({
            name: companyInfo.name,
            address: companyInfo.address,
            city: companyInfo.city,
            country: companyInfo.country,
            phone: companyInfo.phone,
            email: companyInfo.email,
            tin: companyInfo.tin,
            updated_at: new Date().toISOString()
          })
          .eq('id', userData.company_id);

        if (error) throw error;
        toast.success('Company information updated successfully!');
        setShowCompanySettingsModal(false);
      }
    } catch (error) {
      console.error('Error saving company info:', error);
      toast.error('Failed to save company information');
    } finally {
      setIsSavingCompanyInfo(false);
    }
  };

  // Restock modal state
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number | ''>('');
  const [restockPurchaseCost, setRestockPurchaseCost] = useState('');
  const [restockLocation, setRestockLocation] = useState('');
  const [isRestocking, setIsRestocking] = useState(false);

  // Order history state
  const [orderHistory, setOrderHistory] = useState<SalesHubOrder[]>([]);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');

  // Format date with relative day names and time
  const formatOrderDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get time in HH:MM format
    const timeString = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: false 
    });
    
    // Get month name, day, and year
    const monthName = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    const fullDate = `${monthName} ${day} ${year}, ${timeString}`;
    
    // Check if today
    if (date.toDateString() === today.toDateString()) {
      return `Today ${fullDate}`;
    }
    
    // Check if yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${fullDate}`;
    }
    
    // Get day name (MONDAY, TUESDAY, etc.)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    return `${dayName} ${fullDate}`;
  };

  // Add product modal state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: '',
    sku: '',
    price: '' as number | '',
    cost_price: '' as number | '',
    stock_quantity: '' as number | '',
    min_stock_level: '' as number | '',
    brand_id: '',
    category_id: '' as string,
    location_id: '',
    image_url: ''
  });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string>('');
  
  // COGS tracking preference (persistent across sessions)
  const [cogsTrackingEnabled, setCogsTrackingEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('cogsTrackingEnabled');
    return saved === 'true';
  });

  // Edit product modal state
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [editProductData, setEditProductData] = useState({
    name: '',
    sku: '',
    price: '' as number | '',
    stock_quantity: '' as number | '',
    min_stock_level: '' as number | '',
    brand_id: '',
    category_id: '' as string,
    image_url: ''
  });
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>('');

  // Categories UI state (data comes from optimistic cache above)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    description: ''
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Brands UI state (data comes from optimistic cache above)
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [newBrandData, setNewBrandData] = useState({
    name: '',
    description: ''
  });
  const [isAddingBrand, setIsAddingBrand] = useState(false);

  // Promotion modal state
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedProductForPromotion, setSelectedProductForPromotion] = useState<Product | null>(null);
  const [promotionData, setPromotionData] = useState({
    name: '',
    description: '',
    type: 'paid_ads' as 'email' | 'social' | 'paid_ads' | 'content' | 'event' | 'webinar',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '' as number | '',
    budget: '' as number | '',
    start_date: '',
    end_date: '',
    target_audience: ''
  });
  const [isCreatingPromotion, setIsCreatingPromotion] = useState(false);

  const [userSubscriptionPlan, setUserSubscriptionPlan] = useState<string>('starter');
  const [userLocations, setUserLocations] = useState<Array<{
    id: string;
    name: string;
    type: 'pos' | 'inventory';
  }>>([]);

  // Refs for focus management - removed to prevent focus jumping
  // const quantityInputRef = useRef<HTMLInputElement>(null);
  // const priceInputRef = useRef<HTMLInputElement>(null);

  // Enhanced KPIs - loaded from real data
  const [todaySnapshot, setTodaySnapshot] = useState({
    salesToday: 0,
    salesChange: 0,
    expensesToday: 0,
    expensesChange: 0,
    netRevenue: 0,
    netRevenueChange: 0,
    invoicesPending: 0,
    invoicesOverdue: 0,
    lowStockItems: 0,
    criticalStockItems: 0,
    aiOpportunityScore: 0
  });

  // Dashboard date filter - Removed with Updates section
  // const [dashboardDateRange, setDashboardDateRange] = useState('today');

  // Expenses data - accessible across sections
  const [expenses, setExpenses] = useState<any[]>([]);

  // AI Insights data - Removed with Updates section
  // const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  // const kpisLoadedRef = useRef(false);

  const loadOrderHistory = useCallback(async () => {
    try {
      console.log('🔄 Loading order history from database...');
      const { data, error } = await supabase
        .from('sales_hub_orders')
        .select(`
          *,
          sales_hub_customers (
            id,
            name,
            company_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Order history query error:', error);
        throw error;
      }

      console.log(`✅ Loaded ${data?.length || 0} orders from database`);
      if (data && data.length > 0) {
        console.log('📋 First order:', {
          invoice: data[0].order_number,
          customer: data[0].sales_hub_customers?.name,
          total: data[0].total_amount,
          status: data[0].status,
          created: data[0].created_at
        });
      }
      setOrderHistory(data || []);
    } catch (error: unknown) {
      console.error('❌ Error loading order history:', error);
      toast.error('Failed to load order history');
      setOrderHistory([]);
    }
  }, []); // Remove loadingOrders from dependencies to prevent infinite loop

  // Real-time subscription for order updates
  useEffect(() => {
    console.log('📡 Setting up real-time subscription for sales_hub_orders');
    
    const channel = supabase
      .channel('sales_hub_orders_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales_hub_orders'
        },
        (payload) => {
          console.log('📥 New order detected via real-time:', payload.new);
          // Reload order history to get the full order with joined data
          loadOrderHistory();
          toast.success('New order received!', { duration: 2000 });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up sales_hub_orders subscription');
      supabase.removeChannel(channel);
    };
  }, [loadOrderHistory]);

  const printOrderInvoice = useCallback((order: SalesHubOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const customerName = order.sales_hub_customers?.name || 'Walk-in Customer';
    const companyName = order.sales_hub_customers?.company_name || '';
    const orderDate = new Date(order.created_at).toLocaleDateString();

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.order_number}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 40px; 
              max-width: 800px;
              margin-left: auto;
              margin-right: auto;
            }
            .header { 
              margin-bottom: 30px; 
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #333; 
              padding-bottom: 20px; 
            }
            .header-left {
              flex: 1;
            }
            .header-right {
              text-align: right;
              font-size: 11px;
              color: #666;
              line-height: 1.6;
              max-width: 250px;
            }
            .invoice-title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 15px;
              color: #333;
            }
            .invoice-details { 
              text-align: left;
              margin: 0;
              font-size: 14px;
              color: #666;
            }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 30px 0; 
            }
            .items-table th { 
              background-color: #f5f5f5;
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left;
              font-weight: bold;
            }
            .items-table td { 
              border: 1px solid #ddd; 
              padding: 10px; 
              text-align: left; 
            }
            .right { 
              text-align: right; 
            }
            .totals-section {
              margin-top: 30px;
              text-align: right;
              font-size: 16px;
            }
            .totals-section div {
              margin: 8px 0;
            }
            .total-amount {
              font-size: 20px;
              font-weight: bold;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 2px solid #333;
            }
            .footer { 
              margin-top: 60px; 
              text-align: center; 
              color: #666;
              font-size: 14px;
              line-height: 1.8;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-details">
                <strong>Invoice Number:</strong> ${order.order_number}<br />
                <strong>Date:</strong> ${orderDate}<br />
                <strong>Customer:</strong> ${customerName}
              </div>
            </div>
            <div class="header-right">
              ${companyInfo.name ? `<strong style="font-size: 12px;">${companyInfo.name}</strong><br />` : ''}
              ${companyInfo.address ? `${companyInfo.address}<br />` : ''}
              ${companyInfo.city || companyInfo.country ? `${companyInfo.city}${companyInfo.city && companyInfo.country ? ', ' : ''}${companyInfo.country}<br />` : ''}
              ${companyInfo.phone ? `Phone: ${companyInfo.phone}<br />` : ''}
              ${companyInfo.email ? `Email: ${companyInfo.email}<br />` : ''}
              ${companyInfo.tin ? `TIN: ${companyInfo.tin}` : ''}
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th class="right">Qty</th>
                <th class="right">Unit Price</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((item: any) => `
                <tr>
                  <td>
                    ${item.name}
                    ${item.sku ? `<br /><small style="color: #666;">SKU: ${item.sku}</small>` : ''}
                    ${item.brand ? `<br /><small style="color: #666;">Brand: ${item.brand}</small>` : ''}
                  </td>
                  <td class="right">${item.quantity}</td>
                  <td class="right">${formatCurrency(item.unit_price)}</td>
                  <td class="right">${formatCurrency(item.subtotal)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals-section">
            <div><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</div>
            ${(order.vat_type === 'inclusive' || !order.vat_type) ? `<div><strong>VAT (18%):</strong> ${formatCurrency(order.tax_amount)}</div>` : ''}
            ${order.discount_amount > 0 ? `<div><strong>Discount:</strong> -${formatCurrency(order.discount_amount)}</div>` : ''}
            <div class="total-amount"><strong>Total:</strong> ${formatCurrency(order.total_amount)}</div>
          </div>

          <div class="footer">
            Thank you for your business!<br />
            <br />
            <small style="font-size: 11px; color: #999;">Generated on ${new Date().toLocaleString()}</small>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.print();
  }, [formatCurrency, companyInfo]);

  const loadKPIData = useCallback(async (dateFilter: string = 'today') => {
    kpisLoadedRef.current = true;
    try {
      // Calculate date range based on filter
      const today = new Date();
      let startDate = new Date();
      let endDate = new Date();
      let compareStartDate = new Date();
      let compareEndDate = new Date();

      switch (dateFilter) {
        case 'today':
          startDate = new Date(today);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          compareStartDate = new Date(today);
          compareStartDate.setDate(compareStartDate.getDate() - 1);
          compareStartDate.setHours(0, 0, 0, 0);
          compareEndDate = new Date(today);
          compareEndDate.setDate(compareEndDate.getDate() - 1);
          compareEndDate.setHours(23, 59, 59, 999);
          break;
        case 'yesterday':
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          compareStartDate = new Date(startDate);
          compareStartDate.setDate(compareStartDate.getDate() - 1);
          compareEndDate = new Date(compareStartDate);
          compareEndDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);
          startDate = weekStart;
          endDate = new Date();
          compareStartDate = new Date(weekStart);
          compareStartDate.setDate(compareStartDate.getDate() - 7);
          compareEndDate = new Date(weekStart);
          compareEndDate.setDate(compareEndDate.getDate() - 1);
          compareEndDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date();
          compareStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          compareEndDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
          break;
      }

      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      const compareStartStr = compareStartDate.toISOString();
      const compareEndStr = compareEndDate.toISOString();

      // Fetch sales data for selected period
      const { data: salesData, error: salesError } = await supabase
        .from('sales_hub_orders')
        .select('total_amount, created_at')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      if (salesError) throw salesError;

      // Calculate period sales
      const salesToday = salesData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Fetch invoice data
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('status, due_date, total_amount');

      if (invoiceError) throw invoiceError;

      // Calculate pending and overdue invoices
      const pendingInvoices = invoiceData?.filter(inv => inv.status === 'pending').length || 0;
      const overdueInvoices = invoiceData?.filter(inv => {
        return inv.status === 'pending' && new Date(inv.due_date) < today;
      }).length || 0;

      // Fetch stock data
      const { data: stockData, error: stockError } = await supabase
        .from('products')
        .select('stock_quantity, min_stock_level');

      if (stockError) throw stockError;

      // Calculate low stock items
      const lowStockItems = stockData?.filter(product =>
        product.stock_quantity <= (product.min_stock_level || 10)
      ).length || 0;

      // Calculate critical stock items (very low stock)
      const criticalStockItems = stockData?.filter(product =>
        product.stock_quantity <= (product.min_stock_level || 10)
      ).length || 0;

      // Fetch comparison period sales
      const { data: compareSales, error: compareSalesError } = await supabase
        .from('sales_hub_orders')
        .select('total_amount')
        .gte('created_at', compareStartStr)
        .lte('created_at', compareEndStr);

      if (compareSalesError) throw compareSalesError;

      const salesPrevious = compareSales?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const salesChange = salesPrevious > 0 ? Math.round(((salesToday - salesPrevious) / salesPrevious) * 100) : 0;

      // Fetch expenses for selected period from database
      const selectedDateStr = startDate.toISOString().split('T')[0];
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .gte('expense_date', startDate.toISOString().split('T')[0])
        .lte('expense_date', endDate.toISOString().split('T')[0]);

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
      }

      const expensesToday = expensesData?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

      // Fetch previous period expenses for comparison
      const { data: expensesPrevData, error: expensesPrevError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .gte('expense_date', compareStartDate.toISOString().split('T')[0])
        .lte('expense_date', compareEndDate.toISOString().split('T')[0]);

      if (expensesPrevError) {
        console.error('Error fetching previous expenses:', expensesPrevError);
      }

      const expensesPrevious = expensesPrevData?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

      const expensesChange = expensesPrevious > 0 
        ? Math.round(((expensesToday - expensesPrevious) / expensesPrevious) * 100) 
        : 0;

      // Calculate net revenue (sales - expenses)
      const netRevenue = salesToday - expensesToday;
      const netRevenuePrevious = salesPrevious - expensesPrevious;
      const netRevenueChange = netRevenuePrevious !== 0
        ? Math.round(((netRevenue - netRevenuePrevious) / Math.abs(netRevenuePrevious)) * 100)
        : 0;

      // Calculate AI opportunity score (simplified based on sales growth)
      const aiOpportunityScore = Math.min(100, Math.max(0, salesChange + 50));

      setTodaySnapshot({
        salesToday,
        salesChange,
        expensesToday,
        expensesChange,
        netRevenue,
        netRevenueChange,
        invoicesPending: pendingInvoices,
        invoicesOverdue: overdueInvoices,
        lowStockItems,
        criticalStockItems,
        aiOpportunityScore
      });

    } catch (error: unknown) {
      // Don't log AbortErrors - they're expected during navigation/remounts
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Error loading KPI data:', error);
        toast.error('Failed to load KPI data');
      }
    }
  }, []);

  const loadAIInsights = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      // Fetch recent sales data for insights
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentSales, error: salesError } = await supabase
        .from('sales_hub_orders')
        .select('total_amount, created_at, customer_id')
        .eq('created_by', userData.user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (salesError) throw salesError;

      // Fetch product data for insights
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, stock_quantity, min_stock_level, price')
        .eq('created_by', userData.user.id);

      if (productsError) throw productsError;

      // Fetch customer data
      const { data: customers, error: customersError } = await supabase
        .from('companies')
        .select('id, name, annual_revenue, health_score')
        .eq('created_by', userData.user.id);

      if (customersError) throw customersError;

      // Helper function to get UI properties for insights
      const getInsightUIProps = (type: string, priority: string) => {
        const typeConfig = {
          trend: { icon: TrendingUp, color: 'text-blue-700', bgColor: 'border-blue-200 bg-blue-50' },
          alert: { icon: AlertTriangle, color: 'text-red-700', bgColor: 'border-red-200 bg-red-50' },
          opportunity: { icon: ZapIcon, color: 'text-green-700', bgColor: 'border-green-200 bg-green-50' },
          insight: { icon: Brain, color: 'text-purple-700', bgColor: 'border-purple-200 bg-purple-50' }
        };

        return typeConfig[type as keyof typeof typeConfig] || typeConfig.insight;
      };

      // Generate insights based on real data
      const insights: AIInsight[] = [];

      // Sales trend insight
      if (recentSales && recentSales.length > 0) {
        const totalRevenue = recentSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
        const avgOrderValue = totalRevenue / recentSales.length;
        const uiProps = getInsightUIProps('trend', 'medium');

        insights.push({
          id: 'sales-trend',
          type: 'trend',
          title: 'Sales Performance',
          description: `Average order value: ${formatCurrency(avgOrderValue)}. Total revenue in last 30 days: ${formatCurrency(totalRevenue)}.`,
          priority: 'medium',
          actionable: true,
          recommendation: 'Consider upselling strategies to increase average order value.',
          ...uiProps,
          message: `Average order value: ${formatCurrency(avgOrderValue)}. Total revenue in last 30 days: ${formatCurrency(totalRevenue)}.`,
          action: 'View Details'
        });
      }

      // Stock insights
      if (products) {
        const lowStockProducts = products.filter(p => p.stock_quantity <= (p.min_stock_level || 10));
        if (lowStockProducts.length > 0) {
          const uiProps = getInsightUIProps('alert', 'high');
          insights.push({
            id: 'stock-alert',
            type: 'alert',
            title: 'Low Stock Alert',
            description: `${lowStockProducts.length} products are running low on stock.`,
            priority: 'high',
            actionable: true,
            recommendation: 'Reorder these products to avoid stockouts.',
            ...uiProps,
            message: `${lowStockProducts.length} products are running low on stock.`,
            action: 'Manage Stock'
          });
        }

        const highValueProducts = products.filter(p => p.price > 1000);
        if (highValueProducts.length > 0) {
          const uiProps = getInsightUIProps('opportunity', 'medium');
          insights.push({
            id: 'high-value-products',
            type: 'opportunity',
            title: 'High-Value Product Focus',
            description: `You have ${highValueProducts.length} high-value products that could drive revenue.`,
            priority: 'medium',
            actionable: true,
            recommendation: 'Focus marketing efforts on these premium products.',
            ...uiProps,
            message: `You have ${highValueProducts.length} high-value products that could drive revenue.`,
            action: 'View Products'
          });
        }
      }

      // Customer insights
      if (customers) {
        const highValueCustomers = customers.filter(c => (c.annual_revenue || 0) > 50000);
        if (highValueCustomers.length > 0) {
          const uiProps = getInsightUIProps('insight', 'medium');
          insights.push({
            id: 'customer-segmentation',
            type: 'insight',
            title: 'High-Value Customers',
            description: `${highValueCustomers.length} customers have high annual revenue potential.`,
            priority: 'medium',
            actionable: true,
            recommendation: 'Develop targeted retention strategies for these key accounts.',
            ...uiProps,
            message: `${highValueCustomers.length} customers have high annual revenue potential.`,
            action: 'View Customers'
          });
        }
      }

      // Default insights if no data-driven insights
      if (insights.length === 0) {
        const uiProps = getInsightUIProps('insight', 'low');
        insights.push({
          id: 'getting-started',
          type: 'insight',
          title: 'Getting Started',
          description: 'Start by adding products and processing sales orders to unlock AI insights.',
          priority: 'low',
          actionable: false,
          recommendation: 'Complete your product catalog and begin processing orders.',
          ...uiProps,
          message: 'Start by adding products and processing sales orders to unlock AI insights.',
          action: 'Get Started'
        });
      }

      setAiInsights(insights);

    } catch (error: unknown) {
      // Don't log AbortErrors - they're expected during navigation/remounts
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Error loading AI insights:', error);
        toast.error('Failed to load AI insights');
      }
    }
  }, []);

  // Reload KPI data when dashboard date range changes - REMOVED with Updates section
  // useEffect(() => {
  //   // Updates section removed - no longer needed
  // }, [dashboardDateRange, activeSubsection]);

  useEffect(() => {
    if (activeSubsection === 'products') {
      // \u2728 Products, categories, and brands loaded instantly via optimistic cache - no manual loading needed!
    }
    if (activeSubsection === 'inventory-status') {
      // \u2728 Products and brands loaded instantly via optimistic cache - no manual loading needed!
    }
    if (activeSubsection === 'carts-invoice') {
      // Customers loaded instantly via optimistic cache - no need to fetch
      loadOrderHistory();
      loadCompanyPaymentInfo();
      loadCompanyInfo();
    }
    if (activeSubsection === 'order-history') {
      loadOrderHistory();
      // Categories and brands loaded instantly via optimistic cache - no manual load needed
    }
  }, [activeSubsection]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load user subscription plan on component mount
  useEffect(() => {
    loadUserSubscriptionPlan();
    // Products loaded instantly via optimistic cache - no need to pre-load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  // Check for navigation from floating button or saved subsection
  useEffect(() => {
    const targetSubsection = localStorage.getItem('salesHubActiveSubsection');
    if (targetSubsection) {
      // Restore any valid subsection from floating button navigation
      const validSubsections: Subsection[] = ['products', 'carts-invoice', 'order-history', 'inventory-status', 'customer-buying-patterns', 'expenses', 'product-stocking-history', 'stock-transfers'];
      if (validSubsections.includes(targetSubsection as Subsection)) {
        console.log('🔵 [SALES HUB] Restoring subsection from floating button:', targetSubsection);
        setActiveSubsection(targetSubsection as Subsection);
      }
      localStorage.removeItem('salesHubActiveSubsection'); // Clean up floating button flag
    }
  }, []);

  // Save current subsection to localStorage for page refresh persistence
  useEffect(() => {
    localStorage.setItem('salesHubCurrentSubsection', activeSubsection);
    console.log('💾 Saved current subsection:', activeSubsection);
  }, [activeSubsection]);

  // DEBUG: Track subsection changes
  useEffect(() => {
    console.log('🟢 [SALES HUB] Active subsection changed to:', activeSubsection);
  }, [activeSubsection]);

  // Auto-select location when user has only one location
  useEffect(() => {
    if (userLocations.length === 1) {
      // Auto-populate default location in Add Product form
      setNewProductData(prev => ({
        ...prev,
        location_id: userLocations[0].id
      }));
      console.log('🎯 [AUTO-LOCATION] Auto-selected single location:', userLocations[0].name);
    } else if (userLocations.length > 1) {
      // Check for user's preferred default location
      const defaultLocationId = localStorage.getItem('defaultLocationId');
      if (defaultLocationId && userLocations.some(loc => loc.id === defaultLocationId)) {
        setNewProductData(prev => ({
          ...prev,
          location_id: defaultLocationId
        }));
        console.log('🎯 [AUTO-LOCATION] Auto-selected default location from preferences');
      }
    }
  }, [userLocations]);

  // Auto-populate location when Add Product modal opens
  useEffect(() => {
    if (showAddProductModal && userLocations.length > 0) {
      if (userLocations.length === 1) {
        // Auto-select the only available location
        setNewProductData(prev => ({
          ...prev,
          location_id: userLocations[0].id
        }));
      } else {
        // Check for user's preferred default location
        const defaultLocationId = localStorage.getItem('defaultLocationId');
        if (defaultLocationId && userLocations.some(loc => loc.id === defaultLocationId)) {
          setNewProductData(prev => ({
            ...prev,
            location_id: defaultLocationId
          }));
        }
      }
    }
  }, [showAddProductModal, userLocations]);

  const loadCompanyPaymentInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const companyId = user.user_metadata?.company_id;
      if (!companyId) return;

      const { data, error } = await supabase
        .from('companies')
        .select('m_pesa_paybill, m_pesa_account, bank_account, bank_name, cash_payment_location, cash_payment_hours')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      if (data) {
        setCompanyPaymentInfo({
          m_pesa: {
            paybill: data.m_pesa_paybill || '',
            account: data.m_pesa_account || ''
          },
          bank_transfer: {
            account: data.bank_account || '',
            bank: data.bank_name || ''
          },
          cash_payment: {
            accepted_at: data.cash_payment_location || '',
            hours: data.cash_payment_hours || ''
          }
        });
      }
    } catch (error) {
      console.error('Error loading company payment info:', error);
    }
  };

  const loadCompanyInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const companyId = user.user_metadata?.company_id;
      if (!companyId) return;

      const { data, error } = await supabase
        .from('companies')
        .select('name, address, city, country, phone, email, tin')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      if (data) {
        setCompanyInfo({
          name: data.name || 'COPCCA CRM',
          address: data.address || 'Business Address',
          city: data.city || 'City',
          country: data.country || 'Country',
          phone: data.phone || '+255 XXX XXX XXX',
          email: data.email || 'info@copcca.com',
          tin: data.tin || '123456789'
        });
      }
    } catch (error) {
      console.error('Error loading company info:', error);
    }
  };

  const loadUserSubscriptionPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's company_id from user profile
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (userData?.company_id) {
        // Get company subscription plan
        const { data: companyData } = await supabase
          .from('companies')
          .select('subscription_plan')
          .eq('id', userData.company_id)
          .single();

        if (companyData?.subscription_plan) {
          setUserSubscriptionPlan(companyData.subscription_plan);
        }

        // Load user's locations from unified locations table
        const { data: locationsData } = await supabase
          .from('locations')
          .select('id, name, type')
          .eq('company_id', userData.company_id)
          .eq('status', 'active')
          .order('type', { ascending: true })
          .order('name', { ascending: true });

        if (locationsData) {
          setUserLocations(locationsData);
        } else {
          setUserLocations([]);
        }
      }
    } catch (error) {
      // Don't log AbortErrors - they're expected during navigation/remounts
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Error loading user subscription plan and locations:', error);
      }
      // Default to starter if there's an error
      setUserSubscriptionPlan('starter');
      setUserLocations([]);
    }
  };

  // \u274C REMOVED: loadCategories and loadBrands functions
  // Categories and brands now load automatically via optimistic cache
  // No manual loading needed - they're always fresh and instant!

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    updateCartItem(productId, { quantity });
  }, [updateCartItem, removeFromCart]);

  const updatePrice = useCallback((productId: string, price: number) => {
    updateCartItem(productId, { price });
  }, [updateCartItem]);

  // Commit discount value - only updates on blur/enter to prevent auto-focus shift
  const commitDiscountValue = useCallback(() => {
    if (!discountInputRef.current) return;
    
    const value = parseFloat(discountInputRef.current.value) || 0;
    
    if (discountType === 'percentage') {
      // Clamp percentage to 0-100
      const clampedValue = Math.min(Math.max(value, 0), 100);
      if (value !== clampedValue) {
        discountInputRef.current.value = clampedValue.toString();
      }
      setCommittedDiscountPercent(clampedValue);
    } else {
      // Clamp amount to 0-subtotal
      const subtotal = getCartTotal();
      const clampedValue = Math.min(Math.max(value, 0), subtotal);
      if (value !== clampedValue) {
        discountInputRef.current.value = clampedValue.toString();
      }
      setCommittedDiscountAmount(clampedValue);
    }
  }, [discountType, getCartTotal]);

  const getStockStatus = useCallback((product: Product) => {
    const reorderLevel = product.min_stock_level || 10;
    if (product.stock_quantity <= 0) return { status: 'out', color: 'bg-red-500', text: 'Out of Stock' };
    if (product.stock_quantity <= reorderLevel) return { status: 'low', color: 'bg-yellow-500', text: 'Low Stock' };
    return { status: 'healthy', color: 'bg-green-500', text: 'In Stock' };
  }, []);

  const getTotal = useCallback(() => getCartTotal(), [getCartTotal]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const productCategoryId = product.category_id || (product.categories?.id);
    const matchesCategory = categoryFilter === 'all' || productCategoryId === categoryFilter;
    const productBrandId = product.brand_id || (product.brands?.id);
    const matchesBrand = brandFilter === 'all' || productBrandId === brandFilter;
    const stockStatus = getStockStatus(product);
    const matchesStock = stockFilter === 'all' ||
                        (stockFilter === 'in-stock' && stockStatus.status === 'healthy') ||
                        (stockFilter === 'low-stock' && stockStatus.status === 'low') ||
                        (stockFilter === 'out-of-stock' && stockStatus.status === 'out');

    return matchesSearch && matchesCategory && matchesBrand && matchesStock;
  });

  const addToCartWithQuantity = (product: Product, quantity: number, customPrice: number) => {
    console.log('addToCartWithQuantity called with:', { product: product.name, quantity, customPrice });
    const item = {
      product,
      quantity,
      price: customPrice,
      subtotal: quantity * customPrice
    };
    console.log('Created cart item:', item);
    addToCart(item);
  };

  const handleCompleteOrder = async () => {
    try {
      // Prevent double-clicks
      if (isProcessingOrder) {
        console.warn('⚠️ Order already being processed, ignoring duplicate click');
        return;
      }

      if (cart.length === 0) {
        toast.error('Please add items to cart');
        return;
      }

      if (customerSelectionMode !== 'walk-in' && !selectedCustomer) {
        toast.error('Please select a customer');
        return;
      }

      // ⚠️ CRITICAL: Prevent credit sales to Walk-in customers
      if (paymentMethod === 'credit' && customerSelectionMode === 'walk-in') {
        toast.error('❌ Credit sales require a real customer. Please select a customer before completing this order.', {
          duration: 5000,
          icon: '⚠️'
        });
        return;
      }

      // Warn user about Walk-in sales for analytics
      if (customerSelectionMode === 'walk-in' && paymentMethod === 'cash') {
        console.warn('⚠️ Completing order as Walk-in Customer - this will not appear in Customer Buying Patterns per customer');
      }

      // ============================================
      // STOCK VALIDATION - Check warehouse stock availability
      // ============================================
      console.log('🔍 Validating stock availability for warehouse:', selectedWarehouse);
      
      // Simplified stock validation - check product stock regardless of warehouse
      const stockErrors: Array<{
        productName: string;
        sku: string;
        brand: string;
        warehouse: string;
        needed: number;
        available: number;
      }> = [];

      // Get selected warehouse name for display
      const selectedLocation = locations.find(loc => loc.id === selectedWarehouse);
      const warehouseName = selectedLocation ? selectedLocation.name : 'Main Store';

      // Check each cart item against product stock
      for (const cartItem of cart) {
        // Use the product data we already have in cart (from optimistic cache)
        const availableStock = cartItem.product.stock_quantity || 0;
        
        if (availableStock < cartItem.quantity) {
          // Insufficient stock
          stockErrors.push({
            productName: cartItem.product.name,
            sku: cartItem.product.sku || 'N/A',
            brand: cartItem.product.brands?.name || 'N/A',
            warehouse: warehouseName,
            needed: cartItem.quantity,
            available: availableStock
          });
          console.warn(`❌ Insufficient stock for "${cartItem.product.name}": need ${cartItem.quantity}, have ${availableStock}`);
        }
      }

      // If there are stock errors, show modal and block checkout
      if (stockErrors.length > 0) {
        console.error('🚫 Cannot complete order - stock validation failed');
        setStockValidationErrors(stockErrors);
        setShowStockValidationModal(true);
        toast.error(`${stockErrors.length} product${stockErrors.length > 1 ? 's' : ''} have insufficient stock`, { duration: 5000 });
        return; // STOP checkout process
      }

      console.log('✅ Stock validation passed - proceeding with checkout');
      // ============================================
      // END STOCK VALIDATION
      // ============================================

      setIsProcessingOrder(true);

      // Calculate totals
      const subtotal = getTotal();
      const taxAmount = vatType === 'inclusive' ? subtotal * taxRate : 0;

      // Calculate discount based on type
      const actualDiscountAmount = discountType === 'percentage'
        ? subtotal * (committedDiscountPercent / 100)
        : Math.min(committedDiscountAmount, subtotal);

      const total = subtotal + taxAmount - actualDiscountAmount;
      
      console.log('💰 Order totals breakdown:');
      console.log('  Subtotal:', subtotal);
      console.log('  VAT Type:', vatType);
      console.log('  Tax (18%):', taxAmount);
      console.log('  Discount:', actualDiscountAmount);
      console.log('  TOTAL:', total);
      
      // Generate truly unique invoice number using timestamp + crypto random
      const timestamp = Date.now();
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const uniqueId = `${timestamp}${randomPart}`;
      const invoiceNumber = `INV-${uniqueId}`;
      
      console.log('🆔 Generated unique invoice number:', invoiceNumber);

      // IMMEDIATE UI UPDATE - Clear cart and show success modal right away
      const orderSnapshot = {
        invoiceNumber,
        subtotal,
        taxAmount,
        discountAmount: actualDiscountAmount,
        total,
        items: [...cart]
      };

      clearCart();
      setCustomDueDate(''); // Reset due date after order completion
      setCompletedOrderData(orderSnapshot);
      setShowPostOrderModal(true);
      setIsProcessingOrder(false); // Reset processing state after UI update
      toast.success('Order completed successfully!');

      // OPTIMISTIC UPDATE: Add order to history immediately for instant visual feedback
      const optimisticOrder: any = {
        id: `temp-${Date.now()}`, // Temporary ID
        order_number: invoiceNumber,
        customer_id: customerSelectionMode === 'walk-in' ? null : (selectedCustomer?.customer_id || selectedCustomer?.id),
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_type: discountType,
        discount_value: discountType === 'percentage' ? committedDiscountPercent : committedDiscountAmount,
        discount_amount: actualDiscountAmount,
        total_amount: total,
        payment_method: paymentMethod,
        items: orderSnapshot.items.map(item => ({
          product_id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          brand: item.product.brands?.name || '',
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.subtotal
        })),
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sales_hub_customers: customerSelectionMode === 'walk-in' 
          ? { id: null, name: 'Walk-in Customer', company_name: null }
          : { 
              id: selectedCustomer?.id, 
              name: selectedCustomer?.name, 
              company_name: selectedCustomer?.company_name 
            }
      };

      // Prepend the new order to show it at the top instantly
      setOrderHistory(prev => [optimisticOrder, ...prev]);

      // AUTO-SWITCH to Order History tab so user sees the new order immediately
      setActiveSubsection('order-history');
      console.log('✅ Switched to Order History - new order should be visible at top');
      toast.success('Order added! Switched to Order History', { duration: 2000 });

      // Process backend operations asynchronously without blocking UI
      (async () => {
        try {
          let salesHubCustomerId;

          if (customerSelectionMode === 'walk-in') {
            const walkInCustomerData = {
              customer_id: `walk-in-${Date.now()}`,
              name: 'Walk-in Customer',
              company_name: null,
              email: null,
              phone: null,
              mobile: null,
              tier: 'bronze',
              health_score: 50,
              churn_risk: 'low',
              upsell_potential: 'low',
              lifetime_value: 0,
              outstanding_balance: 0,
              preferred_payment_method: paymentMethod,
              status: 'active',
              total_orders: 1,
              last_order_date: new Date().toISOString(),
              tags: ['walk-in'],
              external_system: 'walk-in'
            };

            const { data: existingWalkIn } = await supabase
              .from('sales_hub_customers')
              .select('id')
              .eq('customer_id', walkInCustomerData.customer_id)
              .single();

            if (existingWalkIn) {
              salesHubCustomerId = existingWalkIn.id;
              console.log('✓ Found existing walk-in customer:', existingWalkIn.id);
            } else {
              console.log('📝 Creating new walk-in customer');
              const { data: newWalkInCustomer, error: walkInError } = await supabase
                .from('sales_hub_customers')
                .insert(walkInCustomerData)
                .select('id')
                .single();
              
              if (walkInError) {
                console.error('❌ Failed to create walk-in customer:', walkInError);
                throw new Error(`Failed to create walk-in customer: ${walkInError.message}`);
              }
              salesHubCustomerId = newWalkInCustomer?.id;
              console.log('✓ Created walk-in customer:', salesHubCustomerId);
            }
          } else {
            // Look up or create customer in sales_hub_customers
            const { data: existingCustomer } = await supabase
              .from('sales_hub_customers')
              .select('id')
              .eq('customer_id', selectedCustomer!.customer_id)
              .single();

            if (existingCustomer) {
              // Customer already exists in sales_hub_customers
              salesHubCustomerId = existingCustomer.id;
              console.log('✓ Found existing customer in sales_hub:', existingCustomer.id);
            } else {
              // Create new customer in sales_hub_customers
              console.log('📝 Creating new sales_hub_customer for:', selectedCustomer!.name);
              const { data: newCustomer, error: customerError } = await supabase
                .from('sales_hub_customers')
                .insert({
                  customer_id: selectedCustomer!.customer_id,
                  company_id: selectedCustomer!.id, // 🔗 Link to CRM companies table
                  name: selectedCustomer!.name,
                  company_name: selectedCustomer!.company_name,
                  email: selectedCustomer!.email,
                  phone: selectedCustomer!.phone,
                  mobile: selectedCustomer!.mobile,
                  tier: 'bronze',
                  health_score: selectedCustomer!.health_score || 50,
                  churn_risk: selectedCustomer!.churn_risk || 'low',
                  upsell_potential: selectedCustomer!.upsell_potential || 'low',
                  lifetime_value: selectedCustomer!.lifetime_value || 0,
                  outstanding_balance: selectedCustomer!.outstanding_balance || 0,
                  preferred_payment_method: selectedCustomer!.preferred_payment,
                  status: 'active',
                  total_orders: selectedCustomer!.total_orders || 0,
                  last_order_date: selectedCustomer!.last_order_date,
                  tags: selectedCustomer!.tags,
                  external_system: 'companies'
                })
                .select('id')
                .single();
              
              if (customerError) {
                console.error('❌ Failed to create sales_hub_customer:', customerError);
                throw new Error(`Failed to create customer: ${customerError.message}`);
              }
              salesHubCustomerId = newCustomer?.id;
              console.log('✓ Created new sales_hub_customer:', salesHubCustomerId);
            }
          }

          // Validate customer ID before creating order
          if (!salesHubCustomerId) {
            console.error('❌ No valid customer ID for order');
            throw new Error('Failed to get or create customer record');
          }

          // Save order
          const orderData = {
            order_number: invoiceNumber,
            customer_id: salesHubCustomerId,
            subtotal: subtotal,
            tax_amount: taxAmount,
            discount_type: discountType,
            discount_value: discountType === 'percentage' ? committedDiscountPercent : committedDiscountAmount,
            discount_amount: actualDiscountAmount,
            total_amount: total,
            payment_method: paymentMethod,
            vat_type: vatType,
            status: 'completed',
            items: orderSnapshot.items.map(item => ({
              product_id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
              brand: item.product.brands?.name || '',
              quantity: item.quantity,
              unit_price: item.price,
              subtotal: item.subtotal
            })),
            created_by: (await supabase.auth.getUser()).data.user?.id
          };

          console.log('📝 Inserting order:', { 
            invoice: invoiceNumber, 
            customer_id: salesHubCustomerId,
            total: total,
            payment_method: paymentMethod
          });

          const { data: insertedOrder, error: orderError } = await supabase
            .from('sales_hub_orders')
            .insert(orderData)
            .select()
            .single();
          
          if (orderError) {
            console.error('❌ Failed to save order to database:', orderError);
            console.error('Error code:', orderError.code);
            console.error('Error details:', orderError.details);
            console.error('Error hint:', orderError.hint);
            console.error('Order data:', orderData);
            
            // Handle specific error types
            if (orderError.code === '23505') {
              // Unique constraint violation (duplicate invoice number)
              toast.error('Order number conflict. Please try again.');
            } else {
              toast.error(`Failed to save order: ${orderError.message}`);
            }
            // Continue with other operations but notify user
          } else {
            console.log('✓ Order saved to database:', insertedOrder?.id);
          }

          // AUTO-CREATE DEBT RECORD for credit orders (only if order was saved successfully)
          if (paymentMethod === 'credit' && !orderError && insertedOrder) {
            // Use custom due date if provided, otherwise default to +30 days
            let dueDate: string;
            if (customDueDate) {
              dueDate = customDueDate;
            } else {
              const defaultDueDate = new Date();
              defaultDueDate.setDate(defaultDueDate.getDate() + 30);
              dueDate = defaultDueDate.toISOString().split('T')[0];
            }

            const debtData = {
              invoice_number: invoiceNumber,
              amount: total,
              due_date: dueDate,
              status: 'pending',
              days_overdue: 0,
              payment_probability: 70,
              risk_score: 'medium',
              auto_reminder: true,
              company_id: customerSelectionMode === 'walk-in' ? null : (selectedCustomer!.customer_id || selectedCustomer!.id),
              company_name: customerSelectionMode === 'walk-in' ? 'Walk-in Customer' : selectedCustomer!.name,
              company_contact_email: customerSelectionMode === 'walk-in' ? '' : (selectedCustomer!.email || ''),
              company_contact_phone: customerSelectionMode === 'walk-in' ? '' : (selectedCustomer!.phone || selectedCustomer!.mobile || ''),
              created_by: (await supabase.auth.getUser()).data.user?.id
            };

            const { error: debtError } = await supabase.from('debts').insert(debtData);
            
            if (debtError) {
              console.error('❌ Failed to auto-create debt record:', debtError);
              toast.error('Failed to create debt record');
            } else {
              console.log('✓ Auto-created debt record for credit order:', invoiceNumber);
              console.log('  Customer:', debtData.company_name);
              console.log('  RAW Amount (what we inserted):', debtData.amount);
              console.log('  Formatted Amount:', formatCurrency(debtData.amount));
              console.log('  Due Date:', debtData.due_date);
              toast.success('📋 Debt record created for credit order', { duration: 3000 });
            }
          } else if (paymentMethod === 'credit' && orderError) {
            console.warn('⚠️ Skipping debt creation because order save failed');
          }

          // Get selected warehouse/location name
          const selectedLocation = locations.find(loc => loc.id === selectedWarehouse);
          const locationName = selectedLocation ? selectedLocation.name : 'main-store';
          
          // Update stock in parallel
          const stockPromises = orderSnapshot.items.map(async (item) => {
            const { data: currentProduct } = await supabase
              .from('products')
              .select('stock_quantity')
              .eq('id', item.product.id)
              .single();

            const stockBefore = currentProduct?.stock_quantity || 0;
            const stockAfter = Math.max(0, stockBefore - item.quantity);

            await Promise.all([
              supabase.from('products').update({ stock_quantity: stockAfter }).eq('id', item.product.id),
              supabase.from('stock_history').insert({
                product_id: item.product.id,
                action: 'pos_sale',
                quantity: item.quantity,
                stock_before: stockBefore,
                stock_after: stockAfter,
                location: locationName,
                reference_type: 'invoice',
                reference_id: invoiceNumber,
                created_by: (await supabase.auth.getUser()).data.user?.id,
                notes: `Sale via order ${invoiceNumber} from ${locationName}`
              })
            ]);
          });

          await Promise.all(stockPromises);

          // Refresh order history immediately so user can print invoice
          console.log('🔄 Refreshing order history after sale completion...');
          await loadOrderHistory();
          console.log('✅ Order history refreshed successfully');

          // Force products reload to update inventory display instantly
          console.log('🔄 Refreshing inventory management data...');
          await reloadProducts();
          console.log('✅ Inventory updated successfully - stock changes now visible');

          // Products state will also auto-update via useOptimisticCache real-time subscriptions
        } catch (error) {
          console.error('❌ Error processing order in background:', error);
          // Still try to refresh order history even if stock update failed
          try {
            await loadOrderHistory();
          } catch (refreshError) {
            console.error('❌ Failed to refresh order history:', refreshError);
          }
        }
      })();
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('Failed to complete order. Please try again.');
      setIsProcessingOrder(false); // Reset processing state on error
    }
  };

  // Print completed order invoice
  const printCompletedOrder = (orderData: {
    invoiceNumber: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
  }) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${orderData.invoiceNumber}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 40px; 
                max-width: 800px;
                margin-left: auto;
                margin-right: auto;
              }
              .header { 
                margin-bottom: 30px; 
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #333; 
                padding-bottom: 20px; 
              }
              .header-left {
                flex: 1;
              }
              .header-right {
                text-align: right;
                font-size: 11px;
                color: #666;
                line-height: 1.6;
                max-width: 250px;
              }
              .invoice-title { 
                font-size: 24px; 
                font-weight: bold; 
                margin-bottom: 15px;
                color: #333;
              }
              .invoice-details { 
                text-align: left;
                margin: 0;
                font-size: 14px;
                color: #666;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 30px 0; 
              }
              th { 
                background-color: #f5f5f5;
                border: 1px solid #ddd; 
                padding: 12px; 
                text-align: left;
                font-weight: bold;
              }
              td { 
                border: 1px solid #ddd; 
                padding: 10px; 
                text-align: left; 
              }
              .right { 
                text-align: right; 
              }
              .totals-section {
                margin-top: 30px;
                text-align: right;
                font-size: 16px;
              }
              .totals-section div {
                margin: 8px 0;
              }
              .total-amount {
                font-size: 20px;
                font-weight: bold;
                margin-top: 15px;
                padding-top: 10px;
                border-top: 2px solid #333;
              }
              .invoice-footer { 
                margin-top: 60px; 
                text-align: center; 
                color: #666;
                font-size: 14px;
                line-height: 1.8;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-left">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-details">
                  <strong>Invoice Number:</strong> ${orderData.invoiceNumber}<br />
                  <strong>Date:</strong> ${new Date().toLocaleDateString()}<br />
                  <strong>Customer:</strong> ${selectedCustomer?.name || 'Walk-in Customer'}
                </div>
              </div>
              <div class="header-right">
                ${companyInfo.name ? `<strong style="font-size: 12px;">${companyInfo.name}</strong><br />` : ''}
                ${companyInfo.address ? `${companyInfo.address}<br />` : ''}
                ${companyInfo.city || companyInfo.country ? `${companyInfo.city}${companyInfo.city && companyInfo.country ? ', ' : ''}${companyInfo.country}<br />` : ''}
                ${companyInfo.phone ? `Phone: ${companyInfo.phone}<br />` : ''}
                ${companyInfo.email ? `Email: ${companyInfo.email}<br />` : ''}
                ${companyInfo.tin ? `TIN: ${companyInfo.tin}` : ''}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="right">Qty</th>
                  <th class="right">Unit Price</th>
                  <th class="right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${cart.map(item => `
                  <tr>
                    <td>
                      ${item.product.name}
                      ${item.product.sku ? `<br /><small style="color: #666;">SKU: ${item.product.sku}</small>` : ''}
                      ${item.product.brands?.name ? `<br /><small style="color: #666;">Brand: ${item.product.brands.name}</small>` : ''}
                    </td>
                    <td class="right">${item.quantity}</td>
                    <td class="right">${formatCurrency(item.price)}</td>
                    <td class="right">${formatCurrency(item.subtotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals-section">
              <div><strong>Subtotal:</strong> ${formatCurrency(orderData.subtotal)}</div>
              <div><strong>VAT (18%):</strong> ${formatCurrency(orderData.taxAmount)}</div>
              ${orderData.discountAmount > 0 ? `<div><strong>Discount:</strong> -${formatCurrency(orderData.discountAmount)}</div>` : ''}
              <div class="total-amount"><strong>Total:</strong> ${formatCurrency(orderData.total)}</div>
            </div>

            <div class="invoice-footer">
              Thank you for your business!<br />
              <br />
              <small style="font-size: 11px; color: #999;">Generated on ${new Date().toLocaleString()}</small>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Handle restock functionality
  const handleRestock = async () => {
    const quantity = typeof restockQuantity === 'string' ? parseInt(restockQuantity) || 0 : restockQuantity;
    if (!selectedProductForRestock || quantity <= 0) {
      toast.error('Please enter a valid restock quantity');
      return;
    }

    if (!restockLocation) {
      toast.error('Please select a location for restocking');
      return;
    }
    
    // Validate purchase cost if COGS tracking is enabled
    if (cogsTrackingEnabled) {
      const purchaseCost = typeof restockPurchaseCost === 'string' ? parseFloat(restockPurchaseCost) || 0 : restockPurchaseCost;
      if (!purchaseCost || purchaseCost <= 0) {
        toast.error('Purchase Cost is required when COGS tracking is enabled');
        return;
      }
    }

    setIsRestocking(true);
    
    try {
      console.log('🔵 Starting restock for:', selectedProductForRestock.name);
      console.log('🔵 Quantity:', quantity);
      console.log('🔵 Location:', restockLocation);
      console.log('🔵 Purchase Cost:', restockPurchaseCost || 'none');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to restock products');
        setIsRestocking(false);
        return;
      }

      // Get current stock before restocking
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', selectedProductForRestock.id)
        .single();

      if (fetchError) {
        console.error('🔴 Error fetching current product stock:', fetchError);
        toast.error('Failed to fetch current stock information');
        setIsRestocking(false);
        return;
      }

      const stockBefore = currentProduct.stock_quantity || 0;
      const stockAfter = stockBefore + quantity;
      
      console.log('🔵 Stock before:', stockBefore);
      console.log('🔵 Stock after:', stockAfter);

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({
          stock_quantity: stockAfter,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProductForRestock.id);

      if (updateError) {
        console.error('🔴 Error updating product stock:', updateError);
        toast.error(`Failed to update product stock: ${updateError.message}`);
        setIsRestocking(false);
        return;
      }

      console.log('✅ Stock updated successfully');

      // Record stock history with purchase cost tracking
      const purchaseCostPerUnit = restockPurchaseCost ? parseFloat(restockPurchaseCost) : null;
      const purchaseCostTotal = purchaseCostPerUnit ? purchaseCostPerUnit * quantity : null;
      
      const historyData = {
        product_id: selectedProductForRestock.id,
        action: 'restock',
        quantity: quantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
        location_id: restockLocation,
        notes: purchaseCostPerUnit ? `Purchase cost: TSh ${purchaseCostPerUnit.toLocaleString()}/unit` : 'Restocked',
        created_by: user.id,
        purchase_cost_per_unit: purchaseCostPerUnit,
        purchase_cost_total: purchaseCostTotal,
        created_at: new Date().toISOString()
      };

      console.log('🔵 Inserting stock history:', historyData);

      const { error: historyError } = await supabase
        .from('stock_history')
        .insert([historyData]);

      if (historyError) {
        console.error('⚠️ Stock history insert failed:', historyError);
      } else {
        console.log('✅ Stock history recorded with purchase cost');
      }

      // Success message with cost info
      const costInfo = purchaseCostPerUnit ? ` (Cost: TSh ${purchaseCostPerUnit.toLocaleString()}/unit, Total: TSh ${purchaseCostTotal?.toLocaleString()})` : '';
      
      // Close modal and reset state
      setShowRestockModal(false);
      setSelectedProductForRestock(null);
      setRestockQuantity('');
      setRestockPurchaseCost('');
      setRestockLocation('');

      toast.success(`✅ Successfully restocked ${quantity} units${costInfo}`);

      // Force immediate product list refresh
      try {
        await reloadProducts();
        console.log('✅ Products reloaded');
      } catch (reloadError) {
        console.error('⚠️ Failed to reload products:', reloadError);
        // Don't show error to user - the restock itself succeeded
      }

    } catch (error) {
      console.error('🔴 RESTOCK ERROR - Full details:', error);
      console.error('🔴 Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('🔴 Error message:', error instanceof Error ? error.message : String(error));
      
      // Show detailed error message to help debug
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Restock failed: ${errorMessage}`);
    } finally {
      setIsRestocking(false);
    }
  };

  const handleCreatePromotion = async () => {
    if (!selectedProductForPromotion) {
      toast.error('No product selected for promotion');
      return;
    }

    if (!promotionData.name.trim()) {
      toast.error('Please enter a promotion name');
      return;
    }

    const discountVal = typeof promotionData.discount_value === 'string' 
      ? parseFloat(promotionData.discount_value) || 0 
      : promotionData.discount_value;
    
    const budgetVal = typeof promotionData.budget === 'string'
      ? parseFloat(promotionData.budget) || 0
      : promotionData.budget;

    if (discountVal <= 0) {
      toast.error('Please enter a valid discount value');
      return;
    }

    setIsCreatingPromotion(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create promotions');
        return;
      }

      // Create marketing campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('marketing_campaigns')
        .insert({
          name: promotionData.name,
          description: promotionData.description,
          type: promotionData.type,
          status: 'active',
          budget: budgetVal,
          currency: 'TZS',
          target_audience: promotionData.target_audience,
          start_date: promotionData.start_date,
          end_date: promotionData.end_date,
          created_by: user.id,
          assigned_to: user.id
        })
        .select()
        .single();

      if (campaignError) {
        console.error('Error creating campaign:', campaignError);
        toast.error('Failed to create promotion campaign');
        return;
      }

      // Close modal and reset state
      setShowPromotionModal(false);
      setSelectedProductForPromotion(null);
      setPromotionData({
        name: '',
        description: '',
        type: 'paid_ads',
        discount_type: 'percentage',
        discount_value: '',
        budget: '',
        start_date: '',
        end_date: '',
        target_audience: ''
      });

      toast.success(`Promotion "${promotionData.name}" created successfully!`);
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast.error('Failed to create promotion. Please try again.');
    } finally {
      setIsCreatingPromotion(false);
    }
  };

  // Handle image upload for products
  const handleProductImageUpload = async (file: File): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload images');
        return null;
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error in image upload:', error);
      toast.error('An error occurred while uploading the image');
      return null;
    }
  };

  // Handle image file selection (Add Product)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setProductImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle image file selection (Edit Product)
  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setEditImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddProduct = async () => {
    const price = typeof newProductData.price === 'string' ? parseFloat(newProductData.price) || 0 : newProductData.price;
    if (!newProductData.name || price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!newProductData.location_id) {
      toast.error('Please select a location for this product');
      return;
    }
    
    // Validate purchase cost if COGS tracking is enabled
    if (cogsTrackingEnabled) {
      const costPrice = typeof newProductData.cost_price === 'string' ? parseFloat(newProductData.cost_price) || 0 : newProductData.cost_price;
      if (!costPrice || costPrice <= 0) {
        toast.error('Purchase Cost is required when COGS tracking is enabled');
        return;
      }
    }

    setIsAddingProduct(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to add products');
        return;
      }

      // Get user data for company_id
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      // Validate location exists (company_id is optional)
      const locationQuery = supabase
        .from('locations')
        .select('id, name, type')
        .eq('id', newProductData.location_id)
        .eq('status', 'active');
      
      if (userData?.company_id) {
        locationQuery.eq('company_id', userData.company_id);
      }
      
      const { data: locationData, error: locationError } = await locationQuery.single();

      if (locationError || !locationData) {
        toast.error('Invalid location selected');
        setIsAddingProduct(false);
        return;
      }

      // Upload image if selected
      let imageUrl = '';
      if (productImageFile) {
        const uploadedUrl = await handleProductImageUpload(productImageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Insert new product with location_id and cost_price
      const costPrice = typeof newProductData.cost_price === 'string' ? parseFloat(newProductData.cost_price) || null : newProductData.cost_price || null;
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert({
          name: newProductData.name,
          sku: newProductData.sku,
          price: price,
          cost_price: costPrice,
          stock_quantity: typeof newProductData.stock_quantity === 'string' ? parseInt(newProductData.stock_quantity) || 0 : newProductData.stock_quantity,
          min_stock_level: typeof newProductData.min_stock_level === 'string' ? parseInt(newProductData.min_stock_level) || 0 : newProductData.min_stock_level,
          brand_id: newProductData.brand_id || null,
          category_id: newProductData.category_id || null,
          location_id: newProductData.location_id,
          image_url: imageUrl || null,
          created_by: user.id,
          company_id: userData?.company_id || null
        })
        .select('*, brands(id, name), categories(id, name)')
        .single();

      if (insertError) {
        console.error('Error adding product:', insertError);
        toast.error('Failed to add product. Please try again.');
        return;
      }

      // Add initial stock history entry if stock_quantity > 0
      const initialStock = typeof newProductData.stock_quantity === 'string' ? parseInt(newProductData.stock_quantity) || 0 : newProductData.stock_quantity;
      if (initialStock > 0) {
        const purchaseCostPerUnit = costPrice || null;
        const purchaseCostTotal = purchaseCostPerUnit ? purchaseCostPerUnit * initialStock : null;
        
        const { error: historyError } = await supabase
          .from('stock_history')
          .insert({
            product_id: newProduct.id,
            action: 'initial_stock',
            quantity: initialStock,
            stock_before: 0,
            stock_after: initialStock,
            reference_type: 'product_creation',
            reference_id: `PRODUCT-${newProduct.id}-${Date.now()}`,
            created_by: user.id,
            purchase_cost_per_unit: purchaseCostPerUnit,
            purchase_cost_total: purchaseCostTotal,
            notes: purchaseCostPerUnit ? `Initial stock of ${initialStock} units added when product "${newProductData.name}" was created. Purchase cost: TSh ${purchaseCostPerUnit.toLocaleString()}/unit` : `Initial stock of ${initialStock} units added when product "${newProductData.name}" was created`
          });

        if (historyError) {
          console.error('Error adding initial stock history:', historyError);
          console.error('History error details:', historyError.message, historyError.details);
          // Don't fail the operation if history fails
        } else {
          console.log('✅ Successfully added initial stock history for product:', newProduct.name, 'with', initialStock, 'units');
        }
      }

      // Force immediate product list refresh
      reloadProducts();

      // Close modal and reset state
      setShowAddProductModal(false);
      setNewProductData({
        name: '',
        sku: '',
        price: '',
        cost_price: '',
        stock_quantity: '',
        min_stock_level: '',
        brand_id: '',
        category_id: '',
        location_id: '',
        image_url: ''
      });
      setProductImageFile(null);
      setProductImagePreview('');

      toast.success(`Successfully added product: ${newProductData.name}`);

    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product. Please try again.');
    } finally {
      setIsAddingProduct(false);
    }
  };

  const openEditProductModal = (product: Product) => {
    setSelectedProductForEdit(product);
    setEditProductData({
      name: product.name,
      sku: product.sku || '',
      price: product.price,
      stock_quantity: product.stock_quantity,
      min_stock_level: product.min_stock_level || '',
      brand_id: product.brand_id || '',
      category_id: product.category_id || '',
      image_url: product.image_url || ''
    });
    setEditImageFile(null);
    setEditImagePreview(product.image_url || '');
    setShowEditProductModal(true);
  };

  const handleEditProduct = async () => {
    if (!selectedProductForEdit) return;

    const price = typeof editProductData.price === 'string' ? parseFloat(editProductData.price) || 0 : editProductData.price;
    if (!editProductData.name || price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsEditingProduct(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to edit products');
        return;
      }

      // Upload new image if selected
      let imageUrl = editProductData.image_url || null;
      if (editImageFile) {
        const uploadedImageUrl = await handleProductImageUpload(editImageFile);
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        }
      }

      // Update product
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update({
          name: editProductData.name,
          sku: editProductData.sku || null,
          price: price,
          stock_quantity: typeof editProductData.stock_quantity === 'string' ? parseInt(editProductData.stock_quantity) || 0 : editProductData.stock_quantity,
          min_stock_level: typeof editProductData.min_stock_level === 'string' ? parseInt(editProductData.min_stock_level) || 0 : editProductData.min_stock_level,
          brand_id: editProductData.brand_id || null,
          category_id: editProductData.category_id || null,
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProductForEdit.id)
        .select('*, brands(id, name), categories(id, name)')
        .single();

      if (updateError) {
        console.error('Error updating product:', updateError);
        toast.error('Failed to update product. Please try again.');
        return;
      }

      // Products state will auto-update via useOptimisticCache real-time subscriptions

      // Reload products to ensure consistency
      setTimeout(() => loadProductsWithVelocity(), 100);

      // Close modal and reset state
      setShowEditProductModal(false);
      setSelectedProductForEdit(null);
      setEditProductData({
        name: '',
        sku: '',
        price: '',
        stock_quantity: '',
        min_stock_level: '',
        brand_id: '',
        category_id: '',
        image_url: ''
      });
      setEditImageFile(null);
      setEditImagePreview('');

      toast.success(`Successfully updated product: ${editProductData.name}`);

    } catch (error) {
      console.error('Error editing product:', error);
      toast.error('Failed to update product. Please try again.');
    } finally {
      setIsEditingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to delete products');
        return;
      }

      // Check if product is used in any orders using database function
      const { data: usageData, error: checkError } = await supabase
        .rpc('check_product_in_orders', { product_uuid: product.id });

      if (checkError) {
        console.error('Error checking product usage:', checkError);
        // Fallback: if function doesn't exist yet, continue with deletion
      }

      const orderCount = usageData?.[0]?.order_count || 0;
      const sampleOrders = usageData?.[0]?.sample_orders || [];
      const isUsedInOrders = orderCount > 0;

      // Show appropriate confirmation message
      let confirmMessage = `Are you sure you want to delete "${product.name}"?`;
      
      if (isUsedInOrders) {
        const displayCount = orderCount > 5 ? `${orderCount}` : `${orderCount}`;
        confirmMessage = `⚠️ WARNING: "${product.name}" has been used in ${displayCount} order(s).\n\n` +
          `This product CANNOT be deleted because it would break order history.\n\n` +
          `Instead, you can:\n` +
          `• Mark it as out of stock (set stock to 0)\n` +
          `• Hide it from the products list\n` +
          `• Update its details if needed\n\n` +
          `Do you want to mark this product as OUT OF STOCK instead?`;
      } else {
        confirmMessage += `\n\nThis action cannot be undone.`;
      }

      if (!confirm(confirmMessage)) {
        return;
      }

      // If product is used in orders, mark as out of stock instead of deleting
      if (isUsedInOrders) {
        // Use optimistic cache update for instant UI feedback
        const success = await updateProduct(product.id, { 
          stock_quantity: 0,
          min_stock_level: 0
        });

        if (success) {
          toast.success(`"${product.name}" marked as out of stock. It can still be viewed in order history.`);
        } else {
          toast.error('Failed to update product. Please try again.');
        }
        return;
      }

      // Product not used in orders - safe to delete
      // Use optimistic cache delete for instant UI removal
      const success = await deleteProductFromCache(product.id);

      if (success) {
        toast.success(`Successfully deleted product: ${product.name}`);
      } else {
        // If optimistic delete failed, check for specific errors
        toast.error('Failed to delete product. It may be referenced in other records.');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setIsAddingCategory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to add categories');
        return;
      }

      // Get user data for company_id
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      // ✨ Use optimistic cache create for instant UI update
      const newCategory = await createCategory({
        name: newCategoryData.name.trim(),
        description: newCategoryData.description.trim() || null,
        created_by: user.id,
        company_id: userData?.company_id || null
      });

      if (newCategory) {
        // Reset form and close modal
        setNewCategoryData({ name: '', description: '' });
        setShowAddCategoryModal(false);
        toast.success(`Successfully added category: ${newCategoryData.name}`);
      } else {
        toast.error('Failed to add category. Please try again.');
      }

    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category. Please try again.');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrandData.name.trim()) {
      toast.error('Please enter a brand name');
      return;
    }

    setIsAddingBrand(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to add brands');
        return;
      }

      // Get user data for company_id
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      // ✨ Use optimistic cache create for instant UI update
      const newBrand = await createBrand({
        name: newBrandData.name.trim(),
        description: newBrandData.description.trim() || null,
        created_by: user.id,
        company_id: userData?.company_id || null
      });

      if (newBrand) {
        // Reset form and close modal
        setNewBrandData({ name: '', description: '' });
        setShowAddBrandModal(false);
        toast.success(`Successfully added brand: ${newBrandData.name}`);
      } else {
        toast.error('Failed to add brand. Please try again.');
      }

    } catch (error) {
      console.error('Error adding brand:', error);
      toast.error('Failed to add brand. Please try again.');
    } finally {
      setIsAddingBrand(false);
    }
  };

  const categoryOptions = [{ id: 'all', name: 'All Categories' }, ...categories];

  const printOrder = (order: SalesHubOrder) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const orderDate = new Date(order.created_at).toLocaleDateString();
      const items = order.items || [];

      printWindow.document.write(`
        <html>
          <head>
            <title>Order ${order.order_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
              .order-title { font-size: 24px; font-weight: bold; }
              .customer-info { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .totals { margin-top: 20px; text-align: right; }
              .total-row { font-weight: bold; font-size: 18px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="order-title">COPCCA CRM - SALES ORDER</div>
              <div>Order #: ${order.order_number}</div>
              <div>Date: ${orderDate}</div>
            </div>

            ${selectedCustomer ? `
            <div class="customer-info">
              <strong>Bill To:</strong><br>
              ${selectedCustomer.name}<br>
              ${selectedCustomer.email}<br>
              ${selectedCustomer.phone ? `Phone: ${selectedCustomer.phone}<br>` : ''}
            </div>
            ` : ''}

            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: OrderItem) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.sku}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unit_price)}</td>
                    <td>${formatCurrency(item.subtotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div>Subtotal: ${formatCurrency(order.subtotal)}</div>
              <div>Tax (18%): ${formatCurrency(order.tax_amount)}</div>
              ${order.discount_amount > 0 ? `<div>Discount ${order.discount_type === 'percentage' ? `(${order.discount_value}%)` : ''}: -${formatCurrency(order.discount_amount)}</div>` : ''}
              <div class="total-row">Total: ${formatCurrency(order.total_amount)}</div>
              <div>Payment Method: ${order.payment_method}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

const CustomerBuyingPatternsSection = () => {
  const [analysisTab, setAnalysisTab] = useState<'customer' | 'product'>('customer');
  const [dateRange, setDateRange] = useState('this-year');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [productBreakdownDateRange, setProductBreakdownDateRange] = useState('this-month');
  const [ matrixView, setMatrixView] = useState(false);
  
  // Local selected customer state for this section
  const [selectedCustomerForPatterns, setSelectedCustomerForPatterns] = useState<{
    id: string;
    name: string;
    totalItems: number;
    totalValue: number;
    statusColor: string;
    status: string;
  } | null>(null);

  // Product sales data
  const [productSales, setProductSales] = useState<Array<{
    id: string;
    productName: string;
    quantity: number;
    totalValue: number;
    salesCount: number;
    lastSale: string;
    customerName: string;
    dayOfWeek: string;
    timeOfDay: string;
  }>>([]);

  // Customer data
  const [customers, setCustomers] = useState<Array<{
    id: string;
    name: string;
    totalItems: number;
    totalValue: number;
    statusColor: string;
    status: string;
  }>>([]);

  // Customer products data
  const [customerProducts, setCustomerProducts] = useState<Array<{
    product: string;
    frequency: string;
    lastPurchase: string;
    qty: number;
    trend: string;
  }>>([]);

  // AI insights
  const [aiInsights, setAiInsights] = useState<Array<{
    title: string;
    message: string;
    actions: string[];
  }>>([]);

  // Matrix data
  const [matrixData, setMatrixData] = useState<{
    products: string[];
    customerProducts: Map<string, Map<string, number>>;
  }>({ products: [], customerProducts: new Map() });

  // KPI values
  const [kpis, setKpis] = useState({
    topCustomer: 'Loading...',
    topProduct: 'Loading...',
    repeatRate: '0%',
    avgTime: '0 days'
  });

  useEffect(() => {
    loadCustomerBuyingPatterns();
  }, [dateRange, customerFilter]);

  const loadCustomerBuyingPatterns = async () => {
    try {
      // Calculate date range
      let endDate = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'this-week':
          startDate.setDate(startDate.getDate() - startDate.getDay());
          break;
        case 'this-month':
          startDate.setDate(1);
          break;
        case 'january':
          startDate = new Date(startDate.getFullYear(), 0, 1);
          endDate = new Date(startDate.getFullYear(), 1, 0);
          break;
        case 'february':
          startDate = new Date(startDate.getFullYear(), 1, 1);
          endDate = new Date(startDate.getFullYear(), 2, 0);
          break;
        case 'march':
          startDate = new Date(startDate.getFullYear(), 2, 1);
          endDate = new Date(startDate.getFullYear(), 3, 0);
          break;
        case 'april':
          startDate = new Date(startDate.getFullYear(), 3, 1);
          endDate = new Date(startDate.getFullYear(), 4, 0);
          break;
        case 'may':
          startDate = new Date(startDate.getFullYear(), 4, 1);
          endDate = new Date(startDate.getFullYear(), 5, 0);
          break;
        case 'june':
          startDate = new Date(startDate.getFullYear(), 5, 1);
          endDate = new Date(startDate.getFullYear(), 6, 0);
          break;
        case 'july':
          startDate = new Date(startDate.getFullYear(), 6, 1);
          endDate = new Date(startDate.getFullYear(), 7, 0);
          break;
        case 'august':
          startDate = new Date(startDate.getFullYear(), 7, 1);
          endDate = new Date(startDate.getFullYear(), 8, 0);
          break;
        case 'september':
          startDate = new Date(startDate.getFullYear(), 8, 1);
          endDate = new Date(startDate.getFullYear(), 9, 0);
          break;
        case 'october':
          startDate = new Date(startDate.getFullYear(), 9, 1);
          endDate = new Date(startDate.getFullYear(), 10, 0);
          break;
        case 'november':
          startDate = new Date(startDate.getFullYear(), 10, 1);
          endDate = new Date(startDate.getFullYear(), 11, 0);
          break;
        case 'december':
          startDate = new Date(startDate.getFullYear(), 11, 1);
          endDate = new Date(startDate.getFullYear() + 1, 0, 0);
          break;
        case 'q1':
          startDate = new Date(startDate.getFullYear(), 0, 1);
          endDate = new Date(startDate.getFullYear(), 3, 0);
          break;
        case 'q2':
          startDate = new Date(startDate.getFullYear(), 3, 1);
          endDate = new Date(startDate.getFullYear(), 6, 0);
          break;
        case 'q3':
          startDate = new Date(startDate.getFullYear(), 6, 1);
          endDate = new Date(startDate.getFullYear(), 9, 0);
          break;
        case 'q4':
          startDate = new Date(startDate.getFullYear(), 9, 1);
          endDate = new Date(startDate.getFullYear() + 1, 0, 0);
          break;
        case 'last-6-months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case 'this-year':
          startDate = new Date(startDate.getFullYear(), 0, 1);
          break;
        default:
          startDate.setDate(1);
          break;
      }

      // Fetch orders from the date range
      const { data: ordersData, error: ordersError } = await supabase
        .from('sales_hub_orders')
        .select(`
          *,
          sales_hub_customers (
            id,
            name,
            company_name
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      console.log('📊 Customer Buying Patterns - Date Range:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ordersFound: ordersData?.length || 0,
        error: ordersError?.message
      });

      if (ordersError) {
        console.error('Error loading orders:', ordersError);
        toast.error('Failed to load customer buying patterns: ' + ordersError.message);
        return;
      }

      const orders = ordersData || [];

      if (orders.length === 0) {
        console.log('⚠️ No orders found in date range. Complete some orders to see patterns.');
      }

      // Process customer data
      const customerMap = new Map<string, {
        id: string;
        name: string;
        totalItems: number;
        totalValue: number;
        orderCount: number;
        lastOrderDate: string;
        orders: typeof orders;
      }>();

      const productMap = new Map<string, {
        name: string;
        totalQty: number;
        totalValue: number;
        customers: Set<string>;
      }>();

      // Aggregate data
      orders.forEach(order => {
        const customerName = (order as any).sales_hub_customers?.name || 
                           (order as any).sales_hub_customers?.company_name || 
                           'Walk-in Customer';
        
        // Use customer name as key to aggregate Walk-in Customers
        const customerKey = customerName === 'Walk-in Customer' ? 'walk-in-aggregate' : order.customer_id;

        // Update customer map
        if (!customerMap.has(customerKey)) {
          customerMap.set(customerKey, {
            id: customerKey,
            name: customerName,
            totalItems: 0,
            totalValue: 0,
            orderCount: 0,
            lastOrderDate: order.created_at,
            orders: []
          });
        }

        const customerData = customerMap.get(customerKey)!;
        
        // Calculate total items from order items
        const orderItemsCount = order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
        customerData.totalItems += orderItemsCount;
        customerData.totalValue += order.total_amount;
        customerData.orderCount += 1;
        customerData.orders.push(order);

        // Update product map
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const productName = item.name || 'Unknown Product';
            if (!productMap.has(productName)) {
              productMap.set(productName, {
                name: productName,
                totalQty: 0,
                totalValue: 0,
                customers: new Set()
              });
            }
            const productData = productMap.get(productName)!;
            productData.totalQty += item.quantity;
            productData.totalValue += item.subtotal;
            productData.customers.add(customerKey);
          });
        }
      });

      // Convert to array and sort by total value
      const customersArray = Array.from(customerMap.values())
        .map(customer => ({
          id: customer.id,
          name: customer.name,
          totalItems: customer.totalItems,
          totalValue: customer.totalValue,
          statusColor: customer.orderCount >= 5 ? '⭐' : customer.orderCount >= 3 ? '●' : '○',
          status: customer.orderCount >= 5 ? 'vip' : customer.orderCount >= 3 ? 'regular' : 'new'
        }))
        .sort((a, b) => b.totalValue - a.totalValue);

      setCustomers(customersArray);
      
      // AUTO-SELECT FIRST CUSTOMER (Walk-in if that's where all sales went)
      // This prevents "Select a customer" message when data exists
      if (customersArray.length > 0 && !selectedCustomerForPatterns) {
        setSelectedCustomerForPatterns(customersArray[0]);
        console.log('✅ Auto-selected customer:', customersArray[0].name);
      }

      // Calculate KPIs
      const topCustomerData = customersArray[0];
      const topProductData = Array.from(productMap.values())
        .sort((a, b) => b.totalValue - a.totalValue)[0];

      // Calculate repeat rate (customers with more than 1 order)
      const repeatCustomers = Array.from(customerMap.values())
        .filter(c => c.orderCount > 1).length;
      const repeatRate = customersArray.length > 0 
        ? Math.round((repeatCustomers / customersArray.length) * 100) 
        : 0;

      // Calculate average time between orders
      let totalDaysBetweenOrders = 0;
      let orderPairCount = 0;

      customerMap.forEach(customer => {
        if (customer.orders.length >= 2) {
          const sortedOrders = [...customer.orders].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          for (let i = 1; i < sortedOrders.length; i++) {
            const daysDiff = Math.abs(
              (new Date(sortedOrders[i].created_at).getTime() - 
               new Date(sortedOrders[i - 1].created_at).getTime()) / 
              (1000 * 60 * 60 * 24)
            );
            totalDaysBetweenOrders += daysDiff;
            orderPairCount++;
          }
        }
      });

      const avgDays = orderPairCount > 0 
        ? (totalDaysBetweenOrders / orderPairCount).toFixed(1) 
        : '0';

      setKpis({
        topCustomer: topCustomerData?.name || 'No data',
        topProduct: topProductData?.name || 'No data',
        repeatRate: `${repeatRate}%`,
        avgTime: `${avgDays} days`
      });

      // Generate AI insights based on real patterns
      const insights: Array<{
        title: string;
        message: string;
        actions: string[];
      }> = [];

      // Insight 1: Top customer prediction
      if (topCustomerData && customerMap.get(topCustomerData.id)) {
        const customerData = customerMap.get(topCustomerData.id)!;
        if (customerData.orderCount >= 2) {
          insights.push({
            title: `${topCustomerData.name} - Reorder Prediction`,
            message: `Based on ${customerData.orderCount} orders, likely to reorder within ${avgDays} days`,
            actions: ['Send Reminder', 'Prepare Stock']
          });
        }
      }

      // Insight 2: Product bundling opportunity
      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.totalQty - a.totalQty)
        .slice(0, 2);
      
      if (topProducts.length >= 2) {
        insights.push({
          title: 'Bundle Opportunity Detected',
          message: `${topProducts[0].name} and ${topProducts[1].name} are popular. Consider creating a bundle offer.`,
          actions: ['Create Bundle', 'Set Discount']
        });
      }

      // Insight 3: Customer engagement
      const lowActivityCustomers = customersArray.filter(c => {
        const customerData = customerMap.get(c.id);
        if (!customerData) return false;
        const daysSinceLastOrder = Math.abs(
          (new Date().getTime() - new Date(customerData.lastOrderDate).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        return daysSinceLastOrder > 14 && customerData.orderCount >= 2;
      });

      if (lowActivityCustomers.length > 0) {
        insights.push({
          title: 'Re-engagement Opportunity',
          message: `${lowActivityCustomers.length} customer(s) haven't ordered in 2+ weeks`,
          actions: ['Send Offer', 'Call Customer']
        });
      }

      setAiInsights(insights);

      // Build matrix data - exclude demo products
      const demoProducts = ['Training Package', 'CRM Software License', 'Demo Product', 'Sample Product'];
      const uniqueProducts = Array.from(productMap.keys())
        .filter(productName => !demoProducts.some(demo => productName.toLowerCase().includes(demo.toLowerCase())))
        .slice(0, 10); // Top 10 real products
      
      const customerProductMap = new Map<string, Map<string, number>>();

      orders.forEach(order => {
        const customerName = (order as any).sales_hub_customers?.name || 
                           (order as any).sales_hub_customers?.company_name || 
                           'Walk-in Customer';
        
        // Use same aggregation key as customer list
        const customerKey = customerName === 'Walk-in Customer' ? 'walk-in-aggregate' : order.customer_id;
        
        if (!customerProductMap.has(customerKey)) {
          customerProductMap.set(customerKey, new Map());
        }
        const customerProds = customerProductMap.get(customerKey)!;
        
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const productName = item.name || 'Unknown Product';
            if (uniqueProducts.includes(productName)) {
              customerProds.set(productName, (customerProds.get(productName) || 0) + item.quantity);
            }
          });
        }
      });

      setMatrixData({ products: uniqueProducts, customerProducts: customerProductMap });

    } catch (error) {
      console.error('Error loading customer buying patterns:', error);
    }
  };

  // Load product breakdown for selected customer
  useEffect(() => {
    if (selectedCustomerForPatterns) {
      loadCustomerProducts(selectedCustomerForPatterns.id);
    } else {
      setCustomerProducts([]);
    }
  }, [selectedCustomerForPatterns, productBreakdownDateRange]);

  const loadCustomerProducts = async (customerId: string) => {
    try {
      let endDate = new Date();
      let startDate = new Date();
      
      // Calculate date range based on productBreakdownDateRange
      switch (productBreakdownDateRange) {
        case 'this-week':
          startDate.setDate(startDate.getDate() - startDate.getDay());
          break;
        case 'this-month':
          startDate.setDate(1);
          break;
        case 'january':
          startDate = new Date(startDate.getFullYear(), 0, 1);
          endDate = new Date(startDate.getFullYear(), 1, 0);
          break;
        case 'february':
          startDate = new Date(startDate.getFullYear(), 1, 1);
          endDate = new Date(startDate.getFullYear(), 2, 0);
          break;
        case 'march':
          startDate = new Date(startDate.getFullYear(), 2, 1);
          endDate = new Date(startDate.getFullYear(), 3, 0);
          break;
        case 'april':
          startDate = new Date(startDate.getFullYear(), 3, 1);
          endDate = new Date(startDate.getFullYear(), 4, 0);
          break;
        case 'may':
          startDate = new Date(startDate.getFullYear(), 4, 1);
          endDate = new Date(startDate.getFullYear(), 5, 0);
          break;
        case 'june':
          startDate = new Date(startDate.getFullYear(), 5, 1);
          endDate = new Date(startDate.getFullYear(), 6, 0);
          break;
        case 'july':
          startDate = new Date(startDate.getFullYear(), 6, 1);
          endDate = new Date(startDate.getFullYear(), 7, 0);
          break;
        case 'august':
          startDate = new Date(startDate.getFullYear(), 7, 1);
          endDate = new Date(startDate.getFullYear(), 8, 0);
          break;
        case 'september':
          startDate = new Date(startDate.getFullYear(), 8, 1);
          endDate = new Date(startDate.getFullYear(), 9, 0);
          break;
        case 'october':
          startDate = new Date(startDate.getFullYear(), 9, 1);
          endDate = new Date(startDate.getFullYear(), 10, 0);
          break;
        case 'november':
          startDate = new Date(startDate.getFullYear(), 10, 1);
          endDate = new Date(startDate.getFullYear(), 11, 0);
          break;
        case 'december':
          startDate = new Date(startDate.getFullYear(), 11, 1);
          endDate = new Date(startDate.getFullYear() + 1, 0, 0);
          break;
        case 'q1':
          startDate = new Date(startDate.getFullYear(), 0, 1);
          endDate = new Date(startDate.getFullYear(), 3, 0);
          break;
        case 'q2':
          startDate = new Date(startDate.getFullYear(), 3, 1);
          endDate = new Date(startDate.getFullYear(), 6, 0);
          break;
        case 'q3':
          startDate = new Date(startDate.getFullYear(), 6, 1);
          endDate = new Date(startDate.getFullYear(), 9, 0);
          break;
        case 'q4':
          startDate = new Date(startDate.getFullYear(), 9, 1);
          endDate = new Date(startDate.getFullYear() + 1, 0, 0);
          break;
        case 'last-6-months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case 'this-year':
          startDate = new Date(startDate.getFullYear(), 0, 1);
          break;
        default:
          startDate.setDate(1);
          break;
      }

      let ordersData;
      let error;

      // If it's the aggregated Walk-in Customer, fetch all orders and filter for walk-ins
      if (customerId === 'walk-in-aggregate') {
        const result = await supabase
          .from('sales_hub_orders')
          .select(`
            *,
            sales_hub_customers (
              id,
              name,
              company_name
            )
          `)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });
        
        ordersData = result.data;
        error = result.error;
        
        // Filter for Walk-in Customers (customer_id is null OR customer name is "Walk-in Customer")
        ordersData = ordersData?.filter(order => 
          !order.customer_id || 
          (order as any).sales_hub_customers?.name === 'Walk-in Customer'
        );
        
        console.log('📊 Walk-in Customer orders found:', ordersData?.length);
      } else {
        const result = await supabase
          .from('sales_hub_orders')
          .select('*')
          .eq('customer_id', customerId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });
        
        ordersData = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error loading customer products:', error);
        return;
      }

      const orders = ordersData || [];
      const productMap = new Map<string, {
        name: string;
        totalQty: number;
        orderCount: number;
        lastOrderDate: string;
      }>();

      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const productName = item.name || 'Unknown Product';
            if (!productMap.has(productName)) {
              productMap.set(productName, {
                name: productName,
                totalQty: 0,
                orderCount: 0,
                lastOrderDate: order.created_at
              });
            }
            const productData = productMap.get(productName)!;
            productData.totalQty += item.quantity;
            productData.orderCount += 1;
            if (new Date(order.created_at) > new Date(productData.lastOrderDate)) {
              productData.lastOrderDate = order.created_at;
            }
          });
        }
      });

      const productsArray = Array.from(productMap.values())
        .map(product => {
          const daysSinceLastOrder = Math.abs(
            (new Date().getTime() - new Date(product.lastOrderDate).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          const frequency = product.orderCount >= 4 ? 'Weekly' : 
                           product.orderCount >= 2 ? 'Bi-weekly' : 'Monthly';
          const lastPurchase = daysSinceLastOrder < 1 ? 'Today' :
                              daysSinceLastOrder < 2 ? '1 day ago' :
                              `${Math.floor(daysSinceLastOrder)} days ago`;
          const trend = product.orderCount >= 4 ? '↑' : 
                       product.orderCount >= 2 ? '→' : '↓';

          return {
            product: product.name,
            frequency,
            lastPurchase,
            qty: product.totalQty,
            trend
          };
        })
        .sort((a, b) => b.qty - a.qty);

      setCustomerProducts(productsArray);
    } catch (error) {
      console.error('Error loading customer products:', error);
    }
  };

  // Load product sales data (for Product Analysis tab)
  const loadProductSales = async () => {
    try {
      let endDate = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'this-week':
          startDate.setDate(startDate.getDate() - startDate.getDay());
          break;
        case 'this-month':
          startDate.setDate(1);
          break;
        case 'january':
          startDate = new Date(startDate.getFullYear(), 0, 1);
          endDate = new Date(startDate.getFullYear(), 1, 0);
          break;
        case 'february':
          startDate = new Date(startDate.getFullYear(), 1, 1);
          endDate = new Date(startDate.getFullYear(), 2, 0);
          break;
        case 'march':
          startDate = new Date(startDate.getFullYear(), 2, 1);
          endDate = new Date(startDate.getFullYear(), 3, 0);
          break;
        case 'april':
          startDate = new Date(startDate.getFullYear(), 3, 1);
          endDate = new Date(startDate.getFullYear(), 4, 0);
          break;
        case 'may':
          startDate = new Date(startDate.getFullYear(), 4, 1);
          endDate = new Date(startDate.getFullYear(), 5, 0);
          break;
        case 'june':
          startDate = new Date(startDate.getFullYear(), 5, 1);
          endDate = new Date(startDate.getFullYear(), 6, 0);
          break;
        case 'july':
          startDate = new Date(startDate.getFullYear(), 6, 1);
          endDate = new Date(startDate.getFullYear(), 7, 0);
          break;
        case 'august':
          startDate = new Date(startDate.getFullYear(), 7, 1);
          endDate = new Date(startDate.getFullYear(), 8, 0);
          break;
        case 'september':
          startDate = new Date(startDate.getFullYear(), 8, 1);
          endDate = new Date(startDate.getFullYear(), 9, 0);
          break;
        case 'october':
          startDate = new Date(startDate.getFullYear(), 9, 1);
          endDate = new Date(startDate.getFullYear(), 10, 0);
          break;
        case 'november':
          startDate = new Date(startDate.getFullYear(), 10, 1);
          endDate = new Date(startDate.getFullYear(), 11, 0);
          break;
        case 'december':
          startDate = new Date(startDate.getFullYear(), 11, 1);
          endDate = new Date(startDate.getFullYear() + 1, 0, 0);
          break;
        case 'q1':
          startDate = new Date(startDate.getFullYear(), 0, 1);
          endDate = new Date(startDate.getFullYear(), 3, 0);
          break;
        case 'q2':
          startDate = new Date(startDate.getFullYear(), 3, 1);
          endDate = new Date(startDate.getFullYear(), 6, 0);
          break;
        case 'q3':
          startDate = new Date(startDate.getFullYear(), 6, 1);
          endDate = new Date(startDate.getFullYear(), 9, 0);
          break;
        case 'q4':
          startDate = new Date(startDate.getFullYear(), 9, 1);
          endDate = new Date(startDate.getFullYear() + 1, 0, 0);
          break;
        case 'last-6-months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case 'this-year':
          startDate = new Date(startDate.getFullYear(), 0, 1);
          break;
        default:
          startDate.setDate(1);
          break;
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from('sales_hub_orders')
        .select(`
          *,
          sales_hub_customers (
            id,
            name,
            company_name
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error loading product sales:', ordersError);
        return;
      }

      const orders = ordersData || [];
      const productSalesMap = new Map<string, {
        productName: string;
        quantity: number;
        totalValue: number;
        salesCount: number;
        sales: Array<{
          date: string;
          customerName: string;
          quantity: number;
          value: number;
        }>;
      }>();

      // Aggregate sales by product
      orders.forEach(order => {
        const customerName = (order as any).sales_hub_customers?.name || 
                           (order as any).sales_hub_customers?.company_name || 
                           'Walk-in Customer';
        
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const productName = item.name || 'Unknown Product';
            
            if (!productSalesMap.has(productName)) {
              productSalesMap.set(productName, {
                productName,
                quantity: 0,
                totalValue: 0,
                salesCount: 0,
                sales: []
              });
            }
            
            const productData = productSalesMap.get(productName)!;
            productData.quantity += item.quantity;
            productData.totalValue += item.subtotal;
            productData.salesCount += 1;
            productData.sales.push({
              date: order.created_at,
              customerName,
              quantity: item.quantity,
              value: item.subtotal
            });
          });
        }
      });

      // Convert to array and add day/time info
      const productsArray = Array.from(productSalesMap.values())
        .flatMap(product => 
          product.sales.map(sale => {
            const saleDate = new Date(sale.date);
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeek = days[saleDate.getDay()];
            const timeOfDay = saleDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            const dateFormatted = saleDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

            return {
              id: `${product.productName}-${sale.date}`,
              productName: product.productName,
              quantity: sale.quantity,
              totalValue: sale.value,
              salesCount: 1,
              lastSale: dateFormatted,
              customerName: sale.customerName,
              dayOfWeek,
              timeOfDay
            };
          })
        )
        .sort((a, b) => new Date(b.lastSale).getTime() - new Date(a.lastSale).getTime());

      setProductSales(productsArray);
    } catch (error) {
      console.error('Error loading product sales:', error);
    }
  };

  // Load product sales when tab changes or date range changes
  useEffect(() => {
    if (analysisTab === 'product') {
      loadProductSales();
    }
  }, [analysisTab, dateRange]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">📊 Selling & Buying Pattern</h3>
        <p className="text-slate-600">Track customers and products - who buys what, when, and how often</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setAnalysisTab('customer')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            analysisTab === 'customer'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-slate-600 border border-slate-300 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>Customer Analysis</span>
          </div>
          <div className="text-xs mt-1 opacity-80">Who buys what, how often, and when</div>
        </button>
        
        <button
          onClick={() => setAnalysisTab('product')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            analysisTab === 'product'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-white text-slate-600 border border-slate-300 hover:border-green-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <span>Product Analysis</span>
          </div>
          <div className="text-xs mt-1 opacity-80">Which sold, how often, and when</div>
        </button>
      </div>

      {/* Customer Analysis Tab */}
      {analysisTab === 'customer' && (
      <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer List (Left Panel) */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Customer Overview</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {customers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No customer data available for this period</p>
                <p className="text-sm text-slate-500 mt-2">Complete some orders to see customer buying patterns</p>
              </div>
            ) : (
              customers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomerForPatterns(customer)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCustomerForPatterns?.id === customer.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-slate-900">{customer.name}</h5>
                      <p className="text-sm text-slate-600">{customer.totalItems} pcs • {formatCurrency(customer.totalValue)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg">{customer.statusColor}</div>
                      <div className="text-xs text-slate-500 capitalize">{customer.status}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Product Breakdown & AI Insights (Right Panel) */}
        <div className="space-y-6">
          {selectedCustomerForPatterns ? (
            <>
              {/* Product Breakdown */}
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold">Product Breakdown: {selectedCustomerForPatterns.name}</h4>
                  <select
                    value={productBreakdownDateRange}
                    onChange={(e) => setProductBreakdownDateRange(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="this-week">This Week</option>
                    <option value="this-month">This Month</option>
                    <option value="january">January</option>
                    <option value="february">February</option>
                    <option value="march">March</option>
                    <option value="april">April</option>
                    <option value="may">May</option>
                    <option value="june">June</option>
                    <option value="july">July</option>
                    <option value="august">August</option>
                    <option value="september">September</option>
                    <option value="october">October</option>
                    <option value="november">November</option>
                    <option value="december">December</option>
                    <option value="q1">Q1 (Jan-Mar)</option>
                    <option value="q2">Q2 (Apr-Jun)</option>
                    <option value="q3">Q3 (Jul-Sep)</option>
                    <option value="q4">Q4 (Oct-Dec)</option>
                    <option value="last-6-months">Last 6 Months</option>
                    <option value="this-year">This Year</option>
                  </select>
                </div>
                <div className="space-y-3">
                  {customerProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">No product data available</p>
                      <p className="text-sm text-slate-500 mt-2">This customer hasn't purchased any products in the selected period</p>
                    </div>
                  ) : (
                    customerProducts.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border border-slate-200 rounded-lg">
                        <div>
                          <h5 className="font-medium">{item.product}</h5>
                          <p className="text-sm text-slate-600">{item.frequency} • {item.lastPurchase}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{item.qty} pcs</div>
                          <div className="text-lg">{item.trend}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* AI Insights Panel */}
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <h4 className="text-lg font-semibold mb-4 flex items-center text-purple-900">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Insights
                </h4>
                <div className="space-y-4">
                  {aiInsights.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-800">No insights available yet</p>
                      <p className="text-sm text-purple-600 mt-2">Complete more orders to generate AI-powered insights</p>
                    </div>
                  ) : (
                    aiInsights.map((insight, index) => (
                      <div key={index} className="p-4 bg-white rounded-lg border border-purple-200">
                        <h5 className="font-semibold text-purple-900 mb-2">{insight.title}</h5>
                        <p className="text-sm text-purple-800">{insight.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Matrix View Toggle */}
              <Card className="p-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Customer × Product Matrix</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMatrixView(!matrixView)}
                  >
                    {matrixView ? 'Hide Matrix' : 'Show Matrix'}
                  </Button>
                </div>
                {matrixView && (
                  <div className="mt-4 overflow-x-auto">
                    {matrixData.products.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-slate-600">No matrix data available</p>
                        <p className="text-sm text-slate-500 mt-2">Complete orders to see customer-product relationships</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 sticky left-0 bg-white">Customer / Product</th>
                            {matrixData.products.map((product, idx) => (
                              <th key={idx} className="text-center py-2 px-2 min-w-[80px]">
                                {product.length > 15 ? product.substring(0, 15) + '...' : product}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {customers.slice(0, 10).map((customer) => {
                            const customerProds = matrixData.customerProducts.get(customer.id) || new Map();
                            return (
                              <tr key={customer.id} className="border-b hover:bg-slate-50">
                                <td className="py-2 px-3 font-medium sticky left-0 bg-white">{customer.name}</td>
                                {matrixData.products.map((product, idx) => {
                                  const qty = customerProds.get(product) || 0;
                                  const bgColor = qty > 50 ? 'bg-green-100' : qty > 20 ? 'bg-blue-100' : qty > 0 ? 'bg-yellow-50' : '';
                                  return (
                                    <td key={idx} className={`text-center py-2 px-2 ${bgColor}`}>
                                      {qty > 0 ? qty : '-'}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Select a customer to view their buying patterns</p>
            </Card>
          )}
        </div>
      </div>

      {/* KPI Mini-cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-600 mb-1">Top Customer</div>
          <div className="font-semibold text-lg">{kpis.topCustomer}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-600 mb-1">Top Product</div>
          <div className="font-semibold text-lg">{kpis.topProduct}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-600 mb-1">Repeat Rate</div>
          <div className="font-semibold text-lg">{kpis.repeatRate}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-600 mb-1">Avg Time</div>
          <div className="font-semibold text-lg">{kpis.avgTime}</div>
        </Card>
      </div>

      {/* AI Loop Visualization */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h4 className="text-lg font-semibold mb-4 text-center">Data Flow</h4>
        <div className="flex justify-center items-center space-x-4 text-sm">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mb-2">1</div>
            <div>Invoices</div>
          </div>
          <div className="text-2xl">→</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mb-2">2</div>
            <div>Customer Data</div>
          </div>
          <div className="text-2xl">→</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mb-2">3</div>
            <div>Patterns</div>
          </div>
          <div className="text-2xl">→</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mb-2">4</div>
            <div>Insights</div>
          </div>
          <div className="text-2xl">→</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold mb-2">5</div>
            <div>Actions</div>
          </div>
        </div>
        <p className="text-center text-slate-600 mt-4 text-sm">
          Real-time data analysis creates actionable business insights.
        </p>
      </Card>
      </div>
      )}

      {/* Product Analysis Tab */}
      {analysisTab === 'product' && (
        <div className="space-y-6">
          {/* Date Range and Product Filter */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h4 className="text-lg font-semibold">Product Sales Timeline</h4>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {/* Product Filter */}
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
                >
                  <option value="all">📦 All Products</option>
                  {Array.from(new Set(productSales.map(s => s.productName)))
                    .sort()
                    .map(productName => (
                      <option key={productName} value={productName}>
                        {productName}
                      </option>
                    ))}
                </select>
                {/* Date Range Filter */}
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-w-[150px]"
                >
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="january">January</option>
                  <option value="february">February</option>
                  <option value="march">March</option>
                  <option value="april">April</option>
                  <option value="may">May</option>
                  <option value="june">June</option>
                  <option value="july">July</option>
                  <option value="august">August</option>
                  <option value="september">September</option>
                  <option value="october">October</option>
                  <option value="november">November</option>
                  <option value="december">December</option>
                  <option value="q1">Q1 (Jan-Mar)</option>
                  <option value="q2">Q2 (Apr-Jun)</option>
                  <option value="q3">Q3 (Jul-Sep)</option>
                  <option value="q4">Q4 (Oct-Dec)</option>
                  <option value="last-6-months">Last 6 Months</option>
                  <option value="this-year">This Year</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Product Sales Table */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Products Sold - When & To Whom
              {productFilter !== 'all' && (
                <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {productFilter}
                </span>
              )}
            </h4>
            
            {(() => {
              // Apply product filter
              const filteredSales = productFilter === 'all' 
                ? productSales 
                : productSales.filter(sale => sale.productName === productFilter);
              
              return filteredSales.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">
                    {productFilter === 'all' ? 'No product sales data available' : `No sales found for ${productFilter}`}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    {productFilter === 'all' ? 'Complete some orders to see product sales patterns' : 'Try selecting a different product or date range'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b-2 border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Product</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Quantity</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Value</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Customer</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Day</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredSales.map((sale, index) => (
                      <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{sale.productName}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {sale.quantity} pcs
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          {formatCurrency(sale.totalValue)}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {sale.customerName}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {sale.lastSale}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                            {sale.dayOfWeek}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                            {sale.timeOfDay}
                          </span>
                        </td>
                      </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </Card>

          {/* Product Sales Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="text-sm text-slate-600 mb-1">Total Sales Events</div>
              <div className="font-bold text-2xl text-green-700">
                {(() => {
                  const filteredSales = productFilter === 'all' 
                    ? productSales 
                    : productSales.filter(sale => sale.productName === productFilter);
                  return filteredSales.length;
                })()}
              </div>
            </Card>
            <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="text-sm text-slate-600 mb-1">Unique Products</div>
              <div className="font-bold text-2xl text-blue-700">
                {(() => {
                  const filteredSales = productFilter === 'all' 
                    ? productSales 
                    : productSales.filter(sale => sale.productName === productFilter);
                  return new Set(filteredSales.map(s => s.productName)).size;
                })()}
              </div>
            </Card>
            <Card className="p-4 text-center bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="text-sm text-slate-600 mb-1">Total Revenue</div>
              <div className="font-bold text-2xl text-purple-700">
                {(() => {
                  const filteredSales = productFilter === 'all' 
                    ? productSales 
                    : productSales.filter(sale => sale.productName === productFilter);
                  return formatCurrency(filteredSales.reduce((sum, s) => sum + s.totalValue, 0));
                })()}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

  const ProductsSection = () => (
    <div className="space-y-6">
      {/* Search, Filter & Actions Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categoryOptions.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.id === 'all' ? '📂 All Categories' : `📦 ${cat.name}`}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">📊 All Stock Status</option>
            <option value="in-stock">🟢 In Stock</option>
            <option value="low-stock">🟡 Low Stock</option>
            <option value="out-of-stock">🔴 Out of Stock</option>
          </select>

          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">🏷️ All Brands</option>
            {brands.map(brand => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>

          <Button
            onClick={() => setShowAddProductModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Add New Product
          </Button>
        </div>
      </Card>

      {/* Product Count Indicator */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          {filteredProducts.length === products.length
            ? `Showing ${products.length} product${products.length !== 1 ? 's' : ''}`
            : `Showing ${filteredProducts.length} of ${products.length} product${products.length !== 1 ? 's' : ''}`
          }
        </div>
        {categoryFilter !== 'all' && (
          <div className="text-sm text-blue-600 font-medium">
            📂 {categoryOptions.find(cat => cat.id === categoryFilter)?.name || 'Selected Category'}
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="space-y-4">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={addToCartWithQuantity}
            formatCurrency={formatCurrency}
            onEdit={(product) => openEditProductModal(product)}
            onDelete={(product) => handleDeleteProduct(product)}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No products found matching your criteria</p>
        </div>
      )}
    </div>
  );

  const CartsInvoiceSection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-900 mb-2">💰 Sales Execution</h3>
        <p className="text-slate-600">Complete your sales and generate invoices</p>
      </div>

      {/* Active Cart Panel */}
      <div className="max-w-4xl mx-auto">
        <Card className="p-4 cart-print-area" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
            <h4 className="text-lg font-semibold mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Active Cart ({cart.length} items)
              </div>
            </h4>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Your cart is empty</p>
                <p className="text-sm text-slate-500">Add products from the Products tab</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {cart.map((item, index) => {
                  const itemKey = `${item.product.id}-${index}-${item.price}`;
                  return (
                    <CartItem
                      key={itemKey}
                      itemKey={itemKey}
                      item={item}
                      onUpdatePrice={updatePrice}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                      formatCurrency={formatCurrency}
                      getStockStatus={getStockStatus}
                    />
                  );
                })}
              </div>
            )}

            {/* Order Summary */}
            {cart.length > 0 && (
              <div className="border-t pt-4 space-y-4">
                {/* Order Summary Heading */}
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-slate-900">📋 Order Summary</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCompanySettingsModal(true)}
                    className="text-xs text-slate-600 hover:text-slate-900"
                    title="Edit Company Information"
                  >
                    ⚙️ Company Info
                  </Button>
                </div>

                {/* Customer Selection Section */}
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-slate-700">Customer</h5>

                  {/* Customer Type Selection */}
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="customerType"
                          value="walk-in"
                          checked={customerSelectionMode === 'walk-in'}
                          onChange={() => {
                            setCustomerSelectionMode('walk-in');
                            setSelectedCustomer(null);
                          }}
                          className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-slate-700">🏪 Walk-in Customer (Retail)</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="customerType"
                          value="select"
                          checked={customerSelectionMode === 'select'}
                          onChange={() => setCustomerSelectionMode('select')}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-slate-700">🏢 Select Customer (Wholesale)</span>
                      </label>
                    </div>

                    {/* Customer Selection Interface */}
                    {customerSelectionMode === 'walk-in' ? (
                      <div className="space-y-2">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">👤</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">Walk-in Customer</p>
                              <p className="text-xs text-slate-600">Quick retail sales (Cash only)</p>
                            </div>
                          </div>
                        </div>
                        {/* Impact Notice */}
                        <div className="bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-600">
                          <strong>Note:</strong> Walk-in sales appear in overall reports but not in individual Customer Buying Patterns or Customer Analytics.
                        </div>
                      </div>
                    ) : selectedCustomer ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">
                                {selectedCustomer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{selectedCustomer.name}</p>
                              {selectedCustomer.company_name && (
                                <p className="text-xs text-slate-600">{selectedCustomer.company_name}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => setSelectedCustomer(null)}
                            size="sm"
                            variant="outline"
                            className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="border border-slate-200 rounded-lg p-3">
                          <CustomerSelector
                            customers={customers}
                            loading={false}
                            onSelectCustomer={setSelectedCustomer}
                            selectedCustomer={selectedCustomer}
                          />
                        </div>
                        
                        {/* HELPFUL TIP: Customer Selection Impact */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                          <div className="flex items-start gap-2">
                            <div className="text-blue-600 flex-shrink-0 mt-0.5">ℹ️</div>
                            <div className="text-blue-900">
                              <strong>Track Customer Purchases:</strong> Select a customer to see their buying patterns. 
                              Unselected orders go to "Walk-in Customer".
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cart Items in Order Summary */}
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-slate-700">Items</h5>
                  <div className="bg-slate-50 rounded-lg p-3">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-600 mb-2 pb-2 border-b border-slate-200">
                      <div className="col-span-6">ITEM</div>
                      <div className="col-span-3 text-center">QTY</div>
                      <div className="col-span-3 text-right">PRICE</div>
                    </div>
                    {/* Items List */}
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.product.id} className="grid grid-cols-12 gap-2 text-sm items-center">
                          <div className="col-span-6 text-slate-700 truncate">
                            {item.product.name}
                          </div>
                          <div className="col-span-3 text-center text-slate-600">
                            {item.quantity}
                          </div>
                          <div className="col-span-3 text-right text-slate-900 font-medium">
                            {formatCurrency(item.price)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Discount Section */}
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-slate-700">Discount</h5>

                  {/* Discount Type Selection */}
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="discountType"
                        value="percentage"
                        checked={discountType === 'percentage'}
                        onChange={() => setDiscountType('percentage')}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-slate-700">Percentage (%)</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="discountType"
                        value="monetary"
                        checked={discountType === 'monetary'}
                        onChange={() => setDiscountType('monetary')}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-slate-700">Amount (TSh)</span>
                    </label>
                  </div>

                  {/* Discount Input - UNCONTROLLED to prevent auto-focus shift */}
                  <div className="flex gap-2">
                    <input
                      ref={discountInputRef}
                      type="number"
                      min="0"
                      max={discountType === 'percentage' ? 100 : getTotal()}
                      defaultValue={discountType === 'percentage' ? committedDiscountPercent : committedDiscountAmount}
                      key={discountType}
                      onBlur={commitDiscountValue}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          commitDiscountValue();
                          discountInputRef.current?.blur();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={discountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                    />
                    <span className="px-3 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg">
                      {discountType === 'percentage' ? '%' : 'TSh'}
                    </span>
                  </div>
                </div>

                {/* Payment Method Section */}
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-slate-700">Payment Method</h5>

                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-slate-700">💵 Cash</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit"
                        checked={paymentMethod === 'credit'}
                        onChange={() => setPaymentMethod('credit')}
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-slate-700">💳 Credit</span>
                    </label>
                  </div>

                  {/* ⚠️ CREDIT + WALK-IN WARNING */}
                  {paymentMethod === 'credit' && customerSelectionMode === 'walk-in' && (
                    <div className="mt-3 bg-red-50 border-2 border-red-300 rounded-lg p-3 animate-pulse">
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 text-lg">⚠️</span>
                        <div>
                          <p className="text-sm font-bold text-red-800">Credit sales require a real customer</p>
                          <p className="text-xs text-red-700 mt-1">
                            Please switch to "Select Customer" mode above to complete this credit sale.
                            Walk-in customers cannot buy on credit.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ℹ️ WALK-IN ANALYTICS WARNING */}
                  {paymentMethod === 'cash' && customerSelectionMode === 'walk-in' && cart.length > 0 && (
                    <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-600 text-sm">💡</span>
                        <div>
                          <p className="text-xs text-yellow-800">
                            <strong>Tip:</strong> Walk-in sales won't appear in Customer Buying Patterns per customer.
                            Select a specific customer to track their purchases.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Due Date Picker - Only show when Credit is selected */}
                  {paymentMethod === 'credit' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Payment Due Date *
                      </label>
                      <input
                        type="date"
                        value={customDueDate}
                        onChange={(e) => setCustomDueDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        required
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Specify when the customer should pay this invoice
                      </p>
                    </div>
                  )}
                </div>

                {/* Warehouse/Location Selection */}
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-slate-700">📦 Select Warehouse</h5>
                  
                  {locations.length > 0 ? (
                    <select
                      value={selectedWarehouse}
                      onChange={(e) => setSelectedWarehouse(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name} ({location.type === 'pos' ? 'POS' : 'Inventory'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-600">
                      No locations found. Using default location.
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Stock will be deducted from the selected location
                  </p>
                </div>

                {/* VAT Type Selection */}
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-slate-700">VAT Options</h5>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="vatType"
                        value="inclusive"
                        checked={vatType === 'inclusive'}
                        onChange={() => setVatType('inclusive')}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-slate-700">VAT Inclusive</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="vatType"
                        value="exclusive"
                        checked={vatType === 'exclusive'}
                        onChange={() => setVatType('exclusive')}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-slate-700">VAT Exclusive</span>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500">VAT Inclusive: Shows VAT on invoice | VAT Exclusive: Hides VAT on invoice</p>
                </div>

                {/* Order Summary Breakdown */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Subtotal:</span>
                    <span className="text-sm font-medium text-slate-900">{formatCurrency(getTotal())}</span>
                  </div>

                  {/* Discount Display */}
                  {((discountType === 'percentage' && committedDiscountPercent > 0) ||
                    (discountType === 'monetary' && committedDiscountAmount > 0)) && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="text-sm">Discount:</span>
                      <span className="text-sm font-medium">
                        -{formatCurrency(
                          discountType === 'percentage'
                            ? getTotal() * (committedDiscountPercent / 100)
                            : Math.min(committedDiscountAmount, getTotal())
                        )}
                      </span>
                    </div>
                  )}

                  {/* Only show VAT line if VAT Inclusive is selected */}
                  {vatType === 'inclusive' && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">VAT (18%):</span>
                      <span className="text-sm font-medium text-slate-900">
                        {formatCurrency(getTotal() * taxRate)}
                      </span>
                    </div>
                  )}

                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="text-base font-bold text-slate-900">TOTAL:</span>
                    <span className="text-lg font-bold text-slate-900">
                      {formatCurrency(
                        getTotal() + (vatType === 'inclusive' ? getTotal() * taxRate : 0) -
                        (discountType === 'percentage'
                          ? getTotal() * (committedDiscountPercent / 100)
                          : Math.min(committedDiscountAmount, getTotal()))
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Checkout and Cancel Buttons */}
            {cart.length > 0 && (
              <div className="pt-2 flex gap-3 border-t mt-4 pt-4">
                <Button
                  onClick={() => {
                    // Clear cart and reset to products section
                    clearCart();
                    setActiveSubsection('products');
                    toast.success('Order cancelled');
                  }}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                >
                  ❌ Cancel
                </Button>
                <Button
                  onClick={handleCompleteOrder}
                  disabled={
                    isProcessingOrder || 
                    cart.length === 0 || 
                    (paymentMethod === 'credit' && customerSelectionMode === 'walk-in') ||
                    (customerSelectionMode !== 'walk-in' && !selectedCustomer)
                  }
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    paymentMethod === 'credit' && customerSelectionMode === 'walk-in' 
                      ? 'Credit sales require a real customer - switch to Select Customer mode'
                      : customerSelectionMode !== 'walk-in' && !selectedCustomer
                      ? 'Please select a customer'
                      : ''
                  }
                >
                  {isProcessingOrder ? '⏳ Processing...' : 
                   paymentMethod === 'credit' && customerSelectionMode === 'walk-in' ? '❌ Credit Not Allowed for Walk-in' :
                   '🛒 Checkout & Complete Sale'}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
  );

  const OrderHistorySection = () => {
    const [customerFilter, setCustomerFilter] = useState('all');
    const [productFilter, setProductFilter] = useState('all');
    const [brandFilter, setBrandFilterHistory] = useState('all');
    const [categoryFilter, setCategoryFilterHistory] = useState('all');

    return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-900 mb-2">📜 Order History</h3>
        <p className="text-slate-600">View past orders and print invoices</p>
      </div>

      <Card className="p-4" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
        {/* Search and Filters */}
        <div className="mb-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders by customer or order number..."
              value={orderSearchTerm}
              onChange={(e) => setOrderSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Customer Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer</label>
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Customers</option>
                <option value="walk-in">Walk-in Only</option>
                {customers
                  .filter((c, index, self) => 
                    index === self.findIndex((t) => t.name === c.name)
                  )
                  .map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Product Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Product</label>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Products</option>
                {products
                  .filter((p, index, self) => 
                    index === self.findIndex((t) => t.name === p.name)
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Brand</label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilterHistory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Brands</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilterHistory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(customerFilter !== 'all' || productFilter !== 'all' || brandFilter !== 'all' || categoryFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-600">Active filters:</span>
              {customerFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Customer: {customerFilter === 'walk-in' ? 'Walk-in' : customers.find(c => c.id === customerFilter)?.name || customerFilter}
                  <button onClick={() => setCustomerFilter('all')} className="hover:text-blue-900">×</button>
                </span>
              )}
              {productFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Product: {products.find(p => p.id === productFilter)?.name || productFilter}
                  <button onClick={() => setProductFilter('all')} className="hover:text-green-900">×</button>
                </span>
              )}
              {brandFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Brand: {brands.find(b => b.id === brandFilter)?.name || brandFilter}
                  <button onClick={() => setBrandFilterHistory('all')} className="hover:text-purple-900">×</button>
                </span>
              )}
              {categoryFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  Category: {categories.find(c => c.id === categoryFilter)?.name || categoryFilter}
                  <button onClick={() => setCategoryFilterHistory('all')} className="hover:text-orange-900">×</button>
                </span>
              )}
              <button
                onClick={() => {
                  setCustomerFilter('all');
                  setProductFilter('all');
                  setBrandFilterHistory('all');
                  setCategoryFilterHistory('all');
                }}
                className="text-xs text-slate-600 hover:text-slate-900 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Order History List */}
        {orderHistory.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No orders found</p>
            <p className="text-sm text-slate-500 mt-2">Completed orders will appear here</p>
            <p className="text-xs text-slate-400 mt-1">You can print invoices directly from this section</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orderHistory
              .filter(order => {
                // Text search filter
                if (orderSearchTerm) {
                  const customerName = order.sales_hub_customers?.name || '';
                  const companyName = order.sales_hub_customers?.company_name || '';
                  const orderNumber = order.order_number || '';
                  const searchLower = orderSearchTerm.toLowerCase();
                  const matchesSearch = customerName.toLowerCase().includes(searchLower) ||
                         companyName.toLowerCase().includes(searchLower) ||
                         orderNumber.toLowerCase().includes(searchLower);
                  if (!matchesSearch) return false;
                }

                // Customer filter
                if (customerFilter !== 'all') {
                  if (customerFilter === 'walk-in') {
                    if (order.sales_hub_customers?.name && order.sales_hub_customers.name !== 'Walk-in Customer') {
                      return false;
                    }
                  } else {
                    if (order.customer_id !== customerFilter) {
                      return false;
                    }
                  }
                }

                // Product/Brand/Category filters - check order items
                if (productFilter !== 'all' || brandFilter !== 'all' || categoryFilter !== 'all') {
                  const orderItems = Array.isArray(order.items) ? order.items : [];
                  
                  if (orderItems.length === 0) return false;

                  const hasMatchingItem = orderItems.some((item: any) => {
                    const product = products.find(p => p.id === item.product_id);
                    if (!product) return false;

                    // Check product filter
                    if (productFilter !== 'all' && product.id !== productFilter) {
                      return false;
                    }

                    // Check brand filter
                    if (brandFilter !== 'all' && product.brand_id !== brandFilter) {
                      return false;
                    }

                    // Check category filter
                    if (categoryFilter !== 'all' && product.category_id !== categoryFilter) {
                      return false;
                    }

                    return true;
                  });

                  if (!hasMatchingItem) return false;
                }

                return true;
              })
              .map(order => (
                <div key={order.id} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        {order.sales_hub_customers?.name || 'Walk-in Customer'}
                      </p>
                      {order.sales_hub_customers?.company_name && (
                        <p className="text-sm text-slate-600">{order.sales_hub_customers.company_name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(order.total_amount)}</p>
                      <p className="text-xs text-slate-500">{order.order_number}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-slate-600 mb-2">
                    <span className="font-medium">{formatOrderDate(order.created_at)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => printOrderInvoice(order)}
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      Print Invoice
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedOrderForDetails(order);
                        setShowOrderDetailsModal(true);
                      }}
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                    >
                      <Receipt className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
  };

  const InventoryStatusSection = () => {
    const [inventoryStockFilter, setInventoryStockFilter] = useState('all');
    const [inventoryBrandFilter, setInventoryBrandFilter] = useState('all');
    const [inventoryLocationFilter, setInventoryLocationFilter] = useState('all');
    const [inventorySearchTerm, setInventorySearchTerm] = useState('');
    const [totalPurchaseCost, setTotalPurchaseCost] = useState(0);

    // Calculate total purchase cost from stock history records
    useEffect(() => {
      const calculatePurchaseCost = async () => {
        try {
          // Query stock_history for all restock records with purchase costs
          const { data: historyData, error: historyError } = await supabase
            .from('stock_history')
            .select('purchase_cost_total, purchase_cost_per_unit, quantity')
            .eq('action', 'restock');

          if (historyError) {
            console.log('📊 Using products table for purchase cost (stock_history not available)');
            // Fallback: calculate from products table
            const productsCost = products.reduce((sum, p) => {
              return sum + ((p.cost_price || 0) * p.stock_quantity);
            }, 0);
            setTotalPurchaseCost(productsCost);
            return;
          }

          // Sum up all purchase costs from history
          const historyCost = (historyData || []).reduce((sum, record) => {
            return sum + (record.purchase_cost_total || 0);
          }, 0);

          // If we have history data, use it; otherwise fallback to products
          if (historyCost > 0) {
            setTotalPurchaseCost(historyCost);
            console.log('📊 Purchase cost from stock history:', historyCost);
          } else {
            const productsCost = products.reduce((sum, p) => {
              return sum + ((p.cost_price || 0) * p.stock_quantity);
            }, 0);
            setTotalPurchaseCost(productsCost);
            console.log('📊 Purchase cost from products table:', productsCost);
          }
        } catch (error) {
          console.error('Error calculating purchase cost:', error);
          // Fallback to products table on any error
          const productsCost = products.reduce((sum, p) => {
            return sum + ((p.cost_price || 0) * p.stock_quantity);
          }, 0);
          setTotalPurchaseCost(productsCost);
        }
      };

      calculatePurchaseCost();
    }, [products]);

    return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-900 mb-2">📊 Stock Intelligence</h3>
        <p className="text-slate-600">Monitor and optimize your inventory</p>
      </div>

      {/* Inventory Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="p-4 text-center">
          <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900">{products.length}</div>
          <div className="text-sm text-slate-600">Total SKUs</div>
        </Card>

        <Card className="p-4 text-center">
          <Package className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900">{products.length}</div>
          <div className="text-sm text-slate-600">Total Products</div>
        </Card>

        <Card className="p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900">
            {products.filter(p => getStockStatus(p).status === 'out').length}
          </div>
          <div className="text-sm text-slate-600">Out of Stock</div>
        </Card>

        <Card className="p-4 text-center">
          <Banknote className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-xl font-bold text-slate-900 break-words">
            {formatCurrency(products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0))}
          </div>
          <div className="text-sm text-slate-600">Inventory Value</div>
        </Card>

        <Card className="p-4 text-center">
          <Receipt className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <div className="text-xl font-bold text-slate-900 break-words">
            {formatCurrency(totalPurchaseCost)}
          </div>
          <div className="text-sm text-slate-600">Purchase Cost</div>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h4 className="text-lg font-semibold">Inventory Details</h4>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by product name or SKU..."
                value={inventorySearchTerm}
                onChange={(e) => setInventorySearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              />
            </div>
            
            {/* Stock Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Stock:</label>
              <select
                value={inventoryStockFilter}
                onChange={(e) => setInventoryStockFilter(e.target.value)}
                className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ALL STOCK</option>
                <option value="in-stock">IN STOCK</option>
                <option value="low-stock">LOW STOCK</option>
                <option value="out-of-stock">OUT OF STOCK</option>
              </select>
            </div>

            {/* Brand Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Brand:</label>
              <select
                value={inventoryBrandFilter}
                onChange={(e) => setInventoryBrandFilter(e.target.value)}
                className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ALL BRANDS</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Location:</label>
              <select
                value={inventoryLocationFilter}
                onChange={(e) => setInventoryLocationFilter(e.target.value)}
                className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ALL LOCATIONS</option>
                {userLocations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.type === 'pos' ? 'POS' : 'Inv'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading inventory...</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-700">Product</th>
                <th className="text-center py-2 px-3 font-medium text-slate-700">Current Stock</th>
                <th className="text-center py-2 px-3 font-medium text-slate-700">Reorder Level</th>
                <th className="text-center py-2 px-3 font-medium text-slate-700">Sales Velocity</th>
                <th className="text-center py-2 px-3 font-medium text-slate-700">Status</th>
                <th className="text-center py-2 px-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredInventory = products.filter(product => {
                  const stockStatus = getStockStatus(product);
                  const matchesStockFilter = inventoryStockFilter === 'all' ||
                         (inventoryStockFilter === 'in-stock' && stockStatus.status === 'healthy') ||
                         (inventoryStockFilter === 'low-stock' && stockStatus.status === 'low') ||
                         (inventoryStockFilter === 'out-of-stock' && stockStatus.status === 'out');
                  
                  const matchesBrandFilter = inventoryBrandFilter === 'all' ||
                         product.brand_id === inventoryBrandFilter;
                  
                  const matchesLocationFilter = inventoryLocationFilter === 'all' ||
                         product.location_id === inventoryLocationFilter;
                  
                  const matchesSearch = inventorySearchTerm === '' ||
                         product.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(inventorySearchTerm.toLowerCase())) ||
                         (product.brands?.name && product.brands.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()));
                  
                  return matchesStockFilter && matchesBrandFilter && matchesLocationFilter && matchesSearch;
                });

                return filteredInventory.map(product => {
                  const stockInfo = getStockStatus(product);
                  return (
                    <tr key={product.id} className="border-b border-slate-100">
                      <td className="py-3 px-3">
                        <div>
                          <div className="font-medium text-slate-900">{product.name}</div>
                          {product.sku && <div className="text-sm text-slate-600">SKU: {product.sku}</div>}
                          {product.brands?.name && (
                            <div className="text-xs text-slate-500 mt-0.5">🏷️ {product.brands.name}</div>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-3 px-3">
                        <span className={`font-medium ${stockInfo.status === 'out' ? 'text-red-600' : stockInfo.status === 'low' ? 'text-yellow-600' : 'text-green-600'}`}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="text-center py-3 px-3 text-slate-600">
                        {product.min_stock_level || 10}
                      </td>
                      <td className="text-center py-3 px-3">
                        <div className="flex items-center justify-center">
                          <TrendingUp className={`h-4 w-4 ${product.sales_velocity && product.sales_velocity > 5 ? 'text-green-600' : 'text-slate-400'}`} />
                          <span className="ml-1 text-sm">{product.sales_velocity || 0}/day</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-3">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockInfo.color} text-white`}>
                          <div className="w-2 h-2 rounded-full bg-white opacity-75"></div>
                          {stockInfo.text}
                        </div>
                      </td>
                      <td className="text-center py-3 px-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedProductForRestock(product);
                            setRestockQuantity('');
                            setRestockPurchaseCost('');
                            setRestockLocation('main-store'); // Default to main store for all users
                            setShowRestockModal(true);
                          }}
                        >
                          Restock
                        </Button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        )}
      </Card>

      {/* AI Forecast Section */}
      <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <h4 className="text-lg font-semibold mb-4 flex items-center text-indigo-900">
          <Brain className="h-5 w-5 mr-2" />
          AI Demand Forecasts
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(() => {
            // Find product that will run out soonest
            const productsNeedingRestock = products
              .filter(p => p.stock_quantity > 0 && (p.sales_velocity || 0) > 0)
              .map(p => ({
                ...p,
                daysUntilOut: Math.floor(p.stock_quantity / (p.sales_velocity || 1))
              }))
              .sort((a, b) => a.daysUntilOut - b.daysUntilOut)
              .slice(0, 1);

            const restockProduct = productsNeedingRestock[0];

            // Find slow-moving products (no sales in last 30 days)
            const slowMovingProducts = products
              .filter(p => (p.sales_velocity || 0) === 0 && p.stock_quantity > 0)
              .slice(0, 1);

            const slowProduct = slowMovingProducts[0];

            return (
              <>
                {restockProduct ? (
                  <div className="p-4 bg-white rounded-lg border border-indigo-200">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="h-5 w-5 text-indigo-600" />
                      <span className="font-medium text-indigo-900">{restockProduct.name} Forecast</span>
                    </div>
                    <p className="text-sm text-indigo-800 mb-2">
                      You will need to restock in {restockProduct.daysUntilOut} days
                    </p>
                    <p className="text-xs text-indigo-600">
                      Based on current sales trend of {restockProduct.sales_velocity} units/day
                    </p>
                    <Button
                      size="sm"
                      className="mt-3 bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => {
                        setSelectedProductForRestock(restockProduct);
                        setRestockQuantity('');
                        setRestockPurchaseCost('');
                        setRestockLocation('main-store');
                        setShowRestockModal(true);
                      }}
                    >
                      Plan Restock
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-lg border border-indigo-200">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="h-5 w-5 text-indigo-600" />
                      <span className="font-medium text-indigo-900">No Restock Needed</span>
                    </div>
                    <p className="text-sm text-indigo-800 mb-2">All products have sufficient stock</p>
                    <p className="text-xs text-indigo-600">Monitor sales trends regularly</p>
                  </div>
                )}

                {slowProduct ? (
                  <div className="p-4 bg-white rounded-lg border border-orange-200">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <span className="font-medium text-orange-900">Slow Moving Alert</span>
                    </div>
                    <p className="text-sm text-orange-800 mb-2">
                      {slowProduct.name} hasn't moved in 30 days
                    </p>
                    <p className="text-xs text-orange-600">
                      Current stock: {slowProduct.stock_quantity} units
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => {
                        setSelectedProductForPromotion(slowProduct);
                        setPromotionData({
                          name: `Promotion: ${slowProduct.name}`,
                          description: `Special offer for slow-moving product: ${slowProduct.name}`,
                          type: 'paid_ads',
                          discount_type: 'percentage',
                          discount_value: '',
                          budget: '',
                          start_date: new Date().toISOString().split('T')[0],
                          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          target_audience: 'All customers'
                        });
                        setShowPromotionModal(true);
                      }}
                    >
                      Create Promotion
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-lg border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">All Products Active</span>
                    </div>
                    <p className="text-sm text-green-800 mb-2">No slow-moving inventory detected</p>
                    <p className="text-xs text-green-600">Great inventory turnover!</p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </Card>
    </div>
  );
};

  const ProductStockingHistorySection = () => {
    const [selectedEntry, setSelectedEntry] = useState<StockHistoryEntry | null>(null);
    const [filters, setFilters] = useState({
      product: '',
      location: '',
      dateRange: 'last-7-days',
      actionType: '',
      referenceType: ''
    });
    const [stockHistory, setStockHistory] = useState<StockHistoryEntry[]>([]);
    const [kpis, setKpis] = useState({
      stockTurnover: '0x',
      daysRemaining: '0 days',
      adjustmentFreq: '0/week',
      demandTrend: '+0%'
    });

    useEffect(() => {
      loadStockHistory();
    }, [filters]);

    const loadStockHistory = async () => {
      try {
        // Calculate date range
        const now = new Date();
        let startDate = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'this-week':
            startDate.setDate(now.getDate() - now.getDay());
            break;
          case 'last-7-days':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'this-month':
            startDate.setDate(1);
            break;
          case 'last-30-days':
            startDate.setDate(now.getDate() - 30);
            break;
        }

        // Build query
        let query = supabase
          .from('stock_history')
          .select(`
            id,
            product_id,
            action,
            quantity,
            stock_before,
            stock_after,
            reference_type,
            reference_id,
            created_by,
            notes,
            created_at,
            purchase_cost_per_unit,
            purchase_cost_total,
            products!inner(name, model, sku, brand_id, brands(name))
          `)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(100);

        // Apply filters
        if (filters.actionType) {
          query = query.eq('action', filters.actionType);
        }
        if (filters.referenceType) {
          query = query.eq('reference_type', filters.referenceType);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Stock history query error:', error);
          throw error;
        }

        console.log('Stock history query returned:', data?.length || 0, 'records');

        // Transform data
        const historyData: StockHistoryEntry[] = (data || []).map((entry: any) => {
          const product = entry.products;
          const productName = product?.name || product?.model || 'Unknown Product';
          
          // Filter by product name if specified
          if (filters.product && !productName.toLowerCase().includes(filters.product.toLowerCase())) {
            return null;
          }

          return {
            id: entry.id,
            date: entry.created_at,
            product: productName,
            sku: product?.sku || '',
            brand: product?.brands?.name || '',
            variant: '',
            action: entry.action?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown',
            qtyChange: entry.quantity || 0,
            stockBefore: entry.stock_before || 0,
            stockAfter: entry.stock_after || 0,
            location: 'Main Store',
            reference: entry.reference_id || 'N/A',
            performedBy: entry.created_by || 'System',
            customer: undefined,
            referenceType: entry.reference_type,
            purchaseCostPerUnit: entry.purchase_cost_per_unit || undefined,
            purchaseCostTotal: entry.purchase_cost_total || undefined
          };
        }).filter(Boolean) as StockHistoryEntry[];

        console.log('Transformed stock history data:', historyData.length, 'records after filtering');
        setStockHistory(historyData);

        // Calculate KPIs from real data
        if (historyData.length > 0) {
          // Stock Turnover = total sales / average inventory
          const avgInventory = historyData.reduce((sum, h) => sum + h.stockAfter, 0) / historyData.length;
          const turnover = avgInventory > 0 ? (Math.abs(historyData.filter(h => h.qtyChange < 0).reduce((sum, h) => sum + h.qtyChange, 0)) / avgInventory) : 0;
          
          // Days Remaining = current avg stock / avg daily sales
          const totalDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const avgDailySales = historyData.filter(h => h.qtyChange < 0).length / totalDays;
          const daysRemaining = avgDailySales > 0 ? Math.round(avgInventory / avgDailySales) : 0;
          
          // Adjustment Frequency
          const adjustments = historyData.filter(h => h.action.includes('Adjustment') || h.action.includes('Restock'));
          const weeks = totalDays / 7;
          const adjustmentFreq = weeks > 0 ? (adjustments.length / weeks).toFixed(1) : '0';
          
          // Demand Trend (compare first half vs second half)
          const midpoint = Math.floor(historyData.length / 2);
          const firstHalfSales = Math.abs(historyData.slice(midpoint).filter(h => h.qtyChange < 0).reduce((sum, h) => sum + h.qtyChange, 0));
          const secondHalfSales = Math.abs(historyData.slice(0, midpoint).filter(h => h.qtyChange < 0).reduce((sum, h) => sum + h.qtyChange, 0));
          const demandChange = firstHalfSales > 0 ? ((secondHalfSales - firstHalfSales) / firstHalfSales * 100).toFixed(0) : '0';
          
          setKpis({
            stockTurnover: `${turnover.toFixed(1)}x`,
            daysRemaining: `${daysRemaining} days`,
            adjustmentFreq: `${adjustmentFreq}/week`,
            demandTrend: `${Number(demandChange) >= 0 ? '+' : ''}${demandChange}%`
          });
        }
      } catch (error) {
        console.error('Error loading stock history:', error);
        toast.error('Failed to load stock history');
      }
    };

    // Stock history data - will be loaded from database
    const aiInsights = [];

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">📦 Product Stocking History</h3>
          <p className="text-slate-600">"Track every inventory change across sales, POS, returns & restocks"</p>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">📦 Product</label>
              <input
                type="text"
                placeholder="Search product..."
                value={filters.product}
                onChange={(e) => setFilters({...filters, product: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">📅 Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="last-7-days">Last 7 Days</option>
                <option value="this-month">This Month</option>
                <option value="last-30-days">Last 30 Days</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">🔁 Action Type</label>
              <select
                value={filters.actionType}
                onChange={(e) => setFilters({...filters, actionType: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Actions</option>
                <option value="sale">Sale</option>
                <option value="pos_sale">POS Sale</option>
                <option value="return">Return</option>
                <option value="restock">Restock</option>
                <option value="manual_adjustment">Manual Adjustment</option>
                <option value="transfer_in">Transfer In</option>
                <option value="transfer_out">Transfer Out</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">📄 Reference Type</label>
              <select
                value={filters.referenceType}
                onChange={(e) => setFilters({...filters, referenceType: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All References</option>
                <option value="invoice">Invoice</option>
                <option value="pos_receipt">POS Receipt</option>
                <option value="purchase_order">Purchase Order</option>
                <option value="adjustment_note">Adjustment Note</option>
              </select>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock Change Timeline Table */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">Stock Change Timeline</h4>
              {stockHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <History className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                  <p>No stock changes found for the selected filters.</p>
                  <p className="text-sm mt-2">Try adjusting your date range or filters.</p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Date & Time</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Product</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">SKU</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Brand</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Action</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Change</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Stock Level</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockHistory.map((entry) => {
                      const date = new Date(entry.date);
                      const now = new Date();
                      const diffMs = now.getTime() - date.getTime();
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMs / 3600000);
                      const diffDays = Math.floor(diffMs / 86400000);
                      
                      let timeAgo = '';
                      if (diffMins < 1) timeAgo = 'Just now';
                      else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
                      else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
                      else if (diffDays < 7) timeAgo = `${diffDays}d ago`;
                      else timeAgo = date.toLocaleDateString();
                      
                      const actionColors: { [key: string]: string } = {
                        'Sale': 'bg-red-100 text-red-700 border-red-200',
                        'Pos Sale': 'bg-red-100 text-red-700 border-red-200',
                        'Restock': 'bg-green-100 text-green-700 border-green-200',
                        'Initial Stock': 'bg-blue-100 text-blue-700 border-blue-200',
                        'Return': 'bg-yellow-100 text-yellow-700 border-yellow-200',
                        'Adjustment': 'bg-purple-100 text-purple-700 border-purple-200',
                        'Transfer In': 'bg-teal-100 text-teal-700 border-teal-200',
                        'Transfer Out': 'bg-orange-100 text-orange-700 border-orange-200'
                      };
                      
                      const actionColor = actionColors[entry.action] || 'bg-slate-100 text-slate-700 border-slate-200';
                      
                      return (
                        <tr
                          key={entry.id}
                          className="border-b border-slate-100 hover:bg-blue-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900">{timeAgo}</span>
                              <span className="text-xs text-slate-500">{date.toLocaleString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{entry.product}</div>
                            {entry.variant && <div className="text-xs text-slate-500">{entry.variant}</div>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-slate-600 font-mono">{entry.sku || '-'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-slate-700">{entry.brand || '-'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${actionColor}`}>
                              {entry.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-lg font-bold ${entry.qtyChange < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {entry.qtyChange > 0 ? '+' : ''}{entry.qtyChange}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-slate-500 text-sm">{entry.stockBefore}</span>
                              <span className="text-slate-400">→</span>
                              <span className="text-slate-900 font-bold text-base">{entry.stockAfter}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEntry(entry);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )}
            </Card>
          </div>

          {/* Detail Drawer / AI Insights */}
          <div className="space-y-6">
            {selectedEntry ? (
              <Card className="p-6 border-blue-200 bg-gradient-to-br from-white to-blue-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    Stock Event Details
                  </h4>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border border-slate-200">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Product</label>
                      <p className="font-semibold text-slate-900 mt-1">{selectedEntry.product}</p>
                      {selectedEntry.variant && <p className="text-sm text-slate-600">{selectedEntry.variant}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Action Type</label>
                      <p className="font-semibold text-slate-900 mt-1">{selectedEntry.action}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border border-slate-200">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">SKU</label>
                      <p className="font-mono text-sm text-slate-700 mt-1">{selectedEntry.sku || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Brand</label>
                      <p className="font-semibold text-slate-900 mt-1">{selectedEntry.brand || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-3 bg-white rounded-lg border border-slate-200">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Qty Change</label>
                      <p className={`text-xl font-bold mt-1 ${selectedEntry.qtyChange < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedEntry.qtyChange > 0 ? '+' : ''}{selectedEntry.qtyChange}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Before</label>
                      <p className="text-xl font-semibold text-slate-600 mt-1">{selectedEntry.stockBefore}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">After</label>
                      <p className="text-xl font-bold text-slate-900 mt-1">{selectedEntry.stockAfter}</p>
                    </div>
                  </div>

                  {(selectedEntry.purchaseCostPerUnit || selectedEntry.purchaseCostTotal) && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      {selectedEntry.purchaseCostPerUnit && (
                        <div>
                          <label className="text-xs font-medium text-green-700 uppercase tracking-wide">💰 Cost/Unit</label>
                          <p className="text-lg font-bold text-green-900 mt-1">
                            TSh {selectedEntry.purchaseCostPerUnit.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {selectedEntry.purchaseCostTotal && (
                        <div>
                          <label className="text-xs font-medium text-green-700 uppercase tracking-wide">💵 Total Cost</label>
                          <p className="text-lg font-bold text-green-900 mt-1">
                            TSh {selectedEntry.purchaseCostTotal.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border border-slate-200">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Reference</label>
                      <p className="text-sm font-mono text-blue-600 mt-1">{selectedEntry.reference}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location</label>
                      <p className="text-sm text-slate-700 mt-1">{selectedEntry.location || 'Main Store'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border border-slate-200">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Performed By</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {selectedEntry.performedBy === 'System' ? 'S' : 'U'}
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {selectedEntry.performedBy === 'System' ? 'System' : 'You'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Timestamp</label>
                      <p className="text-sm text-slate-700 mt-1">{new Date(selectedEntry.date).toLocaleString()}</p>
                    </div>
                  </div>

                  {selectedEntry.customer && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Customer</label>
                      <p className="text-sm text-slate-700 mt-1">{selectedEntry.customer}</p>
                    </div>
                  )}
                </div>
                {selectedEntry && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Insight
                    </h5>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {selectedEntry.qtyChange < 0 
                        ? `Stock decreased by ${Math.abs(selectedEntry.qtyChange)} units due to ${selectedEntry.action.toLowerCase()}. Current demand trend: ${kpis.demandTrend}.`
                        : `Stock increased by ${selectedEntry.qtyChange} units from ${selectedEntry.action.toLowerCase()}. Inventory replenished.`
                      }
                    </p>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Select a stock change entry to view details</p>
              </Card>
            )}

            {/* AI Insights */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <h4 className="text-lg font-semibold mb-4 flex items-center text-blue-900">
                <Brain className="h-5 w-5 mr-2" />
                Stock Intelligence
              </h4>
              <div className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <div key={index} className={`p-4 bg-white rounded-lg border border-${insight.color}-200`}>
                    <h5 className="font-semibold text-slate-900 mb-2">{insight.title}</h5>
                    <p className="text-sm text-slate-700 mb-1">{insight.message}</p>
                    {insight.description && <p className="text-xs text-slate-600">{insight.description}</p>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">📊</div>
            <div className="text-sm text-slate-600">Stock Turnover</div>
            <div className="font-semibold">{kpis.stockTurnover}</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">📅</div>
            <div className="text-sm text-slate-600">Days Remaining</div>
            <div className="font-semibold">{kpis.daysRemaining}</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">🔄</div>
            <div className="text-sm text-slate-600">Adjustment Freq</div>
            <div className="font-semibold">{kpis.adjustmentFreq}</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">📈</div>
            <div className="text-sm text-slate-600">Demand Trend</div>
            <div className="font-semibold">{kpis.demandTrend}</div>
          </Card>
        </div>
      </div>
    );
  };

  const subsections = [
    { id: "products", label: "Products" },
    { id: "carts-invoice", label: "Carts & Invoice" },
    { id: "order-history", label: "Order History" },
    { id: "inventory-status", label: "Inventory Management" },
    { id: "stock-transfers", label: "Stock Transfers" },
    { id: "customer-buying-patterns", label: "Selling & Buying Pattern" },
    { id: "expenses", label: "Expenses" },
    { id: "product-stocking-history", label: "Product Stocking History" },
  ];

  // Printable Invoice Component - REMOVED
  // const PrintableInvoice = () => {
  //   const subtotal = getTotal();
  //   const taxRate = 0.18;
  //   const taxAmount = subtotal * taxRate;
  //   const total = subtotal + taxAmount;

  //   return (
  //     <div className="printable-invoice">
  //       {/* Invoice Header */}
  //       <div className="invoice-header">
  //         <div className="invoice-title">COPCCA CRM - SALES INVOICE</div>
  //         <div className="invoice-number">Invoice #: INV-{Date.now().toString().slice(-6)}</div>
  //         <div className="invoice-date">Date: {new Date().toLocaleDateString()}</div>
  //       </div>

  //       {/* Customer Information */}
  //       {selectedCustomer && (
  //         <div className="customer-info">
  //           <table>
  //             <tbody>
  //               <tr>
  //                 <th>Bill To:</th>
  //                 <td>
  //                   {selectedCustomer.name}<br />
  //                   {selectedCustomer.email}<br />
  //                   {selectedCustomer.phone && `Phone: ${selectedCustomer.phone}`}
  //                 </td>
  //               </tr>
  //             </tbody>
  //           </table>
  //         </div>
  //       )}

  //       {/* Items Table */}
  //       <table className="items-table">
  //         <thead>
  //           <tr>
  //             <th>Description</th>
  //             <th className="right">Qty</th>
  //             <th className="right">Unit Price</th>
  //             <th className="right">Total</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           {cart.map((item, index) => (
  //             <tr key={item.product?.id || index}>
  //               <td>{item.product?.name || 'Unknown Product'}</td>
  //               <td className="right">{item.quantity || 0}</td>
  //               <td className="right">{formatCurrency(item.price || 0)}</td>
  //               <td className="right">{formatCurrency(item.subtotal || 0)}</td>
  //             </tr>
  //           ))}
  //         </tbody>
  //       </table>

  //       {/* Totals Section */}
  //       <div className="totals-section">
  //         <table>
  //           <tbody>
  //             <tr>
  //               <td>Subtotal:</td>
  //               <td className="right">{formatCurrency(subtotal)}</td>
  //             </tr>
  //             <tr>
  //               <td>VAT (18%):</td>
  //               <td className="right">{formatCurrency(taxAmount)}</td>
  //             </tr>
  //             <tr className="total-row">
  //               <td><strong>TOTAL:</strong></td>
  //               <td className="right"><strong>{formatCurrency(total)}</strong></td>
  //             </tr>
  //           </tbody>
  //         </table>
  //       </div>

  //       {/* Payment Information */}
  //       <div className="payment-info">
  //         <h4>Payment Information</h4>
  //         <div className="payment-methods">
  //           <div className="payment-method">
  //             <strong>M-Pesa</strong><br />
  //             Paybill: 123456<br />
  //             Account: INV-{Date.now().toString().slice(-6)}
  //           </div>
  //           <div className="payment-method">
  //             <strong>Bank Transfer</strong><br />
  //             Account: 1234567890<br />
  //             Bank: CRDB Bank
  //           </div>
  //           <div className="payment-method">
  //             <strong>Cash Payment</strong><br />
  //             Accepted at office<br />
  //             Mon-Fri, 8AM-5PM
  //           </div>
  //         </div>
  //         <p><strong>Payment Terms:</strong> Due within 30 days</p>
  //       </div>

  //       {/* Footer */}
  //       <div className="invoice-footer">
  //         Thank you for your business!<br />
  //         Generated by COPCCA CRM - {new Date().toLocaleString()}
  //       </div>
  //     </div>
  //   );
  // };

  return (
    <>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Sales Hub</h2>
        <div className="flex gap-2 mb-4">
          {subsections.map(sub => {
            return (
              <Button
                key={sub.id}
                variant={activeSubsection === sub.id ? 'default' : 'outline'}
                onClick={() => {
                  console.log('🔴 [SALES HUB] Button clicked:', sub.id, '| Current:', activeSubsection);
                  setActiveSubsection(sub.id as Subsection);
                }}
              >
                {sub.label}
              </Button>
            );
          })}
        </div>
      </div>
      {activeSubsection === 'products' && <ProductsSection />}
      {activeSubsection === 'carts-invoice' && <CartsInvoiceSection />}
      {activeSubsection === 'order-history' && <OrderHistorySection />}
      {activeSubsection === 'inventory-status' && (console.log('🟣 [SALES HUB] Rendering InventoryStatusSection'), <InventoryStatusSection />)}
      {activeSubsection === 'stock-transfers' && <StockTransfers />}
      {activeSubsection === 'customer-buying-patterns' && (console.log('🟣 [SALES HUB] Rendering CustomerBuyingPatternsSection'), <CustomerBuyingPatternsSection />)}
      {activeSubsection === 'expenses' && <ExpensesSection expenses={expenses} setExpenses={setExpenses} />}
      {activeSubsection === 'product-stocking-history' && (console.log('🟣 [SALES HUB] Rendering ProductStockingHistorySection'), <ProductStockingHistorySection />)}


      {/* View Cart Button - Always visible when cart has items */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-auto">
          <Button
            onClick={() => setActiveSubsection('carts-invoice')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
          >
            <ShoppingCart className="h-5 w-5" />
            VIEW CART ({cart.length})
          </Button>
        </div>
      )}
    </div>

    {/* Restock Modal */}
    {showRestockModal && selectedProductForRestock && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Restock Product</h3>
            <button
              onClick={() => {
                setShowRestockModal(false);
                setSelectedProductForRestock(null);
                setRestockQuantity('');
                setRestockPurchaseCost('');
                setRestockLocation('');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product: {selectedProductForRestock.name}
              </label>
              <p className="text-sm text-gray-500">Current Stock: {selectedProductForRestock.stock_quantity}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restock Quantity *
              </label>
              <input
                type="number"
                min="0"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter quantity to add"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <select
                value={restockLocation}
                onChange={(e) => setRestockLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select location</option>
                {userLocations.length > 0 ? (
                  // Show user's custom locations
                  userLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.type === 'pos' ? 'POS' : 'Inventory'})
                    </option>
                  ))
                ) : (
                  // Show default locations if no custom locations are set up
                  <>
                    <option value="main-store">Main Store</option>
                    <option value="warehouse-a">Warehouse A</option>
                    <option value="warehouse-b">Warehouse B</option>
                    <option value="pos-kariakoo">POS - Kariakoo</option>
                    <option value="pos-ilala">POS - Ilala</option>
                  </>
                )}
              </select>
              {userLocations.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  💡 Setup custom locations in Settings → Locations
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Cost {cogsTrackingEnabled ? '(TZS) *' : '(Optional)'}
              </label>
              <input
                type="number"
                value={restockPurchaseCost}
                onChange={(e) => setRestockPurchaseCost(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  cogsTrackingEnabled ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                placeholder="Enter cost per unit (for COGS calculation)"
                min="0"
                step="0.01"
                required={cogsTrackingEnabled}
              />
              {restockPurchaseCost && restockQuantity && (
                <p className="text-xs text-green-600 mt-1">
                  💰 Total Cost: TSh {(parseFloat(restockPurchaseCost) * (typeof restockQuantity === 'string' ? parseInt(restockQuantity) || 0 : restockQuantity)).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setShowRestockModal(false);
                  setSelectedProductForRestock(null);
                  setRestockQuantity('');
                  setRestockPurchaseCost('');
                  setRestockLocation('main-store');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRestock}
                disabled={(typeof restockQuantity === 'string' ? parseInt(restockQuantity) || 0 : restockQuantity) <= 0 || !restockLocation || isRestocking}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isRestocking ? 'Restocking...' : 'Restock'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Promotion Modal */}
    {showPromotionModal && selectedProductForPromotion && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Create Promotion</h3>
            <button
              onClick={() => {
                setShowPromotionModal(false);
                setSelectedProductForPromotion(null);
                setPromotionData({
                  name: '',
                  description: '',
                  type: 'paid_ads',
                  discount_type: 'percentage',
                  discount_value: '',
                  budget: '',
                  start_date: '',
                  end_date: '',
                  target_audience: ''
                });
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-900">Slow Moving Product</span>
              </div>
              <p className="text-sm text-orange-800">
                <strong>{selectedProductForPromotion.name}</strong> hasn't moved in 30 days
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Current stock: {selectedProductForPromotion.stock_quantity} units • 
                Price: {formatCurrency(selectedProductForPromotion.price)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Name *
              </label>
              <input
                type="text"
                value={promotionData.name}
                onChange={(e) => setPromotionData({ ...promotionData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Flash Sale: INCH 32 TV"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={promotionData.description}
                onChange={(e) => setPromotionData({ ...promotionData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the promotion offer..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Type *
                </label>
                <select
                  value={promotionData.type}
                  onChange={(e) => setPromotionData({ ...promotionData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="paid_ads">Paid Ads</option>
                  <option value="social">Social Media</option>
                  <option value="email">Email Campaign</option>
                  <option value="content">Content Marketing</option>
                  <option value="event">Event</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={promotionData.target_audience}
                  onChange={(e) => setPromotionData({ ...promotionData, target_audience: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., All customers"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type *
                </label>
                <select
                  value={promotionData.discount_type}
                  onChange={(e) => setPromotionData({ ...promotionData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (TZS)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value *
                </label>
                <input
                  type="number"
                  min="0"
                  step={promotionData.discount_type === 'percentage' ? '1' : '1000'}
                  value={promotionData.discount_value}
                  onChange={(e) => setPromotionData({ 
                    ...promotionData, 
                    discount_value: e.target.value === '' ? '' : parseFloat(e.target.value) || ''
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={promotionData.discount_type === 'percentage' ? 'e.g., 20' : 'e.g., 50000'}
                />
                {promotionData.discount_value && (
                  <p className="text-xs text-gray-500 mt-1">
                    {promotionData.discount_type === 'percentage'
                      ? `${promotionData.discount_value}% off`
                      : `${formatCurrency(typeof promotionData.discount_value === 'string' ? parseFloat(promotionData.discount_value) : promotionData.discount_value)} off`}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marketing Budget (TZS)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={promotionData.budget}
                onChange={(e) => setPromotionData({ 
                  ...promotionData, 
                  budget: e.target.value === '' ? '' : parseFloat(e.target.value) || ''
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 100000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={promotionData.start_date}
                  onChange={(e) => setPromotionData({ ...promotionData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={promotionData.end_date}
                  onChange={(e) => setPromotionData({ ...promotionData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => {
                  setShowPromotionModal(false);
                  setSelectedProductForPromotion(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePromotion}
                disabled={
                  !promotionData.name.trim() || 
                  !promotionData.discount_value || 
                  !promotionData.start_date || 
                  !promotionData.end_date ||
                  isCreatingPromotion
                }
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isCreatingPromotion ? 'Creating...' : 'Create Promotion'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Add Product Modal */}
    {showAddProductModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
        <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-6 pb-4 border-b border-gray-200 z-10">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Add New Product</h3>
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                setNewProductData({
                  name: '',
                  sku: '',
                  price: '',
                  cost_price: '',
                  stock_quantity: '',
                  min_stock_level: '',
                  brand_id: '',
                  category_id: '',
                  location_id: '',
                  image_url: ''
                });
                setProductImageFile(null);
                setProductImagePreview('');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={newProductData.name}
                onChange={(e) => setNewProductData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                type="text"
                value={newProductData.sku}
                onChange={(e) => setNewProductData(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter SKU"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <div className="flex gap-2">
                <select
                  value={newProductData.brand_id}
                  onChange={(e) => setNewProductData(prev => ({ ...prev, brand_id: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Brand</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddBrandModal(true)}
                  className="px-3"
                >
                  +
                </Button>
              </div>
            </div>

            {/* COGS Tracking Toggle */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cogsTrackingEnabled}
                  onChange={(e) => {
                    setCogsTrackingEnabled(e.target.checked);
                    localStorage.setItem('cogsTrackingEnabled', e.target.checked.toString());
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-2 text-sm font-medium text-gray-900">📊 Enable COGS Tracking</span>
              </label>
              <p className="text-xs text-slate-600 mt-1 ml-6">
                {cogsTrackingEnabled 
                  ? '✅ Purchase Cost is now mandatory - ensures accurate profitability tracking'
                  : 'Purchase Cost is optional - enable to track Cost of Goods Sold'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (TZS) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProductData.price}
                  onChange={(e) => setNewProductData(prev => ({ ...prev, price: e.target.value === '' ? '' : parseFloat(e.target.value) || '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Cost (TZS) {cogsTrackingEnabled && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProductData.cost_price}
                  onChange={(e) => setNewProductData(prev => ({ ...prev, cost_price: e.target.value === '' ? '' : parseFloat(e.target.value) || '' }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    cogsTrackingEnabled ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  required={cogsTrackingEnabled}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {cogsTrackingEnabled 
                    ? '⚠️ Required: Your actual cost per unit from supplier'
                    : 'Optional: Cost of goods for COGS tracking'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Stock *
                </label>
                <input
                  type="number"
                  min="0"
                  value={newProductData.stock_quantity}
                  onChange={(e) => setNewProductData(prev => ({ ...prev, stock_quantity: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={newProductData.min_stock_level}
                  onChange={(e) => setNewProductData(prev => ({ ...prev, min_stock_level: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <div className="flex gap-2">
                <select
                  value={newProductData.category_id}
                  onChange={(e) => setNewProductData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCategoryModal(true)}
                  className="px-3"
                >
                  +
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <select
                value={newProductData.location_id}
                onChange={(e) => setNewProductData(prev => ({ ...prev, location_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Location</option>
                {userLocations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.type === 'pos' ? 'POS' : 'Inventory'})
                  </option>
                ))}
              </select>
              {userLocations.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No locations available. Please add a location first.
                </p>
              )}
              {userLocations.length > 1 && newProductData.location_id && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('defaultLocationId', newProductData.location_id);
                    const selectedLocation = userLocations.find(loc => loc.id === newProductData.location_id);
                    alert(`✓ "${selectedLocation?.name}" set as your default location`);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 mt-1 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Set as my default location
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Image
              </label>
              <div className="space-y-2">
                {productImagePreview ? (
                  <div className="relative">
                    <img
                      src={productImagePreview}
                      alt="Product preview"
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={() => {
                        setProductImageFile(null);
                        setProductImagePreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="product-image-input"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="product-image-input"
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium text-gray-700"
                    >
                      Choose Image
                    </label>
                    <span className="text-xs text-gray-500">Max 5MB, image files only</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setShowAddProductModal(false);
                  setNewProductData({
                    name: '',
                    sku: '',
                    price: '',
                    cost_price: '',
                    stock_quantity: '',
                    min_stock_level: '',
                    brand_id: '',
                    category_id: '',
                    location_id: '',
                    image_url: ''
                  });
                  setProductImageFile(null);
                  setProductImagePreview('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddProduct}
                disabled={!newProductData.name || !newProductData.location_id || (typeof newProductData.price === 'string' ? parseFloat(newProductData.price) || 0 : newProductData.price) <= 0 || isAddingProduct}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isAddingProduct ? 'Adding...' : 'Add Product'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Edit Product Modal */}
    {showEditProductModal && selectedProductForEdit && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
        <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-6 pb-4 border-b border-gray-200 z-10">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Edit Product</h3>
              <button
                onClick={() => {
                  setShowEditProductModal(false);
                  setSelectedProductForEdit(null);
                  setEditProductData({
                    name: '',
                    sku: '',
                    price: '',
                    stock_quantity: '',
                    min_stock_level: '',
                    brand_id: '',
                    category_id: '',
                    image_url: ''
                  });
                  setEditImageFile(null);
                  setEditImagePreview('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={editProductData.name}
                onChange={(e) => setEditProductData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                type="text"
                value={editProductData.sku}
                onChange={(e) => setEditProductData(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter SKU"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <div className="flex gap-2">
                <select
                  value={editProductData.brand_id}
                  onChange={(e) => setEditProductData(prev => ({ ...prev, brand_id: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Brand</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddBrandModal(true)}
                  className="px-3"
                >
                  +
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (TZS) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editProductData.price}
                  onChange={(e) => setEditProductData(prev => ({ ...prev, price: e.target.value === '' ? '' : parseFloat(e.target.value) || '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={editProductData.stock_quantity}
                  onChange={(e) => setEditProductData(prev => ({ ...prev, stock_quantity: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={editProductData.min_stock_level}
                  onChange={(e) => setEditProductData(prev => ({ ...prev, min_stock_level: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="flex gap-2">
                  <select
                    value={editProductData.category_id}
                    onChange={(e) => setEditProductData(prev => ({ ...prev, category_id: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCategoryModal(true)}
                    className="px-3"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Image
              </label>
              <div className="space-y-2">
                {editImagePreview ? (
                  <div className="relative">
                    <img
                      src={editImagePreview}
                      alt="Product preview"
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={() => {
                        setEditImageFile(null);
                        setEditImagePreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="edit-product-image-input"
                      accept="image/*"
                      onChange={handleEditImageSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="edit-product-image-input"
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium text-gray-700"
                    >
                      Choose Image
                    </label>
                    <span className="text-xs text-gray-500">Max 5MB, image files only</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setShowEditProductModal(false);
                  setSelectedProductForEdit(null);
                  setEditProductData({
                    name: '',
                    sku: '',
                    price: '',
                    stock_quantity: '',
                    min_stock_level: '',
                    brand_id: '',
                    category_id: '',
                    image_url: ''
                  });
                  setEditImageFile(null);
                  setEditImagePreview('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditProduct}
                disabled={!editProductData.name || (typeof editProductData.price === 'string' ? parseFloat(editProductData.price) || 0 : editProductData.price) <= 0 || isEditingProduct}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isEditingProduct ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Add Category Modal */}
    {showAddCategoryModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add New Category</h3>
            <button
              onClick={() => {
                setShowAddCategoryModal(false);
                setNewCategoryData({ name: '', description: '' });
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                value={newCategoryData.name}
                onChange={(e) => setNewCategoryData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter category name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newCategoryData.description}
                onChange={(e) => setNewCategoryData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter category description"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryData({ name: '', description: '' });
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={!newCategoryData.name.trim() || isAddingCategory}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isAddingCategory ? 'Adding...' : 'Add Category'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Add Brand Modal */}
    {showAddBrandModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add New Brand</h3>
            <button
              onClick={() => {
                setShowAddBrandModal(false);
                setNewBrandData({ name: '', description: '' });
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                value={newBrandData.name}
                onChange={(e) => setNewBrandData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter brand name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newBrandData.description}
                onChange={(e) => setNewBrandData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter brand description"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setShowAddBrandModal(false);
                  setNewBrandData({ name: '', description: '' });
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddBrand}
                disabled={!newBrandData.name.trim() || isAddingBrand}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isAddingBrand ? 'Adding...' : 'Add Brand'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Post-Order Modal */}
      <PostOrderModal
        isOpen={showPostOrderModal}
        onClose={() => {
          setShowPostOrderModal(false);
          setCompletedOrderData(null);
        }}
        orderData={completedOrderData}
        formatCurrency={formatCurrency}
        onPrint={() => {
          if (completedOrderData) {
            printCompletedOrder(completedOrderData);
          }
          setShowPostOrderModal(false);
          setCompletedOrderData(null);
        }}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={showOrderDetailsModal}
        onClose={() => {
          setShowOrderDetailsModal(false);
          setSelectedOrderForDetails(null);
        }}
        order={selectedOrderForDetails}
        formatCurrency={formatCurrency}
      />

      {/* Stock Validation Error Modal */}
      {showStockValidationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 text-white p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Insufficient Stock</h3>
                    <p className="text-red-100 mt-1">
                      {stockValidationErrors.length} product{stockValidationErrors.length > 1 ? 's are' : ' is'} unavailable at selected warehouse
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStockValidationModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-900">
                  <strong>⚠️ Action Required:</strong> The following products don't have enough stock at the selected warehouse. 
                  Please adjust quantities, remove items, or switch to a different warehouse.
                </p>
              </div>

              {/* Stock Errors Table */}
              <div className="space-y-3">
                {stockValidationErrors.map((error, index) => (
                  <div 
                    key={index} 
                    className="border border-red-200 rounded-lg p-4 bg-red-50/50 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-5 w-5 text-red-600" />
                          <h4 className="font-semibold text-slate-900">{error.productName}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-slate-600">SKU:</span>
                            <span className="ml-2 font-medium text-slate-900">{error.sku}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">Brand:</span>
                            <span className="ml-2 font-medium text-slate-900">{error.brand}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">Warehouse:</span>
                            <span className="ml-2 font-medium text-blue-700">{error.warehouse}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stock Info */}
                      <div className="flex items-center gap-6 bg-white rounded-lg p-4 border border-red-200">
                        <div className="text-center">
                          <div className="text-xs text-slate-600 mb-1">Needed</div>
                          <div className="text-2xl font-bold text-red-600">{error.needed}</div>
                        </div>
                        <div className="text-2xl text-slate-400">vs</div>
                        <div className="text-center">
                          <div className="text-xs text-slate-600 mb-1">Available</div>
                          <div className="text-2xl font-bold text-slate-900">
                            {error.available}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shortage indicator */}
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-red-800 font-medium">
                          ❌ Short by: {error.needed - error.available} unit{(error.needed - error.available) > 1 ? 's' : ''}
                        </span>
                        {error.available === 0 && (
                          <span className="text-red-900 bg-red-200 px-3 py-1 rounded-full text-xs font-bold">
                            OUT OF STOCK
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-slate-600">
                  <strong>💡 Tip:</strong> Check other warehouses or adjust order quantities
                </div>
                <Button
                  onClick={() => setShowStockValidationModal(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  Close & Edit Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Settings Modal */}
      {showCompanySettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">🏢 Company Information</h3>
                <button
                  onClick={() => setShowCompanySettingsModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <p className="text-sm text-slate-600 mb-6">
                This information will appear on all invoices and receipts.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="COPCCA CRM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Business Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="123 Business Ave, District"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyInfo.city}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyInfo.country}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, country: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Country"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="+255 XXX XXX XXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="info@copcca.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tax ID / TIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyInfo.tin}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, tin: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="123456789"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCompanySettingsModal(false)}
                  disabled={isSavingCompanyInfo}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCompanyInfo}
                  disabled={isSavingCompanyInfo}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSavingCompanyInfo ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Save Changes</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
  );
};

export default SalesHub;
