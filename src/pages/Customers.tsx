import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, Filter, Users, Building2, Mail, Phone,
  Eye, Edit, Trash2
} from 'lucide-react';
import { useCustomerStore } from '@/stores/customerStore';
import { useThemeStore } from '@/stores/themeStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import CustomerModal from '@/components/customers/CustomerModal';
import { getCustomerFullName } from '@/utils/customer.utils';
import { formatPhoneDisplay } from '@/utils/phone.utils';
import { Card, Button, PageContainer } from '@/components/theme/ThemeComponents';
import SettingsPopover from '@/components/settings/SettingsPopover';
import CustomFieldsPanel from '@/components/settings/CustomFieldsPanel';
import CSVImporter from '@/components/import/CSVImporter';
import toast from 'react-hot-toast';

export const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'personal' | 'business'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showCustomFields, setShowCustomFields] = useState(false);

  const { customers, loading, fetchCustomers, deleteCustomer } = useCustomerStore();
  const { theme } = useThemeStore();
  const { currentMembership } = useOrganizationStore();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const fullName = getCustomerFullName(customer);
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.company?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || customer.customer_type === filterType;
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (currentMembership?.role !== 'owner' && currentMembership?.role !== 'admin') {
      toast.error('You do not have permission to delete customers');
      return;
    }
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id);
        toast.success('Customer deleted successfully');
      } catch (error) {
        toast.error('Failed to delete customer');
      }
    }
  };

  return (
    <PageContainer>
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your customer relationships
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCustomerModal(true)}
            className="flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Add Customer
          </Button>
          <div className="ml-2">
            <SettingsPopover
              onCustomFields={() => setShowCustomFields(true)}
              onImportCSV={() => setShowImporter(true)}
              onExportData={() => toast('Export feature coming soon', { icon: '🚧' })}
              onManageTags={() => toast('Tags management coming soon', { icon: '🚧' })}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={
                theme === 'soft-modern'
                  ? 'w-full pl-10 pr-4 py-2 bg-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.9)] border-2 border-transparent focus:border-blue-500 transition-all text-slate-700 placeholder:text-slate-400'
                  : 'w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 dark:text-white placeholder-gray-500'
              }
            />
          </div>

          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className={
              showFilters
                ? 'bg-primary-50 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400'
                : ''
            }
          >
            <Filter size={20} />
          </Button>

          <Button
            variant="primary"
            onClick={() => setShowCustomerModal(true)}
            className="md:hidden p-2"
          >
            <Plus size={20} />
          </Button>
        </div>

        {showFilters && (
          <div
            className={
              theme === 'soft-modern'
                ? 'mt-4 p-4 bg-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)]'
                : 'mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600'
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer Type
                </label>
                <div className="flex space-x-2">
                  {(['all', 'personal', 'business'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === type
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                    >
                      {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex space-x-2">
                  {(['all', 'Active', 'Inactive'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="mb-6 p-4">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <span className="text-gray-600 dark:text-gray-400">Total:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">{customers.length}</span>
          </div>
          <div className="flex items-center">
            <Users size={16} className="text-blue-600 dark:text-blue-400 mr-1" />
            <span className="text-gray-600 dark:text-gray-400">Personal:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              {customers.filter(c => c.customer_type === 'personal').length}
            </span>
          </div>
          <div className="flex items-center">
            <Building2 size={16} className="text-purple-600 dark:text-purple-400 mr-1" />
            <span className="text-gray-600 dark:text-gray-400">Business:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              {customers.filter(c => c.customer_type === 'business').length}
            </span>
          </div>
        </div>
      </Card>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Users size={40} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No customers found' : 'No customers yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {searchTerm
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first customer'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCustomerModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
              >
                Add Your First Customer
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden md:block p-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <Link
                            to={`/customers/${customer.id}`}
                            className="flex items-center space-x-3 group"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold">
                              {customer.customer_type === 'business' ? (
                                <Building2 size={20} />
                              ) : (
                                getCustomerFullName(customer).charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                {getCustomerFullName(customer)}
                              </p>
                              {customer.company && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {customer.company}
                                </p>
                              )}
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${customer.customer_type === 'business'
                            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400'
                            : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                            }`}>
                            {customer.customer_type === 'business' ? (
                              <>
                                <Building2 size={12} className="mr-1" />
                                Business
                              </>
                            ) : (
                              <>
                                <Users size={12} className="mr-1" />
                                Personal
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <Mail size={14} className="mr-2" />
                                {customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <Phone size={14} className="mr-2" />
                                {formatPhoneDisplay(customer.phone)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${customer.status === 'Active'
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                            }`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                          ${customer.total_spent?.toLocaleString() || '0.00'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/customers/${customer.id}`}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye size={18} />
                            </Link>
                            <Link
                              to={`/customers/${customer.id}/edit`}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </Link>
                            {(currentMembership?.role === 'owner' || currentMembership?.role === 'admin') && (
                              <button
                                onClick={() => handleDelete(customer.id)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden space-y-4 px-4 pb-20">
              {filteredCustomers.map((customer) => (
                <Link
                  key={customer.id}
                  to={`/customers/${customer.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${customer.customer_type === 'business'
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                        }`}>
                        {customer.customer_type === 'business' ? (
                          <Building2 size={24} />
                        ) : (
                          getCustomerFullName(customer).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {getCustomerFullName(customer)}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {customer.company || (customer.customer_type === 'personal' ? 'Individual' : 'Business')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${customer.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-gray-50 text-gray-700 border-gray-100'
                      }`}>
                      {customer.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Contact</p>
                      <div className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                        <Mail size={12} className="mr-1.5 text-blue-500" />
                        <span className="truncate">{customer.email || 'No email'}</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Spent</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        ${customer.total_spent?.toLocaleString() || '0.00'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700">
                    <div className="flex items-center -space-x-2">
                      {/* Subtle visual indicator or action shortcuts if needed */}
                      <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-blue-100 flex items-center justify-center">
                        <Eye size={14} className="text-blue-600" />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center">
                      View Profile
                      <Plus size={14} className="ml-1 rotate-45" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        customer={undefined} // Passing undefined for create mode
      />

      <CSVImporter
        isOpen={showImporter}
        onClose={() => setShowImporter(false)}
        onSuccess={() => {
          setShowImporter(false);
          fetchCustomers();
          toast.success('Import completed successfully');
        }}
      />

      <CustomFieldsPanel
        isOpen={showCustomFields}
        onClose={() => setShowCustomFields(false)}
        entityType="customer"
      />
    </PageContainer>
  );
};
