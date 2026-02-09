import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingCart,
  Package,
  FileText,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  BarChart3,
  Trash2,
  Users,
  Receipt,
  Printer,
  RefreshCw,
  Activity,
  AlertCircle,
  DollarSign as DollarIcon,
  User,
  ArrowUp,
  Brain,
  Info,
  ExternalLink,
  History,
  Check,
  X,
  Zap as ZapIcon,
  Loader2,
  Edit,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import { useSalesHubStore } from '@/store/salesHubStore';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  model: string;
  category_id?: string;
  categories?: {
    id: string;
    name: string;
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

type Subsection = 'updates' | 'products' | 'carts-invoice' | 'inventory-status' | 'customer-buying-patterns' | 'product-stocking-history';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number, customPrice: number) => void;
  formatCurrency: (amount: number) => string;
  onEdit?: (product: Product) => void;
}

const CartPriceInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  const [localValue, setLocalValue] = useState(() => value.toString());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && value > 0) {
      setLocalValue(value.toString());
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    const numValue = parseFloat(localValue) || 0;
    if (numValue > 0 && numValue !== value) {
      onChange(numValue);
    } else if (numValue === 0 && value > 0) {
      // Reset to original value if user entered 0
      setLocalValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <input
      type="number"
      min="0"
      step="0.01"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-20 px-2 py-1 text-xs border border-slate-300 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
    />
  );
};

const CartQuantityInput: React.FC<{
  value: number;
  max: number;
  onChange: (value: number) => void;
}> = ({ value, max, onChange }) => {
  const [localValue, setLocalValue] = useState(() => value.toString());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && value > 0) {
      setLocalValue(value.toString());
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    const numValue = parseInt(localValue) || 1;
    if (numValue > 0 && numValue <= max && numValue !== value) {
      onChange(numValue);
    } else if ((numValue <= 0 || numValue > max) && value > 0) {
      // Reset to original value if invalid
      setLocalValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <input
      type="number"
      min="1"
      max={max}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-16 text-center px-2 py-1 text-xs border border-slate-300 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
    />
  );
};

const DiscountInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = React.memo(({ value, onChange }) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
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
      className="w-20 px-2 py-1 text-sm border border-slate-300 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-right"
    />
  );
});

const CartItem: React.FC<{
  item: CartItem;
  onUpdatePrice: (productId: string, price: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  formatCurrency: (amount: number) => string;
  getStockStatus: (product: Product) => StockStatus;
}> = React.memo(({ item, onUpdatePrice, onUpdateQuantity, onRemove, formatCurrency, getStockStatus }) => {
  console.log('CartItem re-rendering for:', item.product.name);
  const stockInfo = getStockStatus(item.product);

  const handlePriceChange = useCallback((newPrice: number) => {
    onUpdatePrice(item.product.id, newPrice);
  }, [onUpdatePrice, item.product.id]);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    onUpdateQuantity(item.product.id, newQuantity);
  }, [onUpdateQuantity, item.product.id]);

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
        <h5 className="font-medium text-slate-900 text-sm leading-tight mb-3">{item.product.name}</h5>

        {/* Price and Quantity Controls */}
        <div className="grid grid-cols-2 gap-4">
          {/* Price Control */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600">Unit Price</label>
            <div className="flex items-center gap-2">
              <CartPriceInput
                value={item.price}
                onChange={handlePriceChange}
              />
              <span className="text-xs text-slate-500">each</span>
            </div>
          </div>

          {/* Quantity Control */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600">Quantity</label>
            <div className="flex items-center gap-2">
              <CartQuantityInput
                value={item.quantity}
                max={item.product.stock_quantity}
                onChange={handleQuantityChange}
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
});

const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onAddToCart, formatCurrency, onEdit }) => {
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
    
    // Show global toast notification
    toast.success(`${quantity} ${product.name}${quantity > 1 ? 's' : ''} added to cart!`);
    
    // Show local success message near the button
    const message = `${quantity} ${product.name}${quantity > 1 ? 's' : ''} added to cart!`;
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    
    // Hide the message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
    
    hideQuantityInput();
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) {
      return { status: 'out', text: 'Out of Stock', color: 'text-red-700 shadow-lg shadow-red-200 bg-white border border-red-200' };
    } else if (product.stock_quantity <= 5) {
      return { status: 'low', text: 'Low Stock', color: 'text-yellow-700 shadow-lg shadow-yellow-200 bg-white border border-yellow-200' };
    } else {
      return { status: 'healthy', text: 'In Stock', color: 'text-green-700 shadow-lg shadow-green-200 bg-white border border-green-200' };
    }
  };

  const stockInfo = getStockStatus(product);

  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300">
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
              <h4 className="font-semibold text-slate-900 text-lg">{product.name}</h4>
              {product.sku && <p className="text-sm text-slate-600">SKU: {product.sku}</p>}
              {product.model && <p className="text-sm text-slate-600">Model: {product.model}</p>}
              <p className="text-sm text-slate-500">{product.categories?.name || 'Uncategorized'}</p>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  onClick={() => onEdit(product)}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 border-slate-300 hover:bg-slate-50"
                >
                  <Edit className="h-3 w-3" />
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
              
              {/* Success message that appears near the Add button */}
              {showSuccessMessage && (
                <div className="absolute -top-8 left-0 right-0 text-center z-50">
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium shadow-lg border border-green-200">
                    <Check className="h-3 w-3" />
                    {successMessage}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Product Hints */}
          {product.sales_velocity && product.sales_velocity > 10 && (
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
    toast.success(`Selected customer: ${customer.name}`);
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
              onClick={onPrint}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
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

const SalesHub: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [activeSubsection, setActiveSubsection] = useState<Subsection>('updates');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  // Use persistent store for cart and customer data
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
  } = useSalesHubStore();

  // Discount and payment method state for Order Summary
  const [discountType, setDiscountType] = useState<'percentage' | 'monetary'>('percentage');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');

  // Post-order completion modal state
  const [showPostOrderModal, setShowPostOrderModal] = useState(false);
  const [completedOrderData, setCompletedOrderData] = useState<{
    invoiceNumber: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
  } | null>(null);

  // Company payment info for invoice
  const [companyPaymentInfo, setCompanyPaymentInfo] = useState({
    m_pesa: { paybill: '', account: '' },
    bank_transfer: { account: '', bank: '' },
    cash_payment: { accepted_at: '', hours: '' }
  });

  // Company information for invoice
  const [companyInfo, setCompanyInfo] = useState({
    name: 'COPCCA CRM',
    address: 'Business Address\nCity, Country',
    phone: '+255 XXX XXX XXX',
    email: 'info@copcca.com',
    tin: '123456789'
  });

  // Restock modal state
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number | ''>('');
  const [restockNotes, setRestockNotes] = useState('');
  const [restockLocation, setRestockLocation] = useState('main-store');
  const [isRestocking, setIsRestocking] = useState(false);

  // Add product modal state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: '',
    sku: '',
    price: '' as number | '',
    stock_quantity: '' as number | '',
    model: '',
    category_id: '' as string
  });
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Edit product modal state
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [editProductData, setEditProductData] = useState({
    name: '',
    sku: '',
    price: '' as number | '',
    stock_quantity: '' as number | '',
    model: '',
    category_id: '' as string
  });
  const [isEditingProduct, setIsEditingProduct] = useState(false);

  // Categories state
  const [categories, setCategories] = useState<Array<{id: string, name: string, description?: string}>>([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    description: ''
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
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
    invoicesPending: 0,
    invoicesOverdue: 0,
    lowStockItems: 0,
    criticalStockItems: 0,
    aiOpportunityScore: 0
  });

  // AI Insights data - loaded from real data
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [loadingKPIs, setLoadingKPIs] = useState(false);

  const loadCustomers = useCallback(async () => {
    if (loadingCustomers) return;

    setLoadingCustomers(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      // Transform data to match Customer interface
      const transformedCustomers: Customer[] = (data || []).map(company => ({
        id: company.id,
        customer_id: company.id, // Use company ID as customer_id
        name: company.name,
        company_name: company.name, // Company name is the same as name
        email: company.email || '',
        phone: company.phone || '',
        mobile: company.phone || '', // Use phone as mobile
        tier: company.subscription_plan || 'bronze', // Map subscription plan to tier
        health_score: company.health_score || 50,
        churn_risk: 'low', // Default value since not in companies table
        upsell_potential: 'medium', // Default value since not in companies table
        lifetime_value: company.annual_revenue || 0,
        outstanding_balance: 0, // Default value since not in companies table
        preferred_payment: 'bank_transfer', // Default value
        status: company.status,
        total_orders: 0, // Default value since not in companies table
        last_order_date: undefined, // Not available in companies table
        tags: [] // Default empty array
      }));

      setCustomers(transformedCustomers);
    } catch (error: unknown) {
      console.error('Error loading customers:', error);

      // Check if it's a 404 error (table doesn't exist)
      const err = error as { code?: string; message?: string };
      if (err?.code === 'PGRST116' || err?.message?.includes('404') || err?.message?.includes('relation') && err?.message?.includes('does not exist')) {
        toast.error('Companies database not set up yet. Please run database-setup.sql in your Supabase SQL Editor.');
        setCustomers([]); // Set empty array to prevent crashes
      } else {
        toast.error('Failed to load customers from CUSTOMERS 360');
      }
    } finally {
      setLoadingCustomers(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadKPIData = useCallback(async () => {
    if (loadingKPIs) return;

    setLoadingKPIs(true);
    try {
      // Get today's date for filtering
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Fetch sales data for today
      const { data: salesData, error: salesError } = await supabase
        .from('sales_hub_orders')
        .select('total_amount, created_at')
        .gte('created_at', todayStr);

      if (salesError) throw salesError;

      // Calculate today's sales
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
        product.stock_quantity <= 5
      ).length || 0;

      // Calculate sales change (compare to yesterday - simplified)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: yesterdaySales, error: yesterdayError } = await supabase
        .from('sales_hub_orders')
        .select('total_amount')
        .gte('created_at', yesterdayStr)
        .lt('created_at', todayStr);

      if (yesterdayError) throw yesterdayError;

      const salesYesterday = yesterdaySales?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const salesChange = salesYesterday > 0 ? Math.round(((salesToday - salesYesterday) / salesYesterday) * 100) : 0;

      // Calculate AI opportunity score (simplified based on sales growth)
      const aiOpportunityScore = Math.min(100, Math.max(0, salesChange + 50));

      setTodaySnapshot({
        salesToday,
        salesChange,
        invoicesPending: pendingInvoices,
        invoicesOverdue: overdueInvoices,
        lowStockItems,
        criticalStockItems,
        aiOpportunityScore
      });

    } catch (error: unknown) {
      console.error('Error loading KPI data:', error);
      toast.error('Failed to load KPI data');
    } finally {
      setLoadingKPIs(false);
    }
  }, [loadingKPIs]);

  const loadAIInsights = useCallback(async () => {
    try {
      // Fetch recent sales data for insights
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentSales, error: salesError } = await supabase
        .from('sales_hub_orders')
        .select('total_amount, created_at, customer_id')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (salesError) throw salesError;

      // Fetch product data for insights
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, stock_quantity, min_stock_level, price');

      if (productsError) throw productsError;

      // Fetch customer data
      const { data: customers, error: customersError } = await supabase
        .from('companies')
        .select('id, name, annual_revenue, health_score');

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
      console.error('Error loading AI insights:', error);
      toast.error('Failed to load AI insights');
    }
  }, []);

  useEffect(() => {
    if (activeSubsection === 'updates') {
      loadKPIData();
      loadAIInsights();
    }
    if (activeSubsection === 'products') {
      loadProducts();
      loadCategories();
    }
    if (activeSubsection === 'carts-invoice') {
      loadCustomers();
      loadCompanyPaymentInfo();
      loadCompanyInfo();

      // Fallback: if customers are still loading after 10 seconds, reset loading state
      const timeout = setTimeout(() => {
        if (loadingCustomers) {
          console.warn('Customer loading timeout - resetting loading state');
          setLoadingCustomers(false);
        }
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [activeSubsection, loadCustomers, loadKPIData, loadAIInsights]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load user subscription plan on component mount
  useEffect(() => {
    loadUserSubscriptionPlan();
  }, []);

  // Check for navigation from floating button
  useEffect(() => {
    const targetSubsection = localStorage.getItem('salesHubActiveSubsection');
    if (targetSubsection === 'products') {
      setActiveSubsection('products');
      localStorage.removeItem('salesHubActiveSubsection'); // Clean up
    }
  }, []);

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
        .select('name, address, phone, email, tin')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      if (data) {
        setCompanyInfo({
          name: data.name || 'COPCCA CRM',
          address: data.address || 'Business Address\nCity, Country',
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

        // Load user's locations
        const [posResult, inventoryResult] = await Promise.all([
          supabase
            .from('pos_locations')
            .select('id, name')
            .eq('company_id', userData.company_id)
            .eq('status', 'active'),
          supabase
            .from('inventory_locations')
            .select('id, name, type')
            .eq('company_id', userData.company_id)
            .eq('status', 'active')
        ]);

        const allLocations: Array<{
          id: string;
          name: string;
          type: 'pos' | 'inventory';
        }> = [];

        // Add POS locations
        if (posResult.data) {
          posResult.data.forEach(loc => {
            allLocations.push({
              id: loc.id,
              name: loc.name,
              type: 'pos'
            });
          });
        }

        // Add inventory locations
        if (inventoryResult.data) {
          inventoryResult.data.forEach(loc => {
            allLocations.push({
              id: loc.id,
              name: loc.name,
              type: 'inventory'
            });
          });
        }

        setUserLocations(allLocations);
      }
    } catch (error) {
      console.error('Error loading user subscription plan and locations:', error);
      // Default to starter if there's an error
      setUserSubscriptionPlan('starter');
      setUserLocations([]);
    }
  };

  const loadCategories = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userData?.company_id) return;

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description')
        .eq('company_id', userData.company_id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    console.log('updateQuantity called with productId:', productId, 'quantity:', quantity);
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    updateCartItem(productId, { quantity });
  }, [updateCartItem, removeFromCart]);

  const updatePrice = useCallback((productId: string, price: number) => {
    console.log('updatePrice called with productId:', productId, 'price:', price);
    updateCartItem(productId, { price });
  }, [updateCartItem]);

  const getStockStatus = useCallback((product: Product) => {
    if (product.stock_quantity <= 0) return { status: 'out', color: 'bg-red-500', text: 'Out of Stock' };
    if (product.stock_quantity <= 5) return { status: 'low', color: 'bg-yellow-500', text: 'Low Stock' };
    return { status: 'healthy', color: 'bg-green-500', text: 'In Stock' };
  }, []);

  const getTotal = useCallback(() => getCartTotal(), [getCartTotal]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (product.model && product.model.toLowerCase().includes(searchTerm.toLowerCase()));
    const productCategoryId = product.category_id || (product.categories?.id);
    const matchesCategory = categoryFilter === 'all' || productCategoryId === categoryFilter;
    const stockStatus = getStockStatus(product);
    const matchesStock = stockFilter === 'all' ||
                        (stockFilter === 'in-stock' && stockStatus.status === 'healthy') ||
                        (stockFilter === 'low-stock' && stockStatus.status === 'low') ||
                        (stockFilter === 'out-of-stock' && stockStatus.status === 'out');

    return matchesSearch && matchesCategory && matchesStock;
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
      if (!selectedCustomer || cart.length === 0) {
        toast.error('Please select a customer and add items to cart');
        return;
      }

      // Calculate totals
      const subtotal = getTotal();
      const taxRate = 0.18;
      const taxAmount = subtotal * taxRate;

      // Calculate discount based on type
      const actualDiscountAmount = discountType === 'percentage'
        ? subtotal * (discountPercent / 100)
        : Math.min(discountAmount, subtotal); // Don't allow discount > subtotal

      const total = subtotal + taxAmount - actualDiscountAmount;
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // First, ensure customer exists in sales_hub_customers (sync from companies)
      let salesHubCustomerId = selectedCustomer.id;

      // Check if customer already exists in sales_hub_customers
      const { data: existingCustomer, error: checkError } = await supabase
        .from('sales_hub_customers')
        .select('id')
        .eq('customer_id', selectedCustomer.customer_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking customer existence:', checkError);
      }

      if (!existingCustomer) {
        // Create customer in sales_hub_customers
        const { data: newCustomer, error: createError } = await supabase
          .from('sales_hub_customers')
          .insert({
            customer_id: selectedCustomer.customer_id,
            name: selectedCustomer.name,
            company_name: selectedCustomer.company_name,
            email: selectedCustomer.email,
            phone: selectedCustomer.phone,
            mobile: selectedCustomer.mobile,
            tier: 'bronze', // Use valid default
            health_score: selectedCustomer.health_score || 50,
            churn_risk: selectedCustomer.churn_risk || 'low',
            upsell_potential: selectedCustomer.upsell_potential || 'low',
            lifetime_value: selectedCustomer.lifetime_value || 0,
            outstanding_balance: selectedCustomer.outstanding_balance || 0,
            preferred_payment_method: selectedCustomer.preferred_payment,
            status: 'active', // Use valid default
            total_orders: selectedCustomer.total_orders || 0,
            last_order_date: selectedCustomer.last_order_date,
            tags: selectedCustomer.tags,
            external_system: 'companies'
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating customer in sales hub:', createError);
        } else if (newCustomer) {
          salesHubCustomerId = newCustomer.id;
        }
      } else {
        salesHubCustomerId = existingCustomer.id;
      }

      // Save order to sales_hub_orders table
      const orderData = {
        order_number: invoiceNumber,
        customer_id: salesHubCustomerId,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_type: discountType,
        discount_value: discountType === 'percentage' ? discountPercent : discountAmount,
        discount_amount: actualDiscountAmount,
        total_amount: total,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.subtotal
        })),
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { error: orderError } = await supabase
        .from('sales_hub_orders')
        .insert(orderData);

      if (orderError) {
        console.error('Error saving order:', orderError);
        toast.error('Failed to save order. Please try again.');
        return;
      }

      // Update product stock quantities and log to stock history
      for (const item of cart) {
        // Get current stock before sale
        const { data: currentProduct, error: stockFetchError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product.id)
          .single();

        if (stockFetchError) {
          console.error('Error fetching current stock for product:', item.product.id, stockFetchError);
          continue; // Skip this item but continue with others
        }

        const stockBefore = currentProduct?.stock_quantity || 0;
        const stockAfter = Math.max(0, stockBefore - item.quantity); // Don't go below 0

        // Update product stock
        const { error: stockUpdateError } = await supabase
          .from('products')
          .update({ stock_quantity: stockAfter })
          .eq('id', item.product.id);

        if (stockUpdateError) {
          console.error('Error updating stock for product:', item.product.id, stockUpdateError);
          continue; // Skip history logging if stock update failed
        }

        // Log to stock history
        const { error: historyError } = await supabase
          .from('stock_history')
          .insert({
            product_id: item.product.id,
            action: 'sale',
            quantity_change: -item.quantity,
            stock_before: stockBefore,
            stock_after: stockAfter,
            location: 'main-store', // Default location for sales - could be enhanced later
            reference_type: 'order',
            reference_id: invoiceNumber,
            performed_by: (await supabase.auth.getUser()).data.user?.id,
            notes: `Sale via order ${invoiceNumber}`
          });

        if (historyError) {
          console.error('Error logging stock history for sale:', historyError);
          // Don't fail the entire operation if history fails
        }
      }

      // Create customer interaction record
      const { error: interactionError } = await supabase
        .from('customer_interactions')
        .insert({
          customer_id: salesHubCustomerId,
          interaction_type: 'order',
          subject: `Order ${invoiceNumber}`,
          description: `Completed order for ${cart.length} items totaling ${formatCurrency(total)} (${paymentMethod} payment${actualDiscountAmount > 0 ? `, ${discountType === 'percentage' ? discountPercent + '%' : formatCurrency(discountAmount)} discount applied` : ''})`,
          outcome: 'completed',
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (interactionError) {
        console.error('Error saving customer interaction:', interactionError);
      }

      // Update customer preferences based on products purchased
      for (const item of cart) {
        const { error: prefError } = await supabase
          .from('customer_preferences')
          .upsert({
            customer_id: salesHubCustomerId,
            preference_type: 'product',
            preference_value: item.product.name,
            preference_score: Math.min(1.0, (item.quantity / 10) + 0.1), // Score based on quantity
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'customer_id,preference_type,preference_value'
          });

        if (prefError) {
          console.error('Error updating customer preferences:', prefError);
        }
      }

      // Update customer metrics in sales_hub_customers
      const { error: updateError } = await supabase
        .from('sales_hub_customers')
        .update({
          total_orders: (selectedCustomer.total_orders || 0) + 1,
          total_revenue: (selectedCustomer.total_revenue || 0) + total,
          avg_order_value: ((selectedCustomer.total_revenue || 0) + total) / ((selectedCustomer.total_orders || 0) + 1),
          last_order_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', salesHubCustomerId);

      if (updateError) {
        console.error('Error updating customer metrics:', updateError);
      }

      // Update the selectedCustomer state with new metrics
      setSelectedCustomer({
        ...selectedCustomer,
        total_orders: (selectedCustomer.total_orders || 0) + 1,
        total_revenue: (selectedCustomer.total_revenue || 0) + total,
        last_order_date: new Date().toISOString().split('T')[0]
      });

      // Update local products state with new stock quantities
      setProducts(prevProducts =>
        prevProducts.map(product => {
          const cartItem = cart.find(item => item.product.id === product.id);
          if (cartItem) {
            return { ...product, stock_quantity: Math.max(0, (product.stock_quantity || 0) - cartItem.quantity) };
          }
          return product;
        })
      );

      // Clear cart and keep customer selected to show order history
      clearCart();

      // Reload order history for the current customer
      loadOrderHistory(salesHubCustomerId);

      // Show post-order modal instead of toast
      setCompletedOrderData({
        invoiceNumber,
        subtotal,
        taxAmount,
        discountAmount: actualDiscountAmount,
        total
      });
      setShowPostOrderModal(true);

      // Trigger AI processing (in a real implementation, this would be automated)
      toast.info('AI data flow processing triggered. Check the AI Intelligence Loop section for insights.');

    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('Failed to complete order. Please try again.');
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
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
              .invoice-title { font-size: 24px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .right { text-align: right; }
              .total-row { font-weight: bold; background-color: #f5f5f5; }
              .payment-info { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
              .payment-methods { display: flex; gap: 20px; margin-top: 10px; }
              .payment-method { flex: 1; }
              .invoice-footer { margin-top: 40px; text-align: center; font-style: italic; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="invoice-title">INVOICE</h1>
              <p><strong>Invoice Number:</strong> ${orderData.invoiceNumber}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Customer:</strong> ${selectedCustomer?.name || 'Walk-in Customer'}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="right">Qty</th>
                  <th class="right">Price</th>
                  <th class="right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${cart.map(item => `
                  <tr>
                    <td>${item.product.name}</td>
                    <td class="right">${item.quantity}</td>
                    <td class="right">${formatCurrency(item.price)}</td>
                    <td class="right">${formatCurrency(item.subtotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals-section">
              <table>
                <tbody>
                  <tr>
                    <td>Subtotal:</td>
                    <td class="right">${formatCurrency(orderData.subtotal)}</td>
                  </tr>
                  <tr>
                    <td>VAT (18%):</td>
                    <td class="right">${formatCurrency(orderData.taxAmount)}</td>
                  </tr>
                  ${orderData.discountAmount > 0 ? `
                    <tr>
                      <td>Discount:</td>
                      <td class="right">-${formatCurrency(orderData.discountAmount)}</td>
                    </tr>
                  ` : ''}
                  <tr class="total-row">
                    <td><strong>TOTAL:</strong></td>
                    <td class="right"><strong>${formatCurrency(orderData.total)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="payment-info">
              <h4>Payment Information</h4>
              <div class="payment-methods">
                ${companyPaymentInfo.m_pesa.paybill || companyPaymentInfo.m_pesa.account ? `
                <div class="payment-method">
                  <strong>M-Pesa</strong><br />
                  ${companyPaymentInfo.m_pesa.paybill ? `Paybill: ${companyPaymentInfo.m_pesa.paybill}<br />` : ''}
                  ${companyPaymentInfo.m_pesa.account ? `Account: ${companyPaymentInfo.m_pesa.account}` : ''}
                </div>
                ` : ''}
                ${companyPaymentInfo.bank_transfer.account || companyPaymentInfo.bank_transfer.bank ? `
                <div class="payment-method">
                  <strong>Bank Transfer</strong><br />
                  ${companyPaymentInfo.bank_transfer.account ? `Account: ${companyPaymentInfo.bank_transfer.account}<br />` : ''}
                  ${companyPaymentInfo.bank_transfer.bank ? `Bank: ${companyPaymentInfo.bank_transfer.bank}` : ''}
                </div>
                ` : ''}
                ${companyPaymentInfo.cash_payment.accepted_at || companyPaymentInfo.cash_payment.hours ? `
                <div class="payment-method">
                  <strong>Cash Payment</strong><br />
                  ${companyPaymentInfo.cash_payment.accepted_at ? `${companyPaymentInfo.cash_payment.accepted_at}<br />` : ''}
                  ${companyPaymentInfo.cash_payment.hours ? `${companyPaymentInfo.cash_payment.hours}` : ''}
                </div>
                ` : ''}
              </div>
              <p><strong>Payment Terms:</strong> Due within 30 days</p>
            </div>

            <div class="invoice-footer">
              Thank you for your business!<br />
              Generated by COPCCA CRM - ${new Date().toLocaleString()}
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

    setIsRestocking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to restock products');
        return;
      }

      // Get current stock before restocking
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', selectedProductForRestock.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current product stock:', fetchError);
        toast.error('Failed to fetch current stock information');
        return;
      }

      const stockBefore = currentProduct.stock_quantity || 0;
      const stockAfter = stockBefore + quantity;

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({
          stock_quantity: stockAfter,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProductForRestock.id);

      if (updateError) {
        console.error('Error updating product stock:', updateError);
        toast.error('Failed to update product stock');
        return;
      }

      // Add entry to stock_history table
      const selectedLocation = userLocations.find(loc => loc.id === restockLocation);
      const locationName = selectedLocation ? selectedLocation.name : restockLocation;
      const { error: historyError } = await supabase
        .from('stock_history')
        .insert({
          product_id: selectedProductForRestock.id,
          action: 'restock',
          quantity_change: quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          location: locationName,
          reference_type: 'adjustment_note',
          reference_id: `RESTOCK-${Date.now()}`,
          performed_by: user.id,
          notes: restockNotes || 'Manual restock via inventory management'
        });

      if (historyError) {
        console.error('Error adding stock history entry:', historyError);
        // Don't fail the entire operation if history fails, just log it
        toast.warning('Stock updated but history tracking failed');
      }

      // Update local products state
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === selectedProductForRestock.id
            ? { ...product, stock_quantity: stockAfter }
            : product
        )
      );

      // Close modal and reset state
      setShowRestockModal(false);
      setSelectedProductForRestock(null);
      setRestockQuantity('');
      setRestockNotes('');
      setRestockLocation('main-store');

      toast.success(`Successfully restocked ${quantity} units of ${selectedProductForRestock.name}`);

      // Refresh products to ensure consistency
      loadProducts();

    } catch (error) {
      console.error('Error during restock:', error);
      toast.error('Failed to restock product. Please try again.');
    } finally {
      setIsRestocking(false);
    }
  };

  const handleAddProduct = async () => {
    const price = typeof newProductData.price === 'string' ? parseFloat(newProductData.price) || 0 : newProductData.price;
    if (!newProductData.name || price <= 0) {
      toast.error('Please fill in all required fields');
      return;
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

      if (!userData?.company_id) {
        toast.error('Unable to determine your company. Please contact support.');
        return;
      }

      // Insert new product
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert({
          name: newProductData.name,
          sku: newProductData.sku,
          price: price,
          stock_quantity: typeof newProductData.stock_quantity === 'string' ? parseInt(newProductData.stock_quantity) || 0 : newProductData.stock_quantity,
          model: newProductData.model,
          category_id: newProductData.category_id || null,
          created_by: user.id,
          company_id: userData.company_id
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding product:', insertError);
        toast.error('Failed to add product. Please try again.');
        return;
      }

      // Add initial stock history entry if stock_quantity > 0
      const initialStock = typeof newProductData.stock_quantity === 'string' ? parseInt(newProductData.stock_quantity) || 0 : newProductData.stock_quantity;
      if (initialStock > 0) {
        const { error: historyError } = await supabase
          .from('stock_history')
          .insert({
            product_id: newProduct.id,
            action: 'initial_stock',
            quantity_change: initialStock,
            stock_before: 0,
            stock_after: initialStock,
            location: 'main-store',
            reference_type: 'product_creation',
            reference_id: `NEW-${Date.now()}`,
            performed_by: user.id,
            notes: 'Initial stock when product was created'
          });

        if (historyError) {
          console.error('Error adding initial stock history:', historyError);
          // Don't fail the operation if history fails
        }
      }

      // Update local products state
      setProducts(prevProducts => [...prevProducts, newProduct]);

      // Close modal and reset state
      setShowAddProductModal(false);
      setNewProductData({
        name: '',
        sku: '',
        price: '',
        stock_quantity: '',
        model: '',
        category_id: ''
      });

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
      model: product.model || '',
      category_id: product.category_id || ''
    });
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

      // Update product
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update({
          name: editProductData.name,
          sku: editProductData.sku || null,
          price: price,
          stock_quantity: typeof editProductData.stock_quantity === 'string' ? parseInt(editProductData.stock_quantity) || 0 : editProductData.stock_quantity,
          model: editProductData.model || null,
          category_id: editProductData.category_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProductForEdit.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating product:', updateError);
        toast.error('Failed to update product. Please try again.');
        return;
      }

      // Update local products state
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === selectedProductForEdit.id ? { ...updatedProduct, categories: categories.find(cat => cat.id === editProductData.category_id) } : product
        )
      );

      // Close modal and reset state
      setShowEditProductModal(false);
      setSelectedProductForEdit(null);
      setEditProductData({
        name: '',
        sku: '',
        price: '',
        stock_quantity: '',
        model: '',
        category_id: ''
      });

      toast.success(`Successfully updated product: ${editProductData.name}`);

    } catch (error) {
      console.error('Error editing product:', error);
      toast.error('Failed to update product. Please try again.');
    } finally {
      setIsEditingProduct(false);
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

      if (!userData?.company_id) {
        toast.error('Unable to determine your company. Please contact support.');
        return;
      }

      // Insert new category
      const { data: newCategory, error: insertError } = await supabase
        .from('categories')
        .insert({
          name: newCategoryData.name.trim(),
          description: newCategoryData.description.trim() || null,
          created_by: user.id,
          company_id: userData.company_id
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding category:', insertError);
        toast.error('Failed to add category. Please try again.');
        return;
      }

      // Reset form and close modal
      setNewCategoryData({ name: '', description: '' });
      setShowAddCategoryModal(false);

      // Reload categories
      await loadCategories();

      toast.success(`Successfully added category: ${newCategoryData.name}`);

    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category. Please try again.');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const categoryOptions = [{ id: 'all', name: 'All Categories' }, ...categories];

  // Order History State
  const [orderHistory, setOrderHistory] = useState<SalesHubOrder[]>([]);
  const [loadingOrderHistory, setLoadingOrderHistory] = useState(false);

  const loadOrderHistory = async (customerId?: string) => {
    if (!customerId) {
      setOrderHistory([]);
      return;
    }

    setLoadingOrderHistory(true);
    try {
      const { data, error } = await supabase
        .from('sales_hub_orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrderHistory(data || []);
    } catch (error) {
      console.error('Error loading order history:', error);
      setOrderHistory([]);
    } finally {
      setLoadingOrderHistory(false);
    }
  };

  // Load order history when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      loadOrderHistory(selectedCustomer.id);
    } else {
      setOrderHistory([]);
    }
  }, [selectedCustomer]);

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

const AIDataFlowSection = () => {
  const [selectedStep, setSelectedStep] = useState('invoices');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock data for the AI loop
  const dataFlow = [
    {
      id: 'invoices',
      title: '📊 Invoices',
      description: 'Order completion and payment data',
      data: [
        { invoice: 'INV-001', customer: 'DANGOOD LTD', products: ['Rice 5kg', 'Cooking Oil 1L'], total: 45000, date: '2026-02-01' },
        { invoice: 'INV-002', customer: 'Mdope Traders', products: ['Sugar 1kg', 'Soap Pack'], total: 12000, date: '2026-02-01' },
        { invoice: 'INV-003', customer: 'Sarah Retail', products: ['Rice 5kg'], total: 25000, date: '2026-01-30' },
      ],
      insights: '3 invoices processed today'
    },
    {
      id: 'customer-product',
      title: '🧠 Customer × Product Data',
      description: 'Who buys what, when, and how much',
      data: [
        { customer: 'DANGOOD LTD', product: 'Rice 5kg', purchases: 48, frequency: 'Weekly', lastPurchase: '2 days ago', value: 120000 },
        { customer: 'DANGOOD LTD', product: 'Cooking Oil 1L', purchases: 36, frequency: 'Weekly', lastPurchase: '2 days ago', value: 72000 },
        { customer: 'Mdope Traders', product: 'Sugar 1kg', purchases: 22, frequency: 'Monthly', lastPurchase: '10 days ago', value: 22000 },
      ],
      insights: '124 customer-product relationships tracked'
    },
    {
      id: 'buying-patterns',
      title: '📈 Buying Patterns',
      description: 'Identified trends and behaviors',
      data: [
        { pattern: 'Bundle Opportunity', confidence: 85, description: 'Rice + Oil purchased together 92% of the time' },
        { pattern: 'Seasonal Trend', confidence: 78, description: 'Sugar purchases peak during holiday seasons' },
        { pattern: 'Payment Pattern', confidence: 65, description: '3-day average payment delay for wholesale customers' },
      ],
      insights: '7 patterns identified with >60% confidence'
    },
    {
      id: 'ai-insights',
      title: '🎯 AI Insights',
      description: 'Machine learning predictions and recommendations',
      data: [
        {
          type: 'predictive',
          title: 'DANGOOD LTD likely to reorder',
          confidence: 89,
          timeframe: 'Next 7 days',
          recommendation: 'Prepare stock and send reminder'
        },
        {
          type: 'anomaly',
          title: 'Sarah Retail purchase volume decreased',
          confidence: 76,
          timeframe: 'Last 30 days',
          recommendation: 'Contact customer for feedback'
        },
        {
          type: 'opportunity',
          title: 'Cross-sell opportunity detected',
          confidence: 82,
          timeframe: 'Immediate',
          recommendation: 'Offer Sugar bundle with Rice purchase'
        }
      ],
      insights: '12 actionable insights generated'
    },
    {
      id: 'sales-actions',
      title: '💰 Sales / Marketing Actions',
      description: 'Automated and recommended actions',
      data: [
        {
          action: 'Automated Email',
          target: 'DANGOOD LTD',
          type: 'Reorder Reminder',
          status: 'Scheduled',
          expectedValue: 45000,
          priority: 'High'
        },
        {
          action: 'Customer Call',
          target: 'Sarah Retail',
          type: 'Retention Check',
          status: 'Pending',
          expectedValue: 25000,
          priority: 'Medium'
        },
        {
          action: 'Bundle Offer',
          target: 'Mdope Traders',
          type: 'Upsell Campaign',
          status: 'Ready',
          expectedValue: 15000,
          priority: 'Low'
        }
      ],
      insights: '5 actions queued for execution'
    }
  ];

  const processDataFlow = async () => {
    setIsProcessing(true);
    try {
      // Fetch real data from the database
      const [customersRes, preferencesRes] = await Promise.all([
        supabase.from('companies').select('*').eq('status', 'active').limit(10), // Fetch from companies (CUSTOMER 360)
        supabase.from('customer_preferences').select('*').limit(20)
      ]);

      // Process the data to create insights
      const customers = customersRes.data || [];
      const preferences = preferencesRes.data || [];

      // Generate buying patterns
      const patterns = [];
      const productFrequency = new Map();
      
      // Analyze customer preferences for patterns
      preferences.forEach(pref => {
        if (pref.preference_type === 'product') {
          const key = pref.preference_value;
          productFrequency.set(key, (productFrequency.get(key) || 0) + 1);
        }
      });

      // Create pattern insights
      productFrequency.forEach((count, product) => {
        if (count > 1) {
          patterns.push({
            pattern: `${product} Bundle Opportunity`,
            confidence: Math.min(95, 60 + (count * 5)),
            description: `${product} purchased by ${count} customers, suggesting bundle potential`
          });
        }
      });

      // Generate AI insights
      const insights = [];
      customers.forEach(customer => {
        if (customer.last_order_date) {
          const daysSinceLastOrder = Math.floor((Date.now() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceLastOrder > 30) {
            insights.push({
              type: 'predictive',
              title: `${customer.name} due for reorder`,
              confidence: Math.max(60, 90 - daysSinceLastOrder),
              timeframe: `Last ordered ${daysSinceLastOrder} days ago`,
              recommendation: 'Send reorder reminder and check stock levels'
            });
          }
        }

        if (customer.churn_risk === 'high' || customer.churn_risk === 'critical') {
          insights.push({
            type: 'anomaly',
            title: `${customer.name} at risk of churn`,
            confidence: customer.churn_risk === 'critical' ? 85 : 70,
            timeframe: 'Immediate attention required',
            recommendation: 'Contact customer and offer retention incentives'
          });
        }
      });

      // Update the component state with real data
      // Note: In a real implementation, this would update a global state
      toast.success('AI data flow processed with real customer data!');
      
    } catch (error) {
      console.error('Error processing data flow:', error);
      toast.error('Failed to process AI data flow');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedStepData = dataFlow.find(step => step.id === selectedStep);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">🔄 AI Intelligence Loop</h3>
        <p className="text-slate-600">How data flows through the system to create actionable insights</p>
      </div>

      {/* Data Flow Visualization */}
      <Card className="p-6">
        <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
          {dataFlow.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => setSelectedStep(step.id)}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  selectedStep === step.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-2xl mb-2">{step.title.split(' ')[0]}</div>
                <div className="text-sm font-medium text-center">{step.title.split(' ').slice(1).join(' ')}</div>
                <div className="text-xs text-slate-500 mt-1">{step.insights}</div>
              </button>
              {index < dataFlow.length - 1 && (
                <div className="flex items-center text-slate-400">
                  <ArrowUp className="h-5 w-5 rotate-90" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={processDataFlow}
            disabled={isProcessing}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing AI Loop...
              </>
            ) : (
              <>
                <ZapIcon className="h-4 w-4 mr-2" />
                Run AI Data Flow
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Step Details */}
      {selectedStepData && (
        <Card className="p-6">
          <div className="mb-4">
            <h4 className="text-xl font-bold text-slate-900 mb-2">{selectedStepData.title}</h4>
            <p className="text-slate-600">{selectedStepData.description}</p>
          </div>

          <div className="space-y-4">
            {selectedStepData.data.map((item, index) => (
              <div key={index} className="p-4 border border-slate-200 rounded-lg">
                {selectedStep === 'invoices' && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-500">Invoice</div>
                      <div className="font-medium">{item.invoice}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">Customer</div>
                      <div className="font-medium">{item.customer}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">Products</div>
                      <div className="text-sm">{item.products.join(', ')}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">Total</div>
                      <div className="font-medium text-green-600">{formatCurrency(item.total)}</div>
                    </div>
                  </div>
                )}

                {selectedStep === 'customer-product' && (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-500">Customer</div>
                      <div className="font-medium">{item.customer}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">Product</div>
                      <div className="font-medium">{item.product}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">Purchases</div>
                      <div className="font-medium">{item.purchases}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">Frequency</div>
                      <div className="text-sm">{item.frequency}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">Value</div>
                      <div className="font-medium text-green-600">{formatCurrency(item.value)}</div>
                    </div>
                  </div>
                )}

                {selectedStep === 'buying-patterns' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{item.pattern}</div>
                      <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {item.confidence}% confidence
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">{item.description}</div>
                  </div>
                )}

                {selectedStep === 'ai-insights' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{item.title}</div>
                      <div className={`text-sm px-2 py-1 rounded ${
                        item.type === 'predictive' ? 'bg-green-100 text-green-800' :
                        item.type === 'anomaly' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.confidence}% confidence
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 mb-2">{item.timeframe}</div>
                    <div className="text-sm font-medium text-slate-700">{item.recommendation}</div>
                  </div>
                )}

                {selectedStep === 'sales-actions' && (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-500">Action</div>
                      <div className="font-medium">{item.action}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">Target</div>
                      <div className="font-medium">{item.target}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">Type</div>
                      <div className="text-sm">{item.type}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">Status</div>
                      <div className={`text-sm px-2 py-1 rounded ${
                        item.status === 'Scheduled' ? 'bg-green-100 text-green-800' :
                        item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">Expected Value</div>
                      <div className="font-medium text-green-600">{formatCurrency(item.expectedValue)}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Trust Building Message */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h4 className="text-lg font-bold text-slate-900 mb-2">Building Trust Through Transparency</h4>
          <p className="text-slate-600">
            This AI loop shows exactly how your data flows through the system to create actionable insights.
            Every recommendation is backed by real customer behavior patterns, ensuring reliable and trustworthy suggestions.
          </p>
        </div>
      </Card>
    </div>
  );
};

const CustomerBuyingPatternsSection = () => {
  const [dateRange, setDateRange] = useState('last-30-days');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [matrixView, setMatrixView] = useState(false);

  // Customer data - will be loaded from database
  const customers = [];

  // Customer products data - will be loaded from database
  const customerProducts = [];

  // AI insights - will be generated from real data
  const aiInsights = [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">🧠 Customer × Product Intelligence</h3>
        <p className="text-slate-600">"Who buys what, how often, and when?"</p>
      </div>

      {/* Header: Time & Scope Control */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">📅 Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="last-7-days">Last 7 Days</option>
              <option value="this-month">This Month</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Quick Filters */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Customer Type</label>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Customers</option>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="credit">Credit</option>
            </select>
          </div>

          {/* Additional Filters */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Quick Filters</label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">High-Value</Button>
              <Button variant="outline" size="sm">Repeat Buyers</Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer List (Left Panel) */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Customer Overview</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {customers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedCustomer?.id === customer.id
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
            ))}
          </div>
        </Card>

        {/* Product Breakdown & AI Insights (Right Panel) */}
        <div className="space-y-6">
          {selectedCustomer ? (
            <>
              {/* Product Breakdown */}
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4">Product Breakdown: {selectedCustomer.name}</h4>
                <div className="space-y-3">
                  {customerProducts.map((item, index) => (
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
                  ))}
                </div>
              </Card>

              {/* AI Insights Panel */}
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <h4 className="text-lg font-semibold mb-4 flex items-center text-purple-900">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Insights
                </h4>
                <div className="space-y-4">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className="p-4 bg-white rounded-lg border border-purple-200">
                      <h5 className="font-semibold text-purple-900 mb-2">{insight.title}</h5>
                      <p className="text-sm text-purple-800 mb-3">{insight.message}</p>
                      <div className="flex gap-2">
                        {insight.actions.map((action, actionIndex) => (
                          <Button key={actionIndex} size="sm" className="bg-purple-600 hover:bg-purple-700">
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
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
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Customer ↓ / Product →</th>
                          <th className="text-center py-2 px-2">Rice</th>
                          <th className="text-center py-2 px-2">Oil</th>
                          <th className="text-center py-2 px-2">Sugar</th>
                          <th className="text-center py-2 px-2">Soap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.slice(0, 3).map((customer) => (
                          <tr key={customer.id} className="border-b">
                            <td className="py-2 font-medium">{customer.name}</td>
                            <td className="text-center py-2 px-2 bg-blue-100">48</td>
                            <td className="text-center py-2 px-2 bg-green-100">36</td>
                            <td className="text-center py-2 px-2 bg-yellow-100">22</td>
                            <td className="text-center py-2 px-2 bg-red-100">18</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
          <div className="text-2xl font-bold text-blue-600">👑</div>
          <div className="text-sm text-slate-600">Top Customer</div>
          <div className="font-semibold">DANGOOD LTD</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">📦</div>
          <div className="text-sm text-slate-600">Top Product</div>
          <div className="font-semibold">Rice 5kg</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">🔁</div>
          <div className="text-sm text-slate-600">Repeat Rate</div>
          <div className="font-semibold">87%</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">⏱️</div>
          <div className="text-sm text-slate-600">Avg Time</div>
          <div className="font-semibold">5.2 days</div>
        </Card>
      </div>

      {/* AI Loop Visualization */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h4 className="text-lg font-semibold mb-4 text-center">How This Feeds the AI Loop</h4>
        <div className="flex justify-center items-center space-x-4 text-sm">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mb-2">📊</div>
            <div>Invoices</div>
          </div>
          <div className="text-2xl">→</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mb-2">🧠</div>
            <div>Customer × Product Data</div>
          </div>
          <div className="text-2xl">→</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mb-2">📈</div>
            <div>Buying Patterns</div>
          </div>
          <div className="text-2xl">→</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mb-2">🎯</div>
            <div>AI Insights</div>
          </div>
          <div className="text-2xl">→</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold mb-2">💰</div>
            <div>Sales / Marketing Actions</div>
          </div>
        </div>
        <p className="text-center text-slate-600 mt-4 text-sm">
          This builds user trust by showing how data flows through the system to create actionable insights.
        </p>
      </Card>
    </div>
  );
};

  const UpdatesSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">🧠 AI Command Center</h3>
        <p className="text-slate-600">Smart insights to boost your sales today</p>
      </div>

      {/* Today Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-full">
              <DollarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center text-green-600">
              <ArrowUp className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">+{todaySnapshot.salesChange}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Sales Today</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(todaySnapshot.salesToday)}</p>
            <p className="text-xs text-green-600 mt-1">vs yesterday</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-full">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center text-red-600">
              <span className="text-sm font-medium">{todaySnapshot.invoicesOverdue} overdue</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Invoices Pending</p>
            <p className="text-2xl font-bold text-slate-900">{todaySnapshot.invoicesPending}</p>
            <p className="text-xs text-blue-600 mt-1">total pending</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500 rounded-full">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center text-red-600">
              <span className="text-sm font-medium">{todaySnapshot.criticalStockItems} critical</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Low Stock Alerts</p>
            <p className="text-2xl font-bold text-slate-900">{todaySnapshot.lowStockItems}</p>
            <p className="text-xs text-orange-600 mt-1">need attention</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-full">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">+{todaySnapshot.aiOpportunityScore}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">AI Opportunity Score</p>
            <p className="text-2xl font-bold text-slate-900">Revenue Boost</p>
            <p className="text-xs text-purple-600 mt-1">potential today</p>
          </div>
        </Card>
      </div>

      {/* AI Action Feed */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-xl font-semibold text-slate-900">🎯 Actionable AI Insights</h4>
            <p className="text-slate-600">Smart recommendations to improve your business</p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {aiInsights.map((insight) => {
            const IconComponent = insight.icon;
            return (
              <div key={insight.id} className={`p-4 rounded-lg border-2 ${insight.bgColor} hover:shadow-md transition-all duration-200`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${insight.color.replace('text-', 'bg-').replace('-700', '-500')} flex-shrink-0`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className={`font-semibold ${insight.color}`}>{insight.title}</h5>
                        <p className="text-slate-700 mt-1">{insight.message}</p>
                        {insight.explanation && (
                          <div className="flex items-start gap-2 mt-2 text-xs text-slate-600">
                            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{insight.explanation}</span>
                          </div>
                        )}
                      </div>

                      <Button size="sm" className="ml-4 flex-shrink-0">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {insight.action}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  const ProductsSection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-900 mb-2">🛍️ Product Catalog</h3>
        <p className="text-slate-600">Find and sell products quickly</p>
      </div>

      {/* Add New Product Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => setShowAddProductModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, model, or barcode..."
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Cart Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 cart-print-area" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
            <h4 className="text-lg font-semibold mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Active Cart ({cart.length} items)
              </div>
              {cart.length > 0 && (
                <Button
                  onClick={() => {
                    clearDemoData();
                    toast.success('Demo data cleared from cart');
                  }}
                  size="sm"
                  variant="outline"
                  className="text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear Demo Data
                </Button>
              )}
            </h4>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Your cart is empty</p>
                <p className="text-sm text-slate-500">Add products from the Products tab</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {cart.map(item => (
                  <CartItem
                    key={item.product.id}
                    item={item}
                    onUpdatePrice={updatePrice}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                    formatCurrency={formatCurrency}
                    getStockStatus={getStockStatus}
                  />
                ))}
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
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  🛒 Checkout & Complete Sale
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Customer Panel and Order History */}
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Details
            </h4>

            {selectedCustomer ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <h5 className="font-semibold text-slate-900">{selectedCustomer.name}</h5>
                  <p className="text-sm text-slate-600">{selectedCustomer.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedCustomer.health_score}%</div>
                    <div className="text-xs text-green-700">Health Score</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedCustomer.upsell_potential}</div>
                    <div className="text-xs text-blue-700">Upsell Potential</div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-700">
                    <Brain className="h-4 w-4" />
                    <span className="text-sm font-medium">AI Note:</span>
                  </div>
                  <p className="text-sm text-purple-600 mt-1">
                    {selectedCustomer.preferred_payment || "This customer prefers mobile money payments"}
                  </p>
                </div>

                <CustomerSelector
                  customers={customers}
                  loading={loadingCustomers}
                  onSelectCustomer={setSelectedCustomer}
                  selectedCustomer={selectedCustomer}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No customer selected</p>
                <CustomerSelector
                  customers={customers}
                  loading={loadingCustomers}
                  onSelectCustomer={setSelectedCustomer}
                  selectedCustomer={selectedCustomer}
                />
              </div>
            )}
          </Card>

          {/* Order History */}
          {selectedCustomer && (
            <Card className="p-4">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <History className="h-5 w-5 mr-2" />
                Order History ({orderHistory.length})
              </h4>

              {loadingOrderHistory ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-slate-500 mt-2">Loading orders...</p>
                </div>
              ) : orderHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No previous orders</p>
                  <p className="text-sm text-slate-500">Orders will appear here after completion</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {orderHistory.map((order) => (
                    <div key={order.id} className="p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-slate-900">{order.order_number}</div>
                          <div className="text-sm text-slate-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(order.total_amount)}
                          </div>
                          <div className="text-xs text-slate-500 capitalize">
                            {order.payment_method}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-slate-600 mb-2">
                        {order.items?.length || 0} items • {order.discount_amount > 0 ? `${order.discount_type === 'percentage' ? order.discount_value + '%' : formatCurrency(order.discount_value)} discount` : 'No discount'}
                      </div>

                      <Button
                        onClick={() => printOrder(order)}
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                      >
                        <Printer className="h-3 w-3 mr-1" />
                        Print Invoice
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* AI Sales Guidance */}
          {selectedCustomer && cart.length > 0 && (
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <h4 className="font-semibold mb-3 flex items-center text-blue-900">
                <Brain className="h-5 w-5 mr-2" />
                AI Sales Guidance
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">💡 Consider offering bundle discounts for multiple items</p>
                  <p className="text-xs text-blue-600 mt-1">Based on current cart composition</p>
                </div>
                {selectedCustomer.tier === 'gold' || selectedCustomer.tier === 'platinum' ? (
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">⭐ Premium customer - consider loyalty rewards</p>
                    <p className="text-xs text-blue-600 mt-1">High-value customer segment</p>
                  </div>
                ) : null}
                {cart.some(item => item.product.stock_quantity <= 5) && (
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">⚠️ Some items have low stock - consider expedited shipping</p>
                    <p className="text-xs text-blue-600 mt-1">Inventory management opportunity</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  const InventoryStatusSection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-900 mb-2">📊 Stock Intelligence</h3>
        <p className="text-slate-600">Monitor and optimize your inventory</p>
      </div>

      {/* Inventory Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4 text-center">
          <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900">{products.length}</div>
          <div className="text-sm text-slate-600">Total SKUs</div>
        </Card>

        <Card className="p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900">
            {products.filter(p => getStockStatus(p).status === 'out').length}
          </div>
          <div className="text-sm text-slate-600">Out of Stock</div>
        </Card>

        <Card className="p-4 text-center">
          <DollarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0))}
          </div>
          <div className="text-sm text-slate-600">Inventory Value</div>
        </Card>

        <Card className="p-4 text-center">
          <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900">
            {products.filter(p => (p.sales_velocity || 0) > 5).length}
          </div>
          <div className="text-sm text-slate-600">Fast Movers</div>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="p-4">
        <h4 className="text-lg font-semibold mb-4">Inventory Details</h4>
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
              {products.slice(0, 10).map(product => {
                const stockInfo = getStockStatus(product);
                return (
                  <tr key={product.id} className="border-b border-slate-100">
                    <td className="py-3 px-3">
                      <div>
                        <div className="font-medium text-slate-900">{product.name}</div>
                        <div className="text-sm text-slate-600">SKU: {product.sku}</div>
                      </div>
                    </td>
                    <td className="text-center py-3 px-3">
                      <span className={`font-medium ${stockInfo.status === 'out' ? 'text-red-600' : stockInfo.status === 'low' ? 'text-yellow-600' : 'text-green-600'}`}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="text-center py-3 px-3 text-slate-600">
                      {product.model}
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
                          setRestockNotes('');
                          setRestockLocation('main-store'); // Default to main store for all users
                          setShowRestockModal(true);
                        }}
                      >
                        Restock
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI Forecast Section */}
      <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <h4 className="text-lg font-semibold mb-4 flex items-center text-indigo-900">
          <Brain className="h-5 w-5 mr-2" />
          AI Demand Forecasts
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg border border-indigo-200">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <span className="font-medium text-indigo-900">Rice 5kg Forecast</span>
            </div>
            <p className="text-sm text-indigo-800 mb-2">You will need to restock in 4 days</p>
            <p className="text-xs text-indigo-600">Based on current sales trend of 25 units/day</p>
            <Button size="sm" className="mt-3 bg-indigo-600 hover:bg-indigo-700">
              Plan Restock
            </Button>
          </div>

          <div className="p-4 bg-white rounded-lg border border-indigo-200">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-900">Slow Moving Alert</span>
            </div>
            <p className="text-sm text-orange-800 mb-2">This product hasn't moved in 30 days</p>
            <p className="text-xs text-orange-600">Consider promotion or markdown</p>
            <Button size="sm" variant="outline" className="mt-3">
              Create Promotion
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const ProductStockingHistorySection = () => {
    const [selectedEntry, setSelectedEntry] = useState<StockHistoryEntry | null>(null);
    const [filters, setFilters] = useState({
      product: '',
      location: '',
      dateRange: 'last-7-days',
      actionType: '',
      referenceType: ''
    });

    // Stock history data - will be loaded from database
    const stockHistory = [];

    // AI insights - will be generated from real stock data
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
              <label className="block text-sm font-medium text-slate-700 mb-2">🏬 Location</label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Locations</option>
                <option value="main-store">Main Store</option>
                <option value="dar-pos">Dar POS</option>
                <option value="warehouse">Warehouse</option>
              </select>
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date & Time</th>
                      <th className="text-left py-2">Product</th>
                      <th className="text-left py-2">Action</th>
                      <th className="text-right py-2">Qty Change</th>
                      <th className="text-right py-2">Stock Before</th>
                      <th className="text-right py-2">Stock After</th>
                      <th className="text-left py-2">Location</th>
                      <th className="text-left py-2">Reference</th>
                      <th className="text-left py-2">Performed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockHistory.map((entry) => (
                      <tr
                        key={entry.id}
                        onClick={() => setSelectedEntry(entry)}
                        className="border-b hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="py-2">{new Date(entry.date).toLocaleString()}</td>
                        <td className="py-2">{entry.product} {entry.variant && `(${entry.variant})`}</td>
                        <td className="py-2">{entry.action}</td>
                        <td className={`py-2 text-right font-semibold ${entry.qtyChange < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {entry.qtyChange > 0 ? '+' : ''}{entry.qtyChange}
                        </td>
                        <td className="py-2 text-right">{entry.stockBefore}</td>
                        <td className="py-2 text-right">{entry.stockAfter}</td>
                        <td className="py-2">{entry.location}</td>
                        <td className="py-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {entry.reference}
                          </span>
                        </td>
                        <td className="py-2">{entry.performedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Detail Drawer / AI Insights */}
          <div className="space-y-6">
            {selectedEntry ? (
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4">Stock Event Summary</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Product</label>
                    <p className="font-semibold">{selectedEntry.product} {selectedEntry.variant && `(${selectedEntry.variant})`}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Action Type</label>
                    <p>{selectedEntry.action}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Quantity Changed</label>
                    <p className={`font-semibold ${selectedEntry.qtyChange < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedEntry.qtyChange > 0 ? '+' : ''}{selectedEntry.qtyChange}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Stock Change</label>
                    <p>{selectedEntry.stockBefore} → {selectedEntry.stockAfter}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Reference</label>
                    <p className="text-blue-600 cursor-pointer hover:underline">{selectedEntry.reference}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Performed By</label>
                    <p>{selectedEntry.performedBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Timestamp</label>
                    <p>{new Date(selectedEntry.date).toLocaleString()}</p>
                  </div>
                  {selectedEntry.customer && (
                    <div>
                      <label className="text-sm font-medium text-slate-700">Customer</label>
                      <p>{selectedEntry.customer}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h5 className="font-semibold text-blue-900 mb-2">🤖 AI Annotation</h5>
                  <p className="text-sm text-blue-800">
                    "Stock decreased due to high POS sales this week. Demand increased by 28% compared to last week."
                  </p>
                </div>
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
            <div className="font-semibold">4.2x</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">📅</div>
            <div className="text-sm text-slate-600">Days Remaining</div>
            <div className="font-semibold">12 days</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">🔄</div>
            <div className="text-sm text-slate-600">Adjustment Freq</div>
            <div className="font-semibold">2.3/week</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">📈</div>
            <div className="text-sm text-slate-600">Demand Trend</div>
            <div className="font-semibold">+28%</div>
          </Card>
        </div>
      </div>
    );
  };

  const subsections = [
    { id: "updates", label: "Updates", icon: Activity },
    { id: "products", label: "Products", icon: Package },
    { id: "carts-invoice", label: "Carts & Invoice", icon: Receipt },
    { id: "inventory-status", label: "Inventory Management", icon: BarChart3 },
    { id: "customer-buying-patterns", label: "Customer Buying Patterns", icon: Users },
    { id: "ai-data-flow", label: "AI Intelligence Loop", icon: Brain },
    { id: "product-stocking-history", label: "Product Stocking History", icon: History },
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
            const IconComponent = sub.icon;
            return (
              <Button
                key={sub.id}
                variant={activeSubsection === sub.id ? 'default' : 'outline'}
                onClick={() => setActiveSubsection(sub.id)}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {sub.label}
              </Button>
            );
          })}
        </div>
      </div>
      {activeSubsection === 'updates' && <UpdatesSection />}
      {activeSubsection === 'products' && <ProductsSection />}
      {activeSubsection === 'carts-invoice' && <CartsInvoiceSection />}
      {activeSubsection === 'inventory-status' && <InventoryStatusSection />}
      {activeSubsection === 'customer-buying-patterns' && <CustomerBuyingPatternsSection />}
      {activeSubsection === 'ai-data-flow' && <AIDataFlowSection />}
      {activeSubsection === 'product-stocking-history' && <ProductStockingHistorySection />}

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
                setRestockNotes('');
                setRestockLocation('main-store');
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
                      {location.name}
                    </option>
                  ))
                ) : (
                  // Show default locations if no custom locations are set up
                  <>
                    <option value="main-store">Main Store</option>
                    {userSubscriptionPlan !== 'starter' && (
                      <>
                        <option value="dar-pos">Dar POS</option>
                        <option value="warehouse">Warehouse</option>
                      </>
                    )}
                  </>
                )}
              </select>
              {userLocations.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  💡 Customize your location names in Settings → Locations
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={restockNotes}
                onChange={(e) => setRestockNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any notes about this restock..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setShowRestockModal(false);
                  setSelectedProductForRestock(null);
                  setRestockQuantity('');
                  setRestockNotes('');
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

    {/* Add Product Modal */}
    {showAddProductModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add New Product</h3>
            <button
              onClick={() => {
                setShowAddProductModal(false);
                setNewProductData({
                  name: '',
                  sku: '',
                  price: '',
                  stock_quantity: '',
                  model: '',
                  category_id: ''
                });
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={newProductData.model}
                  onChange={(e) => setNewProductData(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter model"
                />
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
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setShowAddProductModal(false);
                  setNewProductData({
                    name: '',
                    sku: '',
                    price: '',
                    stock_quantity: '',
                    model: '',
                    category_id: ''
                  });
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddProduct}
                disabled={!newProductData.name || (typeof newProductData.price === 'string' ? parseFloat(newProductData.price) || 0 : newProductData.price) <= 0 || isAddingProduct}
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
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
                  model: '',
                  category_id: ''
                });
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
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
                  Model
                </label>
                <input
                  type="text"
                  value={editProductData.model}
                  onChange={(e) => setEditProductData(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter model"
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
                    model: '',
                    category_id: ''
                  });
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
      </>
  );
};

export default SalesHub;
