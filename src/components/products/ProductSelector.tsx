import React, { useState, useEffect } from 'react';
import { X, Search, Package, Briefcase, Layers, Box } from 'lucide-react';
import { useProductStore } from '@/stores/productStore';
import type { Product } from '@/types/app.types';

interface ProductSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  organizationId?: string;
}

export default function ProductSelector({ isOpen, onClose, onSelect, organizationId }: ProductSelectorProps) {
  const { products, loading, fetchProducts } = useProductStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'product' | 'service' | 'bundle'>('all');

  useEffect(() => {
    if (isOpen) {
      fetchProducts(organizationId);
    }
  }, [isOpen, organizationId, fetchProducts]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.is_active &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       p.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || p.product_type === filterType;
    return matchesSearch && matchesType;
  });

  if (!isOpen) return null;

  const getProductIcon = (productType: string) => {
    switch (productType) {
      case 'service':
        return <Briefcase size={20} className="text-purple-600 dark:text-purple-400" />;
      case 'bundle':
        return <Layers size={20} className="text-pink-600 dark:text-pink-400" />;
      default:
        return <Box size={20} className="text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Package size={24} className="text-primary-600 dark:text-primary-400 mr-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Select Product or Service
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, services, SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Type Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('product')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                filterType === 'product'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Box size={16} />
              Products
            </button>
            <button
              onClick={() => setFilterType('service')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                filterType === 'service'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Briefcase size={16} />
              Services
            </button>
            <button
              onClick={() => setFilterType('bundle')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                filterType === 'bundle'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Layers size={16} />
              Bundles
            </button>
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {searchTerm ? 'No products found' : 'No products available'}
              </p>
              {searchTerm && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Try adjusting your search
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    onSelect(product);
                    onClose();
                    setSearchTerm('');
                  }}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left flex items-center justify-between group border border-transparent hover:border-primary-500 dark:hover:border-primary-400"
                >
                  <div className="flex items-start flex-1 min-w-0">
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:shadow-md transition-shadow">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        getProductIcon(product.product_type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                          {product.name}
                        </p>
                        {product.sku && (
                          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded flex-shrink-0">
                            {product.sku}
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-1">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          product.product_type === 'service'
                            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400'
                            : product.product_type === 'bundle'
                            ? 'bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-400'
                            : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                        }`}>
                          {product.product_type === 'service' ? 'Service' :
                           product.product_type === 'bundle' ? 'Bundle' : 'Product'}
                        </span>
                        {product.category && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                            {product.category}
                          </span>
                        )}
                        {product.track_inventory && product.quantity_on_hand !== null && (
                          <span className={`text-xs ${
                            product.low_stock_threshold !== null &&
                            product.quantity_on_hand <= product.low_stock_threshold
                              ? 'text-red-600 dark:text-red-400 font-medium'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            Stock: {product.quantity_on_hand}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      ${product.price.toFixed(2)}
                    </p>
                    {product.pricing_model === 'recurring' && product.recurring_interval && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        per {product.recurring_interval}
                      </p>
                    )}
                    {product.pricing_model === 'usage_based' && product.usage_unit && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        per {product.usage_unit}
                      </p>
                    )}
                    {product.is_taxable && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        +{product.tax_rate}% tax
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
