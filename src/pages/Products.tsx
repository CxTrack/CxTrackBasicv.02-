import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, Grid, List, Package,
  MoreVertical,
  Trash2, Eye, Boxes,
  Zap, ArrowRight,
  ShoppingCart, BarChart2, PackageOpen
} from 'lucide-react';
import { useProductStore } from '../stores/productStore';
import { useOrganizationStore } from '../stores/organizationStore';
import { useThemeStore } from '../stores/themeStore';
import { PageContainer, Card, IconBadge } from '../components/theme/ThemeComponents';
import { CompactStatsBar } from '../components/compact/CompactViews';
import { ResizableTable, ColumnDef } from '../components/compact/ResizableTable';
import toast from 'react-hot-toast';
import type { ProductType } from '../types/app.types';

export default function Products() {
  const [viewMode, setViewMode] = useState<'compact' | 'grid' | 'list'>('compact');
  const [filterType, setFilterType] = useState<'all' | ProductType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { products, loading, fetchProducts, deleteProduct } = useProductStore();
  const { currentOrganization, currentMembership } = useOrganizationStore();
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
    if (currentMembership?.role !== 'owner' && currentMembership?.role !== 'admin') {
      toast.error('You do not have permission to delete products');
      return;
    }
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
          {(currentMembership?.role === 'owner' || currentMembership?.role === 'admin') && (
            <button
              onClick={() => handleDelete(product.id)}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-110 transition-all group shadow-sm"
            >
              <Trash2 size={18} className="text-gray-900 dark:text-white group-hover:text-red-600 transition-colors" />
            </button>
          )}
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
          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-bold">
              <span>Inventory</span>
              <span className={product.quantity_on_hand <= (product.low_stock_threshold || 5) ? 'text-rose-500' : 'text-emerald-500'}>
                {product.quantity_on_hand} in stock
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${product.quantity_on_hand <= (product.low_stock_threshold || 5)
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
                  }`}
                style={{ width: `${Math.min((product.quantity_on_hand / 50) * 100, 100)}%` }}
              />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Product Catalog
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your inventory, services, and digital assets
          </p>
        </div>
        <Link
          to="/products/new"
          className="flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold shadow-lg shadow-blue-500/20 active:scale-95 text-sm"
        >
          <Plus size={18} className="mr-2" />
          <span className="whitespace-nowrap">Add Product</span>
        </Link>
      </div>

      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="flex items-center gap-4 p-4 group h-24">
          <IconBadge
            icon={<ShoppingCart size={20} className="text-blue-600" />}
            gradient="bg-blue-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Items</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalProducts + stats.activeServices}</h3>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </Card>

        <Card hover className="flex items-center gap-4 p-4 group h-24">
          <IconBadge
            icon={<Zap size={20} className="text-emerald-600" />}
            gradient="bg-emerald-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Services</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeServices}</h3>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </Card>

        <Card hover className="flex items-center gap-4 p-4 group h-24">
          <IconBadge
            icon={<BarChart2 size={20} className="text-orange-600" />}
            gradient="bg-orange-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Avg Price</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${stats.avgPrice.toFixed(0)}</h3>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </Card>

        <Card hover className="flex items-center gap-4 p-4 group h-24">
          <IconBadge
            icon={<PackageOpen size={20} className="text-purple-600" />}
            gradient="bg-purple-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Value</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${(stats.totalValue / 1000).toFixed(1)}k</h3>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700">
        <div className="flex bg-slate-100 dark:bg-gray-700 p-1 rounded-lg">
          {(['all', 'product', 'service', 'bundle'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${filterType === type
                ? 'bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {type}s
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 md:max-w-xl md:ml-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-gray-700 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex p-1 bg-slate-100 dark:bg-gray-700 rounded-lg h-[36px]">
            <button
              onClick={() => setViewMode('compact')}
              className={`px-2 rounded-md transition-all ${viewMode === 'compact' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Compact View"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Card View"
            >
              <Grid size={18} />
            </button>
          </div>
        </div>
      </div>

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
        ) : viewMode === 'compact' ? (
          <>
            {/* Compact Stats */}
            <CompactStatsBar stats={[
              { label: 'Total', value: filteredProducts.length },
              { label: 'Active', value: filteredProducts.filter(p => p.is_active).length },
              { label: 'Avg Price', value: `$${stats.avgPrice.toFixed(0)}` },
              { label: 'Value', value: `$${(stats.totalValue / 1000).toFixed(1)}k` },
            ]} />

            {/* Resizable Table */}
            <ResizableTable
              storageKey="products"
              data={filteredProducts}
              onRowClick={(product) => window.location.href = `/products/${product.id}`}
              columns={[
                {
                  id: 'product',
                  header: 'Product',
                  defaultWidth: 250,
                  minWidth: 150,
                  render: (product) => (
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {product.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/products/${product.id}`}
                          className="font-medium text-gray-900 dark:text-white text-sm truncate block hover:text-blue-600 dark:hover:text-blue-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {product.name}
                        </Link>
                        {product.sku && (
                          <span className="text-[11px] text-gray-400 font-mono truncate block">{product.sku}</span>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'type',
                  header: 'Type',
                  defaultWidth: 90,
                  minWidth: 70,
                  render: (product) => (
                    <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${product.product_type === 'service' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      product.product_type === 'bundle' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                      {product.product_type}
                    </span>
                  ),
                },
                {
                  id: 'category',
                  header: 'Category',
                  defaultWidth: 120,
                  minWidth: 80,
                  render: (product) => (
                    <span className="text-gray-600 dark:text-gray-400 text-sm truncate block">{product.category || '—'}</span>
                  ),
                },
                {
                  id: 'price',
                  header: 'Price',
                  defaultWidth: 80,
                  minWidth: 60,
                  align: 'right',
                  render: (product) => (
                    <span className="font-semibold text-gray-900 dark:text-white">${product.price.toFixed(0)}</span>
                  ),
                },
                {
                  id: 'stock',
                  header: 'Stock',
                  defaultWidth: 60,
                  minWidth: 50,
                  align: 'center',
                  render: (product) => (
                    product.track_inventory ? (
                      <span className={`text-sm font-medium ${(product.quantity_on_hand || 0) > 20 ? 'text-green-600' :
                        (product.quantity_on_hand || 0) > 5 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {product.quantity_on_hand || 0}
                      </span>
                    ) : <span className="text-gray-400">—</span>
                  ),
                },
                {
                  id: 'status',
                  header: 'Status',
                  defaultWidth: 80,
                  minWidth: 60,
                  render: (product) => (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${product.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                      {product.is_active ? 'Active' : 'Off'}
                    </span>
                  ),
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  defaultWidth: 100,
                  minWidth: 80,
                  align: 'right',
                  render: (product) => (
                    <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/products/${product.id}`} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-60 hover:opacity-100">
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                      </Link>
                      {(currentMembership?.role === 'owner' || currentMembership?.role === 'admin') && (
                        <button onClick={() => handleDelete(product.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded opacity-60 hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                        </button>
                      )}
                    </div>
                  ),
                },
              ] as ColumnDef[]}
            />
          </>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <Card className="hidden md:block overflow-hidden p-0 min-h-[500px]">
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

            {/* Mobile Card View (List Mode) */}
            <div className="md:hidden space-y-4 pb-20">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mr-3">
                        <Package size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{product.name}</h3>
                        <p className="text-[10px] text-gray-500 font-mono">{product.sku || 'NO-SKU'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-b border-gray-50 dark:border-gray-700 mb-3">
                    <div className="text-center flex-1 border-r border-gray-50 dark:border-gray-700">
                      <p className="text-[10px] text-gray-500 uppercase">Price</p>
                      <p className="font-bold text-gray-900 dark:text-white">${product.price.toFixed(2)}</p>
                    </div>
                    <div className="text-center flex-1 border-r border-gray-50 dark:border-gray-700">
                      <p className="text-[10px] text-gray-500 uppercase">Type</p>
                      <p className="font-bold text-gray-900 dark:text-white text-xs capitalize">{product.product_type}</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-[10px] text-gray-500 uppercase">Stock</p>
                      <p className="font-bold text-gray-900 dark:text-white">{product.track_inventory ? product.quantity_on_hand : '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/products/${product.id}`}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-center text-xs font-bold"
                    >
                      View Details
                    </Link>
                    {(currentMembership?.role === 'owner' || currentMembership?.role === 'admin') && (
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
