import { TrendingUp, Package, Plus, Search, AlertCircle, Pencil, Trash2, X, Loader2, ChevronDown, ChevronUp, UserCheck, Filter, Tag, Star, ShoppingBag } from 'lucide-react';
import React, { useState, useMemo, memo, useRef, useEffect } from 'react';
import { PageHeader } from './shared/PageHeader';
import { getThreatColor, formatName, formatNumberWithCommas, formatInputWithCommas, removeCommas } from '../lib/utils';
import { useCompetitorIntel, useMyProducts, useAfterSales } from '../lib/use-data';
import { SkeletonLoader } from './shared/SkeletonLoader';
import { DataModeBanner } from './DataModeBanner';
import { UserViewBanner } from './shared/UserViewBanner';
import { useAuth } from '../lib/auth-context';
import { CurrencyInput } from './shared/CurrencyInput';

export const CompetitorIntelEnhanced = memo(function CompetitorIntelEnhanced() {
  const { user, selectedUserId, isAdmin } = useAuth();
  const { records: myProducts, loading: loadingMyProducts, create: createMyProduct, update: updateMyProduct, remove: removeMyProduct } = useMyProducts();
  const { records: allCompetitors, loading: loadingCompetitors, create: createCompetitor, update: updateCompetitor, remove: removeCompetitor } = useCompetitorIntel();
  
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [showBrandsView, setShowBrandsView] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Modals
  const [showAddMyProductModal, setShowAddMyProductModal] = useState(false);
  const [showEditMyProductModal, setShowEditMyProductModal] = useState(false);
  const [showAddCompetitorModal, setShowAddCompetitorModal] = useState(false);
  const [showEditCompetitorModal, setShowEditCompetitorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingType, setDeletingType] = useState<'myproduct' | 'competitor'>('competitor');
  
  // Form states
  const [myProductForm, setMyProductForm] = useState({
    productName: '',
    category: '',
    description: '',
  });
  
  const [competitorForm, setCompetitorForm] = useState({
    productName: '',
    brand: '',
    price: '',
    marketShare: 0,
    strength: '',
    weakness: '',
    threatLevel: 'medium' as 'low' | 'medium' | 'high',
    linkedProductId: null as number | null,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products and competitors by selected user
  const competitorProducts = useMemo(() => {
    if (!selectedUserId && isAdmin) {
      return allCompetitors;
    }
    const targetUserId = selectedUserId || user?.userId;
    return allCompetitors.filter(c => (c as any)._userId === targetUserId);
  }, [allCompetitors, selectedUserId, user, isAdmin]);

  // Get selected product
  const selectedProduct = useMemo(() => {
    return myProducts.find(p => p.id === selectedProductId);
  }, [myProducts, selectedProductId]);

  // Filter competitors by selected product
  const filteredCompetitors = useMemo(() => {
    if (!selectedProductId) return competitorProducts;
    return competitorProducts.filter(c => c.linkedProductId === selectedProductId);
  }, [competitorProducts, selectedProductId]);

  // Get unique brands from filtered competitors
  const uniqueBrands = useMemo(() => {
    const brands = filteredCompetitors
      .map(c => c.brand)
      .filter(Boolean) as string[];
    return [...new Set(brands)];
  }, [filteredCompetitors]);

  // Get unique categories from all products (only if they have categories)
  const uniqueCategories = useMemo(() => {
    const categories = myProducts
      .map(p => p.category)
      .filter(Boolean) as string[];
    return [...new Set(categories)];
  }, [myProducts]);

  // Filter by brand if selected
  const displayedCompetitors = useMemo(() => {
    if (!selectedBrand) return filteredCompetitors;
    return filteredCompetitors.filter(c => c.brand === selectedBrand);
  }, [filteredCompetitors, selectedBrand]);

  // Search filtered products with category filter
  const searchedProducts = useMemo(() => {
    let filtered = myProducts;
    
    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // Filter by search query
    if (productSearchQuery.trim()) {
      const query = productSearchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.productName.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [myProducts, productSearchQuery, selectedCategory]);

  // Statistics
  const stats = useMemo(() => {
    const totalCompetitors = displayedCompetitors.length;
    const highThreat = displayedCompetitors.filter(c => c.threatLevel === 'high').length;
    const avgMarketShare = totalCompetitors > 0
      ? (displayedCompetitors.reduce((sum, c) => sum + (c.marketShare || 0), 0) / totalCompetitors).toFixed(1)
      : '0';
    
    return { totalCompetitors, highThreat, avgMarketShare };
  }, [displayedCompetitors]);

  const toggleCardExpanded = (id: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAddMyProduct = async () => {
    if (!myProductForm.productName.trim()) return;
    await createMyProduct(myProductForm);
    setMyProductForm({ productName: '', category: '', description: '' });
    setShowAddMyProductModal(false);
  };

  const handleUpdateMyProduct = async () => {
    if (!editingId || !myProductForm.productName.trim()) return;
    await updateMyProduct(editingId, myProductForm);
    setMyProductForm({ productName: '', category: '', description: '' });
    setEditingId(null);
    setShowEditMyProductModal(false);
  };

  const handleAddCompetitor = async () => {
    if (!competitorForm.productName.trim() || !competitorForm.linkedProductId) return;
    await createCompetitor(competitorForm);
    setCompetitorForm({
      productName: '',
      brand: '',
      price: '',
      marketShare: 0,
      strength: '',
      weakness: '',
      threatLevel: 'medium',
      linkedProductId: null,
    });
    setShowAddCompetitorModal(false);
  };

  const handleUpdateCompetitor = async () => {
    if (!editingId || !competitorForm.productName.trim()) return;
    await updateCompetitor(editingId, competitorForm);
    setCompetitorForm({
      productName: '',
      brand: '',
      price: '',
      marketShare: 0,
      strength: '',
      weakness: '',
      threatLevel: 'medium',
      linkedProductId: null,
    });
    setEditingId(null);
    setShowEditCompetitorModal(false);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    if (deletingType === 'myproduct') {
      await removeMyProduct(deletingId);
      if (deletingId === selectedProductId) {
        setSelectedProductId(null);
      }
    } else {
      await removeCompetitor(deletingId);
    }
    setDeletingId(null);
    setShowDeleteModal(false);
  };

  const loading = loadingMyProducts || loadingCompetitors;

  // Get gradient for selected product
  const getProductGradient = (threatLevel?: string) => {
    if (threatLevel === 'high') return 'from-red-500 to-rose-600';
    if (threatLevel === 'low') return 'from-green-500 to-teal-600';
    return 'from-blue-500 to-purple-600';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        title="Competitors Information"
        description="Track and analyze competitor products"
      />

      <DataModeBanner />
      <UserViewBanner />

      {/* Product Filter Button */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Product Filter Dropdown */}
          <div className="flex-1 min-w-[250px] relative" ref={dropdownRef}>
            <label className="block text-sm text-gray-700 mb-2 flex items-center gap-2">
              Select Product
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                {myProducts.length} {myProducts.length === 1 ? 'product' : 'products'}
              </span>
            </label>
            <button
              onClick={() => setShowProductDropdown(!showProductDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
            >
              <div className="flex items-center gap-3">
                <Package size={20} />
                <span className="">
                  {selectedProduct ? selectedProduct.productName : 'Choose a product...'}
                </span>
              </div>
              <ChevronDown size={20} className={`transition-transform ${showProductDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showProductDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                {/* Add Product Button - Moved to Top */}
                <div className="p-3 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                  <button
                    onClick={() => {
                      setShowAddMyProductModal(true);
                      setShowProductDropdown(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                  >
                    <Plus size={20} />
                    Add New Product
                  </button>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-gray-200 sticky top-[68px] bg-white z-10">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                {/* Category Filter - Only show if categories exist */}
                {uniqueCategories.length > 0 && (
                  <div className="p-3 border-b border-gray-200 sticky top-[126px] bg-white z-10">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                          !selectedCategory 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        All Categories
                      </button>
                      {uniqueCategories.map(category => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1 ${
                            selectedCategory === category 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Tag size={12} />
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product List */}
                {loading ? (
                  <div className="p-4">
                    <SkeletonLoader count={3} />
                  </div>
                ) : searchedProducts.length === 0 ? (
                  <div className="p-8 text-center">
                    <Package className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-gray-600 text-sm">
                      {productSearchQuery ? `No products found matching "${productSearchQuery}"` : 'No products available'}
                    </p>
                  </div>
                ) : (
                  searchedProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => {
                        setSelectedProductId(product.id!);
                        setShowProductDropdown(false);
                        setProductSearchQuery('');
                      }}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                        selectedProductId === product.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-gray-900">{product.productName}</p>
                            {!selectedUserId && (product as any)._userName && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                                <UserCheck size={12} />
                                {formatName((product as any)._userName)}
                              </span>
                            )}
                          </div>
                          {product.category && (
                            <p className="text-gray-500 text-sm mt-1">📁 {product.category}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(product.id!);
                              setMyProductForm({
                                productName: product.productName,
                                category: product.category || '',
                                description: product.description || '',
                              });
                              setShowEditMyProductModal(true);
                              setShowProductDropdown(false);
                            }}
                            className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                          >
                            <Pencil size={16} className="text-blue-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(product.id!);
                              setDeletingType('myproduct');
                              setShowDeleteModal(true);
                              setShowProductDropdown(false);
                            }}
                            className="p-1.5 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Product Details */}
      {selectedProduct && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-blue-500 overflow-hidden">
          {/* Gradient Header */}
          <div className={`h-32 bg-gradient-to-r ${getProductGradient()} p-6 flex items-center justify-between`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ShoppingBag className="text-white" size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-white text-2xl">{selectedProduct.productName}</h2>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                    <Star className="text-yellow-500 fill-yellow-500" size={18} />
                  </div>
                </div>
                {selectedProduct.category && (
                  <p className="text-white/90">📁 {selectedProduct.category}</p>
                )}
              </div>
            </div>
            {!selectedUserId && (selectedProduct as any)._userName && (
              <span className="px-3 py-1.5 rounded-full text-sm bg-white/20 backdrop-blur-sm text-white">
                👤 {formatName((selectedProduct as any)._userName)}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {selectedProduct.description && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-blue-600 text-sm mb-1">Description</p>
                <p className="text-gray-800">{selectedProduct.description}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditingId(selectedProduct.id!);
                  setMyProductForm({
                    productName: selectedProduct.productName,
                    category: selectedProduct.category || '',
                    description: selectedProduct.description || '',
                  });
                  setShowEditMyProductModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Pencil size={18} />
                <span>Edit Product</span>
              </button>
              <button
                onClick={() => {
                  setDeletingId(selectedProduct.id!);
                  setDeletingType('myproduct');
                  setShowDeleteModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 size={18} />
                <span>Delete Product</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Competitors Section */}
      {selectedProductId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                  <TrendingUp className="text-white" size={20} />
                </div>
                <h2 className="text-gray-900">Competitors for {selectedProduct?.productName}</h2>
              </div>
              <p className="text-gray-600 text-sm ml-13">Track competitive products and market positioning</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Brands Filter Button */}
              {uniqueBrands.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowBrandsView(!showBrandsView)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <Tag size={20} />
                    Brands ({uniqueBrands.length})
                    <ChevronDown size={16} className={`transition-transform ${showBrandsView ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Brands Dropdown */}
                  {showBrandsView && (
                    <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[200px]">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setSelectedBrand(null);
                            setShowBrandsView(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            !selectedBrand ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'
                          }`}
                        >
                          All Brands
                        </button>
                        {uniqueBrands.map(brand => (
                          <button
                            key={brand}
                            onClick={() => {
                              setSelectedBrand(brand);
                              setShowBrandsView(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              selectedBrand === brand ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                              {brand}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  setCompetitorForm({
                    productName: '',
                    brand: '',
                    price: '',
                    marketShare: 0,
                    strength: '',
                    weakness: '',
                    threatLevel: 'medium',
                    linkedProductId: selectedProductId,
                  });
                  setShowAddCompetitorModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                Add Competitor
              </button>
            </div>
          </div>

          {/* Selected Brand Indicator */}
          {selectedBrand && (
            <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
              <Tag className="text-purple-600" size={18} />
              <span className="text-purple-700">Filtering by brand: <strong>{selectedBrand}</strong></span>
              <button
                onClick={() => setSelectedBrand(null)}
                className="ml-auto text-purple-600 hover:text-purple-800"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <TrendingUp className="text-white" size={20} />
                </div>
                <p className="text-blue-600 text-sm">Total Competitors</p>
              </div>
              <p className="text-blue-900 text-2xl ml-13">{stats.totalCompetitors}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border border-red-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                  <AlertCircle className="text-white" size={20} />
                </div>
                <p className="text-red-600 text-sm">High Threat</p>
              </div>
              <p className="text-red-900 text-2xl ml-13">{stats.highThreat}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <Package className="text-white" size={20} />
                </div>
                <p className="text-green-600 text-sm">Avg Market Share</p>
              </div>
              <p className="text-green-900 text-2xl ml-13">{stats.avgMarketShare}%</p>
            </div>
          </div>

          {/* Competitors List */}
          {loading ? (
            <SkeletonLoader count={3} />
          ) : displayedCompetitors.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 mb-1">
                {selectedBrand ? `No competitors found for brand "${selectedBrand}"` : 'No competitors tracked yet'}
              </p>
              <p className="text-gray-500 text-sm">Click "Add Competitor" to start tracking</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedCompetitors.map(competitor => {
                const isExpanded = expandedCards.has(competitor.id!);
                const threatColor = getThreatColor(competitor.threatLevel || 'medium');
                
                return (
                  <div
                    key={competitor.id}
                    className="border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all bg-white"
                  >
                    {/* Header with gradient based on threat level */}
                    <div className={`p-4 ${
                      competitor.threatLevel === 'high' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                      competitor.threatLevel === 'low' ? 'bg-gradient-to-r from-green-500 to-teal-600' :
                      'bg-gradient-to-r from-yellow-500 to-orange-600'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-white mb-2">{competitor.productName}</h3>
                          <div className="flex flex-wrap gap-2">
                            {competitor.brand && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-white/90 backdrop-blur-sm text-gray-900">
                                <Tag size={12} />
                                <strong>{competitor.brand}</strong>
                              </span>
                            )}
                            <span className="px-3 py-1 rounded-full text-xs bg-white/20 backdrop-blur-sm text-white">
                              {competitor.threatLevel?.toUpperCase() || 'MEDIUM'} THREAT
                            </span>
                            {!selectedUserId && (competitor as any)._userName && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/20 backdrop-blur-sm text-white">
                                <UserCheck size={12} />
                                {formatName((competitor as any)._userName)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {competitor.price && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-blue-600 text-xs mb-1">Price</p>
                            <p className="text-blue-900">{formatNumberWithCommas(competitor.price)}</p>
                          </div>
                        )}
                        {competitor.marketShare !== undefined && (
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-green-600 text-xs mb-1">Market Share</p>
                            <p className="text-green-900">{competitor.marketShare}%</p>
                          </div>
                        )}
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="space-y-3 mb-4 pt-3 border-t border-gray-200">
                          {competitor.strength && (
                            <div className="bg-green-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center">
                                  <span className="text-white text-xs">💪</span>
                                </div>
                                <p className="text-green-600 text-sm">Strength</p>
                              </div>
                              <p className="text-gray-800 text-sm">{competitor.strength}</p>
                            </div>
                          )}
                          {competitor.weakness && (
                            <div className="bg-red-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center">
                                  <span className="text-white text-xs">⚠️</span>
                                </div>
                                <p className="text-red-600 text-sm">Weakness</p>
                              </div>
                              <p className="text-gray-800 text-sm">{competitor.weakness}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleCardExpanded(competitor.id!)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          <span className="text-sm">{isExpanded ? 'Less' : 'More'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(competitor.id!);
                            setCompetitorForm({
                              productName: competitor.productName,
                              brand: competitor.brand || '',
                              price: competitor.price || '',
                              marketShare: competitor.marketShare || 0,
                              strength: competitor.strength || '',
                              weakness: competitor.weakness || '',
                              threatLevel: competitor.threatLevel || 'medium',
                              linkedProductId: competitor.linkedProductId || null,
                            });
                            setShowEditCompetitorModal(true);
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(competitor.id!);
                            setDeletingType('competitor');
                            setShowDeleteModal(true);
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add My Product Modal */}
      {showAddMyProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Package className="text-white" size={20} />
                </div>
                <h3 className="text-gray-900">Add My Product</h3>
              </div>
              <button onClick={() => setShowAddMyProductModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={myProductForm.productName}
                  onChange={(e) => setMyProductForm({ ...myProductForm, productName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={myProductForm.category}
                  onChange={(e) => setMyProductForm({ ...myProductForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter category"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Description</label>
                <textarea
                  value={myProductForm.description}
                  onChange={(e) => setMyProductForm({ ...myProductForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddMyProductModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMyProduct}
                disabled={!myProductForm.productName.trim()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit My Product Modal */}
      {showEditMyProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Package className="text-white" size={20} />
                </div>
                <h3 className="text-gray-900">Edit My Product</h3>
              </div>
              <button onClick={() => setShowEditMyProductModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={myProductForm.productName}
                  onChange={(e) => setMyProductForm({ ...myProductForm, productName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={myProductForm.category}
                  onChange={(e) => setMyProductForm({ ...myProductForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter category"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Description</label>
                <textarea
                  value={myProductForm.description}
                  onChange={(e) => setMyProductForm({ ...myProductForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditMyProductModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMyProduct}
                disabled={!myProductForm.productName.trim()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Competitor Modal */}
      {showAddCompetitorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                  <TrendingUp className="text-white" size={20} />
                </div>
                <h3 className="text-gray-900">Add Competitor</h3>
              </div>
              <button onClick={() => setShowAddCompetitorModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={competitorForm.productName}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, productName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter competitor product name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Brand</label>
                <input
                  type="text"
                  value={competitorForm.brand}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, brand: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter brand name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Price</label>
                <input
                  type="text"
                  value={formatInputWithCommas(competitorForm.price)}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, price: removeCommas(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="e.g., 25,000"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Market Share (%)</label>
                <input
                  type="number"
                  value={competitorForm.marketShare}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, marketShare: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter market share"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Threat Level</label>
                <select
                  value={competitorForm.threatLevel}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, threatLevel: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Strength</label>
                <textarea
                  value={competitorForm.strength}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, strength: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter competitor strengths"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Weakness</label>
                <textarea
                  value={competitorForm.weakness}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, weakness: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter competitor weaknesses"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddCompetitorModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCompetitor}
                disabled={!competitorForm.productName.trim()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Competitor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Competitor Modal */}
      {showEditCompetitorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                  <TrendingUp className="text-white" size={20} />
                </div>
                <h3 className="text-gray-900">Edit Competitor</h3>
              </div>
              <button onClick={() => setShowEditCompetitorModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={competitorForm.productName}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, productName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter competitor product name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Brand</label>
                <input
                  type="text"
                  value={competitorForm.brand}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, brand: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter brand name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Price</label>
                <input
                  type="text"
                  value={formatInputWithCommas(competitorForm.price)}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, price: removeCommas(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="e.g., 25,000"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Market Share (%)</label>
                <input
                  type="number"
                  value={competitorForm.marketShare}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, marketShare: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter market share"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Threat Level</label>
                <select
                  value={competitorForm.threatLevel}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, threatLevel: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Strength</label>
                <textarea
                  value={competitorForm.strength}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, strength: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter competitor strengths"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Weakness</label>
                <textarea
                  value={competitorForm.weakness}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, weakness: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter competitor weaknesses"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditCompetitorModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCompetitor}
                disabled={!competitorForm.productName.trim()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Competitor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <h3 className="text-gray-900">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {deletingType === 'myproduct' ? 'product' : 'competitor'}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});