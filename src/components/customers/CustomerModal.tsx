import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Mail, Phone, Building, Save, AlertCircle } from 'lucide-react';
import { useCustomerStore } from '@/stores/customerStore';
import { PhoneInput } from '@/components/ui/PhoneInput';
import toast from 'react-hot-toast';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: any;
  navigateToProfileAfterCreate?: boolean;
}

export default function CustomerModal({ isOpen, onClose, customer, navigateToProfileAfterCreate = false }: CustomerModalProps) {
  const navigate = useNavigate();
  const { createCustomer, updateCustomer } = useCustomerStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customer_type: customer?.customer_type || 'personal',
    first_name: customer?.first_name || '',
    middle_name: customer?.middle_name || '',
    last_name: customer?.last_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    company: customer?.company || '',
    status: customer?.status || 'Active',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        customer_type: customer.customer_type || 'personal',
        first_name: customer.first_name || '',
        middle_name: customer.middle_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        status: customer.status || 'Active',
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.first_name || !formData.last_name || !formData.email) {
      setError('Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }

    if (formData.customer_type === 'business' && !formData.company) {
      setError('Company Name is required for business customers');
      return;
    }

    setSaving(true);

    try {
      if (customer) {
        await updateCustomer(customer.id, formData);
        toast.success('Customer updated successfully');
        onClose();
      } else {
        const newCustomer = await createCustomer(formData);

        if (!newCustomer) {
          throw new Error('Failed to create customer');
        }

        toast.success('Customer created successfully');

        setFormData({
          customer_type: 'personal',
          first_name: '',
          middle_name: '',
          last_name: '',
          email: '',
          phone: '',
          company: '',
          status: 'Active',
        });

        onClose();

        if (navigateToProfileAfterCreate && newCustomer.id) {
          navigate(`/customers/${newCustomer.id}`);
        }
      }
    } catch (error: any) {
      console.error('Error saving customer:', error);
      const errorMessage = error?.message || 'Failed to save customer. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {customer ? 'Edit Customer' : 'New Customer'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-400">{error}</p>
                {error.toLowerCase().includes('already exists') && (
                  <p className="text-xs text-red-700 dark:text-red-500 mt-1">
                    Please check the Customers page or use a different email address.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, customer_type: 'personal' })}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.customer_type === 'personal'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    formData.customer_type === 'personal'
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <User size={20} className={
                      formData.customer_type === 'personal'
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    } />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      Personal
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Individual client
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, customer_type: 'business' })}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.customer_type === 'business'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    formData.customer_type === 'business'
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Building size={20} className={
                      formData.customer_type === 'business'
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    } />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      Business
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Company/org
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="John"
              />
            </div>

            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Middle Name
            </label>
            <input
              type="text"
              value={formData.middle_name}
              onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Optional"
            />
          </div>

          {formData.customer_type === 'business' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Acme Corp"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <div>
              <PhoneInput
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Lead">Lead</option>
            </select>
          </div>

          <div className="pt-2 pb-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <span className="mr-1">💡</span>
              You can add more details (address, notes, etc.) from the customer profile page
            </p>
          </div>
        </form>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={
              saving ||
              !formData.first_name ||
              !formData.last_name ||
              !formData.email ||
              (formData.customer_type === 'business' && !formData.company)
            }
            className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
          </button>
        </div>
      </div>
    </div>
  );
}
