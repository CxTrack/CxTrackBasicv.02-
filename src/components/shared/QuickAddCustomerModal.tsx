import { useState } from 'react';
import { X, User, Building2 } from 'lucide-react';
import { useCustomerStore } from '@/stores/customerStore';
import toast from 'react-hot-toast';

interface QuickAddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: any) => void;
}

export default function QuickAddCustomerModal({
  isOpen,
  onClose,
  onCustomerCreated,
}: QuickAddCustomerModalProps) {
  const { createCustomer } = useCustomerStore();

  const [customerType, setCustomerType] = useState<'personal' | 'business'>('personal');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.first_name || !formData.last_name) {
      setError('First name and last name are required');
      return;
    }

    if (!formData.email && !formData.phone) {
      setError('Either email or phone is required');
      return;
    }

    setSaving(true);

    try {
      const customerData = {
        customer_type: customerType,
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name?.trim() || null,
        last_name: formData.last_name.trim(),
        email: formData.email.trim() || '',
        phone: formData.phone.trim() || null,
        company_name: customerType === 'business' ? formData.company_name.trim() : null,
        status: 'Active',
      };

      const newCustomer = await createCustomer(customerData);

      if (newCustomer) {
        console.log('✅ Quick add customer created:', newCustomer);
        toast.success('Customer created successfully');
        onCustomerCreated(newCustomer);
        onClose();

        setFormData({
          first_name: '',
          middle_name: '',
          last_name: '',
          email: '',
          phone: '',
          company_name: '',
        });
      }
    } catch (error: any) {
      console.error('❌ Error creating customer:', error);
      setError(error.message || 'Failed to create customer');
      toast.error('Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Quick Add Customer
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              You can add more details later from the customer profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Customer Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCustomerType('personal')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  customerType === 'personal'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <User size={24} className={`mx-auto mb-2 ${
                  customerType === 'personal' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Personal
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Individual client
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCustomerType('business')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  customerType === 'business'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <Building2 size={24} className={`mx-auto mb-2 ${
                  customerType === 'business' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Business
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Company/org
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="col-span-3 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Middle Name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.middle_name}
                onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                placeholder="Optional"
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-3 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {customerType === 'business' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Acme Corporation"
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Creating...' : 'Create & Select'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
