import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useProductStore } from '@/stores/productStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { invoiceService, InvoiceLineItem, InvoiceFormData } from '@/services/invoice.service';
import { settingsService } from '@/services/settings.service';
import { pdfService } from '@/services/pdf.service';
import { Plus, Minus, Trash2, GripVertical, Save, X, Loader2, Package, Briefcase, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ProductSelector from '@/components/products/ProductSelector';
import ShareDropdown, { ShareOption } from '@/components/share/ShareDropdown';
import ShareModal from '@/components/share/ShareModal';
import QuickAddCustomerModal from '@/components/shared/QuickAddCustomerModal';
import CreationSuccessModal from '@/components/shared/CreationSuccessModal';
import { User, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCustomerFullName } from '@/utils/customer.utils';

export default function InvoiceBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentOrganization, demoMode, getOrganizationId } = useOrganizationStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { products, fetchProducts, createProduct } = useProductStore();
  const { createInvoice: createInvoiceStore, updateInvoice: updateInvoiceStore, getInvoiceById } = useInvoiceStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showProductCatalog, setShowProductCatalog] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalTab, setShareModalTab] = useState<'email' | 'link' | 'pdf' | 'sms'>('link');
  const [savedInvoice, setSavedInvoice] = useState<any>(null);
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState<InvoiceFormData>({
    customer_id: '',
    customer_name: '',
    customer_email: '',
    customer_address: null,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [],
    subtotal: 0,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 0,
    amount_paid: 0,
    amount_due: 0,
    payment_terms: '',
    notes: '',
    terms: '',
    status: 'draft',
  });

  useEffect(() => {
    if (currentOrganization) {
      fetchCustomers();
      fetchProducts();
      loadSettings();
      if (id) {
        loadInvoice();
      }
    }
  }, [currentOrganization, id]);

  useEffect(() => {
    const customerId = searchParams.get('customer');
    if (customerId && customers.length > 0 && !formData.customer_id) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        console.log('Auto-populating customer from URL:', customer);
        setFormData(prev => ({
          ...prev,
          customer_id: customer.id,
          customer_name: getCustomerFullName(customer),
          customer_email: customer.email || '',
          customer_address: customer.address || null,
        }));
      }
    }
  }, [searchParams, customers, formData.customer_id]);

  const loadSettings = async () => {
    if (!currentOrganization) return;
    try {
      const settings = await settingsService.getBusinessSettings(currentOrganization.id);
      if (settings?.default_payment_terms) {
        setFormData(prev => ({ ...prev, payment_terms: settings.default_payment_terms }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadInvoice = async () => {
    if (!id) return;
    try {
      setLoading(true);
      let invoice;

      if (demoMode) {
        invoice = getInvoiceById(id);
      } else {
        invoice = await invoiceService.getInvoice(id);
      }

      if (invoice) {
        setFormData({
          customer_id: invoice.customer_id,
          customer_name: invoice.customer_name,
          customer_email: invoice.customer_email || '',
          customer_address: invoice.customer_address,
          quote_id: invoice.quote_id || undefined,
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date,
          items: invoice.items,
          subtotal: invoice.subtotal,
          discount_amount: invoice.discount_amount || 0,
          tax_amount: invoice.tax_amount,
          total_amount: invoice.total_amount,
          amount_paid: invoice.amount_paid || 0,
          amount_due: invoice.amount_due,
          payment_method: invoice.payment_method,
          payment_terms: invoice.payment_terms || '',
          notes: invoice.notes || '',
          terms: invoice.terms || '',
          status: invoice.status,
        });
      }
    } catch (error) {
      console.error('Failed to load invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customer.id,
        customer_name: getCustomerFullName(customer),
        customer_email: customer.email || '',
        customer_address: {
          street: customer.address,
          city: customer.city,
          state: customer.state,
          postal_code: customer.postal_code,
          country: customer.country,
        },
      }));
    }
  };

  const handleCustomerCreated = (newCustomer: any) => {
    console.log('✅ Customer created, auto-selecting:', newCustomer);
    setFormData(prev => ({
      ...prev,
      customer_id: newCustomer.id,
      customer_name: getCustomerFullName(newCustomer),
      customer_email: newCustomer.email || '',
      customer_address: {
        street: newCustomer.address,
        city: newCustomer.city,
        state: newCustomer.state || newCustomer.province,
        postal_code: newCustomer.postal_code,
        country: newCustomer.country,
      },
    }));
    fetchCustomers();
  };

  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
      product_type: undefined,
      product_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_amount: 0,
      tax_rate: 0,
      line_total: 0,
      sort_order: formData.items.length,
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const addProductFromCatalog = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newItem: InvoiceLineItem = {
      product_id: product.id,
      product_type: product.product_type,
      product_name: product.name,
      description: product.description || '',
      quantity: 1,
      unit_price: product.price,
      discount_amount: 0,
      tax_rate: product.tax_rate || 0,
      line_total: product.price,
      sort_order: formData.items.length,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    calculateTotals([...formData.items, newItem]);
    setShowProductCatalog(false);
  };

  const handleItemBlur = async (index: number) => {
    const item = formData.items[index];

    if (!item.product_type) {
      console.log('⚠️ Cannot save: Type not selected');
      return;
    }

    if (!item.product_name || !item.product_name.trim()) {
      console.log('⚠️ Cannot save: Name is empty');
      return;
    }

    if (!item.unit_price || item.unit_price <= 0) {
      console.log('⚠️ Cannot save: Price must be greater than 0');
      return;
    }

    if (item.product_id) {
      console.log('✅ Already saved to catalog');
      return;
    }

    try {
      console.log('💾 Saving to catalog:', {
        name: item.product_name,
        type: item.product_type,
        price: item.unit_price
      });

      const newProduct = await createProduct({
        name: item.product_name.trim(),
        description: item.description?.trim() || '',
        product_type: item.product_type,
        price: item.unit_price,
        sku: '',
        is_active: true,
        pricing_model: 'one_time',
        tax_rate: item.tax_rate || 0,
        is_taxable: (item.tax_rate || 0) > 0,
        track_inventory: item.product_type === 'product',
        quantity_on_hand: item.product_type === 'product' ? 0 : 0,
        requires_approval: false,
      });

      if (newProduct) {
        updateLineItem(index, 'product_id', newProduct.id);
        console.log('✅ Item saved to catalog with ID:', newProduct.id);
        toast.success(`"${item.product_name}" saved to catalog`);
      }
    } catch (error: any) {
      console.error('❌ Error saving to catalog:', error);
      toast.error(`Failed to save to catalog: ${error.message}`);
    }
  };

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price' || field === 'discount_amount' || field === 'tax_rate') {
      const item = updatedItems[index];
      const lineTotal = (item.quantity * item.unit_price) - (item.discount_amount || 0);
      updatedItems[index].line_total = lineTotal;
    }

    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const removeLineItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const items = [...formData.items];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);

    const reorderedItems = items.map((item, i) => ({ ...item, sort_order: i }));
    setFormData(prev => ({ ...prev, items: reorderedItems }));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const calculateTotals = (items: InvoiceLineItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
    const taxAmount = items.reduce((sum, item) => {
      const taxRate = item.tax_rate || 0;
      return sum + (item.line_total * (taxRate / 100));
    }, 0);
    const total = subtotal + taxAmount - (formData.discount_amount || 0);
    const amountDue = total - (formData.amount_paid || 0);

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
      amount_due: amountDue,
    }));
  };

  const handleSaveDraft = async () => {
    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    let organizationId: string;
    let userId: string;

    try {
      organizationId = getOrganizationId();
      userId = currentOrganization?.id || organizationId;
    } catch (error: any) {
      console.error('Organization error:', error);
      toast.error('No organization available. Please ensure you are logged in or demo mode is enabled.');
      return;
    }

    try {
      setSaving(true);

      if (id) {
        if (demoMode) {
          await updateInvoiceStore(id, { ...formData, status: 'draft' });
          const invoice = getInvoiceById(id);
          setSavedInvoice(invoice);
        } else {
          await invoiceService.updateInvoice(id, { ...formData, status: 'draft' });
          const invoice = await invoiceService.getInvoice(id);
          setSavedInvoice(invoice);
        }
        toast.success('Invoice saved as draft');
      } else {
        const invoiceData: any = {
          organization_id: organizationId,
          created_by: userId,
          ...formData,
          status: 'draft'
        };

        const invoice = await createInvoiceStore(invoiceData);
        if (invoice) {
          setSavedInvoice(invoice);
          toast.success('Invoice saved as draft');
          window.history.replaceState(null, '', `/invoices/builder/${invoice.id}`);
        } else {
          throw new Error('Failed to create invoice');
        }
      }
    } catch (error: any) {
      console.error('Failed to save invoice:', error);
      const errorMessage = error?.message || error?.error_description || error?.hint || 'Failed to save invoice. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }
    if (formData.total_amount <= 0) {
      toast.error('Invoice total must be greater than zero');
      return;
    }

    let organizationId: string;
    let userId: string;

    try {
      organizationId = getOrganizationId();
      userId = currentOrganization?.id || organizationId;
    } catch (error: any) {
      console.error('Organization error:', error);
      toast.error('No organization available. Please ensure you are logged in or demo mode is enabled.');
      return;
    }

    try {
      setSaving(true);

      if (id) {
        if (demoMode) {
          await updateInvoiceStore(id, { ...formData, status: 'sent' });
          const invoice = getInvoiceById(id);
          setSavedInvoice(invoice);
        } else {
          await invoiceService.updateInvoice(id, { ...formData, status: 'sent' });
          const invoice = await invoiceService.getInvoice(id);
          setSavedInvoice(invoice);
        }
        toast.success('Invoice finalized successfully');
      } else {
        const invoiceData: any = {
          organization_id: organizationId,
          created_by: userId,
          ...formData,
          status: 'sent'
        };

        const invoice = await createInvoiceStore(invoiceData);
        if (invoice) {
          setSavedInvoice(invoice);
          toast.success('Invoice created successfully');
          setShowSuccessModal(true);
          window.history.replaceState(null, '', `/invoices/builder/${invoice.id}`);
        } else {
          throw new Error('Failed to create invoice');
        }
      }
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      const errorMessage = error?.message || error?.error_description || error?.hint || 'Failed to create invoice. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleShareOption = async (option: ShareOption) => {
    if (!savedInvoice) {
      toast.error('Please create the invoice first');
      return;
    }

    if (option === 'pdf') {
      if (!currentOrganization) {
        toast.error('Organization not available');
        return;
      }
      try {
        console.log('🔄 Generating PDF for invoice:', savedInvoice.invoice_number);
        console.log('Using organization ID:', currentOrganization.id);

        const organizationInfo = await settingsService.getOrganizationForPDF(currentOrganization.id);

        console.log('📄 Generating PDF with organization info:', organizationInfo);
        pdfService.generateInvoicePDF(savedInvoice, organizationInfo);
        toast.success('Invoice PDF downloaded');
      } catch (error) {
        console.error('Failed to generate PDF:', error);
        toast.error('Failed to generate PDF');
      }
      return;
    }

    setShareModalTab(option);
    setShowShareModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-[1920px] mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {id ? 'Edit Invoice' : 'Create Invoice'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Build a professional invoice for your customer
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/invoices')}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <ShareDropdown
              onSelect={handleShareOption}
              disabled={!savedInvoice || savedInvoice?.status === 'draft'}
              buttonText="Share"
              variant="secondary"
            />
            {demoMode && (
              <div className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 text-sm font-medium rounded-lg border border-amber-300 dark:border-amber-700">
                Demo Mode
              </div>
            )}
            <Button
              onClick={handleCreate}
              disabled={
                saving ||
                !formData.customer_id ||
                formData.items.length === 0 ||
                formData.total_amount <= 0
              }
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {id ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                id ? 'Update Invoice' : 'Create Invoice'
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer</h2>
              <div className="flex gap-2">
                <select
                  value={formData.customer_id}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                >
                  <option value="">Select customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {getCustomerFullName(customer)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCustomer(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap font-medium"
                >
                  <Plus size={18} />
                  Quick Add
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Line Items</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowProductCatalog(!showProductCatalog)}>
                    <Plus className="w-4 h-4 mr-2" />
                    From Catalog
                  </Button>
                  <Button size="sm" onClick={addLineItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>

              <ProductSelector
                isOpen={showProductCatalog}
                onClose={() => setShowProductCatalog(false)}
                onSelect={(product) => addProductFromCatalog(product.id)}
                organizationId={currentOrganization?.id}
              />

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700 relative group"
                  >
                    <div className="absolute left-2 top-6 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="ml-8 space-y-3">
                      {/* Row 1: Type Selector */}
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          Type: *
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateLineItem(index, 'product_type', 'product')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${item.product_type === 'product'
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                              }`}
                          >
                            <Package size={18} />
                            <span className="font-medium">Product</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateLineItem(index, 'product_type', 'service')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${item.product_type === 'service'
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                              }`}
                          >
                            <Briefcase size={18} />
                            <span className="font-medium">Service</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowProductCatalog(true)}
                          className="ml-auto px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium text-sm"
                        >
                          From Catalog
                        </button>
                      </div>

                      {/* Row 2: Main Fields */}
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Item Name *
                          </label>
                          <Input
                            type="text"
                            value={item.product_name}
                            onChange={(e) => updateLineItem(index, 'product_name', e.target.value)}
                            onBlur={() => handleItemBlur(index)}
                            placeholder={item.product_type === 'product' ? 'Product name' : item.product_type === 'service' ? 'Service name' : 'Select type first'}
                            className="text-sm"
                            disabled={!item.product_type}
                          />
                          {!item.product_type && item.product_name === '' && (
                            <p className="text-xs text-red-600 mt-1">
                              ↑ Select type first
                            </p>
                          )}
                        </div>

                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Qty *
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newQty = Math.max(1, item.quantity - 1);
                                updateLineItem(index, 'quantity', newQty);
                              }}
                              disabled={!item.product_type || item.quantity <= 1}
                              className={`
                              p-2 rounded-lg transition-colors flex-shrink-0
                              ${!item.product_type || item.quantity <= 1
                                  ? 'opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
                                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }
                            `}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQty = Math.max(1, parseFloat(e.target.value) || 1);
                                updateLineItem(index, 'quantity', newQty);
                              }}
                              placeholder="1"
                              className={`
                              w-16 px-2 py-2 rounded-lg border-2 text-sm text-center font-semibold
                              bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600
                              text-gray-900 dark:text-white
                              focus:border-blue-500 focus:outline-none
                              [appearance:textfield]
                              [&::-webkit-outer-spin-button]:appearance-none
                              [&::-webkit-inner-spin-button]:appearance-none
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                              min="1"
                              step="1"
                              disabled={!item.product_type}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newQty = item.quantity + 1;
                                updateLineItem(index, 'quantity', newQty);
                              }}
                              disabled={!item.product_type}
                              className={`
                              p-2 rounded-lg transition-colors flex-shrink-0
                              ${!item.product_type
                                  ? 'opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
                                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }
                            `}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Unit Price *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                            <Input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              onBlur={() => handleItemBlur(index)}
                              placeholder="0.00"
                              className="text-sm text-right pl-7"
                              min="0"
                              step="0.01"
                              disabled={!item.product_type}
                            />
                          </div>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Discount ($)
                          </label>
                          <Input
                            type="number"
                            value={item.discount_amount || 0}
                            onChange={(e) => updateLineItem(index, 'discount_amount', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="text-sm text-center"
                            min="0"
                            step="0.01"
                            disabled={!item.product_type}
                          />
                        </div>

                        <div className="col-span-1">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Total
                          </label>
                          <div className="flex items-center justify-end h-[42px]">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${item.line_total.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="col-span-1 flex items-end justify-end pb-2">
                          <button
                            onClick={() => removeLineItem(index)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded transition-colors"
                            title="Delete item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Row 3: Description */}
                      <div>
                        <Input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          className="text-sm"
                          disabled={!item.product_type}
                        />
                      </div>

                      {/* Save Indicator */}
                      {item.product_id && (
                        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                          <Check size={14} />
                          <span>Saved to catalog</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {formData.items.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No items added yet. Click "Add Item" to get started.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Internal)
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    placeholder="Internal notes (not visible to customer)..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={formData.terms || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    placeholder="Terms and conditions..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invoice Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Invoice Date
                  </label>
                  <Input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Terms
                  </label>
                  <Input
                    type="text"
                    value={formData.payment_terms || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                    placeholder="Net 30"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${formData.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Discount</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={formData.discount_amount}
                      onChange={(e) => {
                        const discount = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({ ...prev, discount_amount: discount }));
                        calculateTotals(formData.items);
                      }}
                      className="w-24 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${formData.tax_amount.toFixed(2)}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${formData.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
                {formData.amount_paid > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Amount Paid</span>
                      <span className="font-medium text-green-600">
                        ${formData.amount_paid.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">Amount Due</span>
                      <span className="font-bold text-orange-600">
                        ${formData.amount_due.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {savedInvoice && currentOrganization && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            documentType="invoice"
            document={savedInvoice}
            organizationId={currentOrganization.id}
            userId={currentOrganization.id}
            organizationInfo={{
              name: currentOrganization.name,
              address: currentOrganization.address || '',
              phone: currentOrganization.phone || '',
              email: currentOrganization.email || '',
            }}
            initialTab={shareModalTab}
          />
        )}

        <QuickAddCustomerModal
          isOpen={showQuickAddCustomer}
          onClose={() => setShowQuickAddCustomer(false)}
          onCustomerCreated={handleCustomerCreated}
        />

        <CreationSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Invoice Created!"
          subtitle="Your invoice has been saved successfully"
          itemName={formData.customer_name}
          itemNumber={savedInvoice?.invoice_number}
          actions={[
            {
              label: 'Back to All Invoices',
              path: '/invoices',
              icon: <ArrowLeft className="w-4 h-4" />,
              variant: 'primary'
            },
            {
              label: 'View Customer Profile',
              path: `/customers/${formData.customer_id}`,
              icon: <User className="w-4 h-4" />,
              variant: 'secondary'
            }
          ]}
        />
      </div>
    </div>
  );
}
