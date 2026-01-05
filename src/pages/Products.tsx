import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, Filter, Grid, List, Package,
  DollarSign, TrendingUp, Settings, MoreVertical,
  Trash2, Eye, Boxes
} from 'lucide-react';
import { useProductStore } from '../stores/productStore';
import { useOrganizationStore } from '../stores/organizationStore';
import { useThemeStore } from '../stores/themeStore';
import { PageContainer, Card } from '../components/theme/ThemeComponents';
import toast from 'react-hot-toast';
import type { ProductType } from '../types/app.types';

export default function Products() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | ProductType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { products, loading, fetchProducts, deleteProduct } = useProductStore();
  const { currentOrganization } = useOrganizationStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    fetchProducts(currentOrganization?.id);
  }, [currentOrganization?.id, fetchProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (filterType !== 'all') {
      filtered = filtered.filter((p) => p.product_type === filterType);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.sku?.toLowerCase().includes(search) ||
        p.category?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [products, filterType, searchTerm]);

  const stats = useMemo(() => {
    const totalProducts = products.filter((p) => p.product_type === 'product').length;
    const activeServices = products.filter((p) => p.product_type === 'service' && p.is_active).length;
    const avgPrice = products.length > 0
      ? products.reduce((sum, p) => sum + p.price, 0) / products.length
      : 0;
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.quantity_on_hand || 0)), 0);

    return { totalProducts, activeServices, avgPrice, totalValue };
  }, [products]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const ProductCard = ({ product }: { product: typeof products[0] }) => (
    <Card hover className="group overflow-hidden p-0">
      <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package size={48} className="text-blue-600 dark:text-blue-400" />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
          <Link
            to={`/products/${product.id}`}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:scale-110 transition-transform shadow-sm"
          >
            <Eye size={18} className="text-gray-900 dark:text-white" />
          </Link>
          <button
            onClick={() => handleDelete(product.id)}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-110 transition-all group shadow-sm"
          >
            <Trash2 size={18} className="text-gray-900 dark:text-white group-hover:text-red-600 transition-colors" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {product.description || 'No description'}
            </p>
          </div>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <MoreVertical size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex items-center space-x-2 mb-3">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${product.product_type === 'service'
            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400'
            : product.product_type === 'bundle'
              ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
              : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
            }`}>
            {product.product_type.charAt(0).toUpperCase() + product.product_type.slice(1)}
          </span>
          {product.category && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
              {product.category}
            </span>
          )}
          {product.sku && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full font-mono">
              {product.sku}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${product.price.toFixed(2)}
            </p>
            {product.pricing_model === 'recurring' && product.recurring_interval && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                per {product.recurring_interval}
              </p>
            )}
          </div>
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${product.is_active
            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
            : 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400'
            }`}>
            {product.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {product.track_inventory && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Stock:</span>
              <span className={`font-medium ${product.low_stock_threshold && product.quantity_on_hand <= product.low_stock_threshold
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-white'
                }`}>
                {product.quantity_on_hand} units
              </span>
            </div>
          </div>
        )}
      </div>
    </Card >
  );

  if (loading && products.length === 0) {
    return (
      <PageContainer className="items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="gap-6">
      <Card className="border-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Products & Services
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your product catalog and service offerings
            </p>
          </div>
          <Link
            to="/products/new"
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
          >
            <Plus size={20} className="mr-2" />
            Add Product
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className={theme === 'soft-modern' ? "card p-4" : "bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Products</span>
              <Package size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</p>
          </div>

          <div className={theme === 'soft-modern' ? "rounded-xl p-4 bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)]" : "bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Services</span>
              <Settings size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeServices}</p>
          </div>

          <div className={theme === 'soft-modern' ? "rounded-xl p-4 bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)]" : "bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Price</span>
              <DollarSign size={18} className="text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${stats.avgPrice.toFixed(0)}
            </p>
          </div>

          <div className={theme === 'soft-modern' ? "rounded-xl p-4 bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)]" : "bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
              <TrendingUp size={18} className="text-pink-600 dark:text-pink-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${stats.totalValue.toFixed(0)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, services, SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
            {(['all', 'product', 'service', 'bundle'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filterType === type
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <List size={18} />
            </button>
          </div>

          <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Filter size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </Card>

      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Boxes size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No products found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first product or service'}
            </p>
            {!searchTerm && filterType === 'all' && (
              <Link
                to="/products/new"
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Plus size={20} className="mr-2" />
                Add Your First Product
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden p-0">
            <table className="w-full">
              <thead className={theme === 'soft-modern' ? "bg-base border-b border-default" : "bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700"}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg flex items-center justify-center mr-3">
                          <Package size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          {product.sku && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{product.sku}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${product.product_type === 'service'
                        ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400'
                        : product.product_type === 'bundle'
                          ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
                          : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                        }`}>
                        {product.product_type.charAt(0).toUpperCase() + product.product_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {product.category || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${product.price.toFixed(2)}
                      </p>
                      {product.pricing_model === 'recurring' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          /{product.recurring_interval}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {product.track_inventory ? `${product.quantity_on_hand} units` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${product.is_active
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400'
                        }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors group"
                        >
                          <Trash2 size={16} className="text-gray-400 group-hover:text-red-600 transition-colors" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
