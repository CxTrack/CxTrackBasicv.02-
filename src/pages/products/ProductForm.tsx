import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Save, Package, DollarSign, Tag,
  Upload, X, AlertCircle
} from 'lucide-react';
import { useProductStore } from '@/stores/productStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import toast from 'react-hot-toast';
import type { ProductType, PricingModel, RecurringInterval } from '@/types/app.types';
import CreationSuccessModal from '@/components/shared/CreationSuccessModal';
import { Plus } from 'lucide-react';

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { createProduct, updateProduct, getProductById } = useProductStore();
  const { currentOrganization } = useOrganizationStore();

  const isEdit = Boolean(id);
  const isDuplicate = Boolean(location.state?.duplicate);

  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    product_type: 'product' as ProductType,
    category: '',
    price: 0,
    cost: 0,
    pricing_model: 'one_time' as PricingModel,
    recurring_interval: 'monthly' as RecurringInterval | undefined,
    recurring_interval_count: 1,
    usage_unit: '',
    tax_rate: 0,
    is_taxable: true,
    track_inventory: false,
    quantity_on_hand: 0,
    low_stock_threshold: 10,
    reorder_quantity: 50,
    weight: undefined as number | undefined,
    dimensions: '',
    estimated_duration: undefined as number | undefined,
    duration_unit: 'hours',
    deliverables: '',
    discount_type: 'fixed',
    image_url: '',
    is_active: true,
    is_featured: false,
    requires_approval: false,
  });

  useEffect(() => {
    if (isEdit && id) {
      const product = getProductById(id);
      if (product) {
        setFormData({
          name: product.name,
          description: product.description || '',
          sku: product.sku || '',
          product_type: product.product_type,
          category: product.category || '',
          price: product.price,
          cost: product.cost || 0,
          pricing_model: product.pricing_model,
          recurring_interval: product.recurring_interval,
          recurring_interval_count: product.recurring_interval_count || 1,
          usage_unit: product.usage_unit || '',
          tax_rate: product.tax_rate,
          is_taxable: product.is_taxable,
          track_inventory: product.track_inventory,
          quantity_on_hand: product.quantity_on_hand,
          low_stock_threshold: product.low_stock_threshold || 10,
          reorder_quantity: 50,
          weight: product.weight,
          dimensions: product.dimensions || '',
          estimated_duration: product.estimated_duration,
          duration_unit: product.duration_unit || 'hours',
          deliverables: product.deliverables || '',
          discount_type: product.discount_type || 'fixed',
          image_url: product.image_url || '',
          is_active: product.is_active,
          is_featured: false,
          requires_approval: product.requires_approval,
        });
      }
    } else if (isDuplicate && location.state?.duplicate) {
      const duplicate = location.state.duplicate;
      setFormData({
        ...duplicate,
        name: `${duplicate.name} (Copy)`,
        sku: '',
      });
    }
  }, [id, isEdit, isDuplicate, getProductById, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (formData.price < 0) {
      toast.error('Price cannot be negative');
      return;
    }

    setSaving(true);

    try {
      const productData = {
        ...formData,
        organization_id: currentOrganization?.id || '',
      };

      if (isEdit && id) {
        await updateProduct(id, productData);
        toast.success('Product updated successfully');
        navigate('/products');
      } else {
        const newProduct = await createProduct(productData);
        if (newProduct) {
          setCreatedProduct(newProduct);
          toast.success('Product created successfully');
          setShowSuccessModal(true);
        } else {
          // Fallback if no product returned (e.g. optimistic update didn't return id)
          navigate('/products');
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData({ ...formData, image_url: url });
    }
  };

  const isLowStock = formData.track_inventory &&
    formData.quantity_on_hand !== null &&
    formData.low_stock_threshold !== null &&
    formData.quantity_on_hand <= formData.low_stock_threshold;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/products')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEdit ? 'Edit Product' : isDuplicate ? 'Duplicate Product' : 'New Product'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isEdit ? 'Update product information' : 'Add a new product or service to your catalog'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} className="mr-2" />
              {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-[1600px] mx-auto space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Package size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
              Basic Information
            </h2>

            <div className="space-y-4">
              {/* Product Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'product', label: 'Product', desc: 'Physical or digital goods' },
                    { value: 'service', label: 'Service', desc: 'Time-based or project work' },
                    { value: 'bundle', label: 'Bundle', desc: 'Package of products/services' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, product_type: type.value as ProductType })}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${formData.product_type === type.value
                        ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                      <p className="font-medium text-gray-900 dark:text-white mb-1">{type.label}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Website Design, Consulting Service, Software License"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Detailed description of your product or service"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Consulting, Design"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Image
                </label>
                <div className="flex items-start space-x-4">
                  {formData.image_url ? (
                    <div className="relative">
                      <img
                        src={formData.image_url}
                        alt="Product"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <Package size={32} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <Upload size={18} className="mr-2" />
                      Upload Image
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Recommended: 800x800px, JPG or PNG
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product-Specific Fields */}
          {formData.product_type === 'product' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Package size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
                Product Details
              </h2>

              <div className="space-y-4">
                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="SKU-001"
                  />
                </div>

                {/* Inventory Tracking Toggle */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="track_inventory_inline"
                      checked={formData.track_inventory}
                      onChange={(e) => setFormData({ ...formData, track_inventory: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="track_inventory_inline" className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Track inventory for this product
                      </span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Monitor stock levels and get low stock alerts
                      </p>
                    </label>
                  </div>

                  {formData.track_inventory && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Current Stock
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.quantity_on_hand}
                          onChange={(e) => setFormData({ ...formData, quantity_on_hand: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Low Stock Alert
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.low_stock_threshold}
                          onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Reorder Qty
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.reorder_quantity}
                          onChange={(e) => setFormData({ ...formData, reorder_quantity: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Shipping Weight & Dimensions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Weight (optional)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.weight || ''}
                        onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || undefined })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        lbs
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dimensions (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.dimensions || ''}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 10x8x4 in"
                    />
                  </div>
                </div>

                {isLowStock && (
                  <div className="flex items-start p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertCircle size={20} className="text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900 dark:text-red-200">
                        Low Stock Alert
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Current stock ({formData.quantity_on_hand}) is at or below the threshold ({formData.low_stock_threshold}). Consider reordering {formData.reorder_quantity} units.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service-Specific Fields */}
          {formData.product_type === 'service' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Package size={20} className="mr-2 text-purple-600 dark:text-purple-400" />
                Service Details
              </h2>

              <div className="space-y-4">
                {/* Pricing Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pricing Model *
                  </label>
                  <select
                    value={formData.pricing_model}
                    onChange={(e) => setFormData({ ...formData, pricing_model: e.target.value as PricingModel })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="one_time">One-time (Project-based)</option>
                    <option value="usage_based">Usage-based (Hourly/Per Unit)</option>
                    <option value="recurring">Recurring (Subscription)</option>
                  </select>
                </div>

                {/* Usage-based Fields */}
                {formData.pricing_model === 'usage_based' && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Usage Unit *
                    </label>
                    <input
                      type="text"
                      value={formData.usage_unit}
                      onChange={(e) => setFormData({ ...formData, usage_unit: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., hour, day, project, unit"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Example: "$150 per hour" or "$500 per day"
                    </p>
                  </div>
                )}

                {/* Recurring Fields */}
                {formData.pricing_model === 'recurring' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Billing Interval *
                        </label>
                        <select
                          value={formData.recurring_interval || 'monthly'}
                          onChange={(e) => setFormData({ ...formData, recurring_interval: e.target.value as RecurringInterval })}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Interval Count
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.recurring_interval_count}
                          onChange={(e) => setFormData({ ...formData, recurring_interval_count: parseInt(e.target.value) || 1 })}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Example: "Every 2 months" = Monthly interval with count of 2
                    </p>
                  </div>
                )}

                {/* Service Duration (Estimate) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estimated Duration (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      step="0.5"
                      value={formData.estimated_duration || ''}
                      onChange={(e) => setFormData({ ...formData, estimated_duration: parseFloat(e.target.value) || undefined })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2.5"
                    />
                    <select
                      value={formData.duration_unit || 'hours'}
                      onChange={(e) => setFormData({ ...formData, duration_unit: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>

                {/* Deliverables */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deliverables (optional)
                  </label>
                  <textarea
                    value={formData.deliverables || ''}
                    onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="What's included in this service? (e.g., Strategy document, Implementation plan, Follow-up session)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bundle-Specific Fields */}
          {formData.product_type === 'bundle' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Package size={20} className="mr-2 text-pink-600 dark:text-pink-400" />
                Bundle Configuration
              </h2>

              <div className="space-y-4">
                {/* Bundle Items Placeholder */}
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-6 border border-pink-200 dark:border-pink-800">
                  <div className="text-center">
                    <Package size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Bundle items feature coming soon
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      You'll be able to add products and services to create bundles
                    </p>
                  </div>
                </div>

                {/* Bundle Discount Strategy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bundle Discount Strategy
                  </label>
                  <select
                    value={formData.discount_type || 'fixed'}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fixed">Fixed amount off</option>
                    <option value="percentage">Percentage off</option>
                    <option value="custom">Custom bundle price</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <DollarSign size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
              Pricing
            </h2>

            <div className="space-y-4">
              {/* Price & Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cost (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost || ''}
                      onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    For margin calculations
                  </p>
                </div>
              </div>

              {/* Tax Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_taxable"
                    checked={formData.is_taxable}
                    onChange={(e) => setFormData({ ...formData, is_taxable: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="is_taxable" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Taxable
                  </label>
                </div>

                {formData.is_taxable && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status & Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Tag size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
              Status & Visibility
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Active</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Product is visible and can be added to quotes/invoices
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>
      <CreationSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={`${formData.product_type === 'service' ? 'Service' : 'Product'} Created!`}
        subtitle={`Your ${formData.product_type} has been added to the catalog`}
        itemName={createdProduct?.name || formData.name}
        actions={[
          {
            label: 'Back to Catalog',
            path: '/products',
            icon: <ArrowLeft className="w-4 h-4" />,
            variant: 'primary'
          },
          {
            label: `View ${formData.product_type === 'service' ? 'Service' : 'Product'} Details`,
            path: `/products/${createdProduct?.id}`,
            icon: <Package className="w-4 h-4" />,
            variant: 'secondary'
          },
          {
            label: 'Add Another',
            path: '/products/new',
            icon: <Plus className="w-4 h-4" />,
            variant: 'secondary'
          }
        ]}
      />
    </div>
  );
}
