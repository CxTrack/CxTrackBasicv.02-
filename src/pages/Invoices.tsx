import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Plus, Filter, FileText, DollarSign,
  AlertCircle, CheckCircle, Clock, MoreVertical,
  Download, Eye, Edit, Send, Trash2, Archive, CheckCircle2
} from 'lucide-react';
import { useInvoiceStore } from '../stores/invoiceStore';
import { useOrganizationStore } from '../stores/organizationStore';
import { useThemeStore } from '../stores/themeStore';
import { PageContainer, Card } from '../components/theme/ThemeComponents';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { InvoiceStatus } from '../types/app.types';

export default function Invoices() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | InvoiceStatus>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const { invoices, loading, fetchInvoices } = useInvoiceStore();
  const { currentOrganization, demoMode, getOrganizationId } = useOrganizationStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    try {
      const orgId = currentOrganization?.id || (demoMode ? getOrganizationId() : undefined);
      if (orgId) {
        fetchInvoices(orgId);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    }
  }, [currentOrganization?.id, demoMode]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeDropdown) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    if (filterStatus !== 'all') {
      filtered = filtered.filter((inv) => inv.status === filterStatus);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((inv) =>
        inv.invoice_number.toLowerCase().includes(search) ||
        inv.customer_name.toLowerCase().includes(search) ||
        inv.customer_email?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [invoices, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    const totalValue = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.amount_due, 0);
    const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;
    const paidCount = invoices.filter((inv) => inv.status === 'paid').length;

    return { totalValue, totalPaid, totalOutstanding, overdueCount, paidCount };
  }, [invoices]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map(inv => inv.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectInvoice = (id: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedInvoices(newSelected);
    setSelectAll(newSelected.size === filteredInvoices.length);
  };

  const bulkMarkPaid = () => {
    toast.success(`${selectedInvoices.size} invoices marked as paid`);
    setSelectedInvoices(new Set());
    setSelectAll(false);
  };

  const bulkArchive = () => {
    if (!confirm(`Archive ${selectedInvoices.size} invoices?`)) return;
    toast.success(`${selectedInvoices.size} invoices archived`);
    setSelectedInvoices(new Set());
    setSelectAll(false);
  };

  const bulkDelete = () => {
    if (!confirm(`Delete ${selectedInvoices.size} invoices permanently?`)) return;
    toast.success(`${selectedInvoices.size} invoices deleted`);
    setSelectedInvoices(new Set());
    setSelectAll(false);
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'sent':
      case 'viewed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'partial':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'cancelled':
      case 'refunded':
        return 'bg-slate-100 text-slate-500 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const ActionsDropdown = ({ invoice, onClose }: { invoice: any; onClose: () => void }) => {
    return (
      <div
        className="absolute right-0 top-full mt-2 w-48 rounded-xl border-2 shadow-lg z-50"
        style={{
          background: theme === 'dark' ? '#1e293b' : 'white',
          borderColor: theme === 'dark' ? '#334155' : '#e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-2">
          <button
            onClick={() => {
              navigate(`/invoices/${invoice.id}`);
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-gray-900 dark:text-white"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>

          <button
            onClick={() => {
              navigate(`/invoices/builder/${invoice.id}`);
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-gray-900 dark:text-white"
          >
            <Edit className="w-4 h-4" />
            Edit Invoice
          </button>

          <button
            onClick={() => {
              toast.success('Invoice sent!');
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-gray-900 dark:text-white"
          >
            <Send className="w-4 h-4" />
            Send to Customer
          </button>

          <button
            onClick={() => {
              toast.success('Download started!');
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-gray-900 dark:text-white"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>

          <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this invoice?')) {
                toast.success('Invoice deleted!');
                onClose();
              }
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Invoice
          </button>
        </div>
      </div>
    );
  };

  if (loading && invoices.length === 0) {
    return (
      <PageContainer className="items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading invoices...</p>
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
                Invoices
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage billing and track payments
              </p>
            </div>
            <Link
              to="/invoices/builder"
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              <Plus size={20} className="mr-2" />
              New Invoice
            </Link>
          </div>

          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className={theme === 'soft-modern' ? "rounded-xl p-4 bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)]" : "bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
                <DollarSign size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalValue.toLocaleString()}
              </p>
            </div>

            <div className={theme === 'soft-modern' ? "rounded-xl p-4 bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)]" : "bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Paid</span>
                <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalPaid.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.paidCount} invoices</p>
            </div>

            <div className={theme === 'soft-modern' ? "rounded-xl p-4 bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)]" : "bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Outstanding</span>
                <Clock size={18} className="text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalOutstanding.toLocaleString()}
              </p>
            </div>

            <div className={theme === 'soft-modern' ? "rounded-xl p-4 bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)]" : "bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overdue</span>
                <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overdueCount}</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">Requires attention</p>
            </div>

            <div className={theme === 'soft-modern' ? "rounded-xl p-4 bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)]" : "bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Collection Rate</span>
                <CheckCircle size={18} className="text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalValue > 0 ? ((stats.totalPaid / stats.totalValue) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices by number, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
              {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Filter size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
      </Card>

      <div className="flex-1 overflow-y-auto">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No invoices found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first invoice to start billing customers'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link
                to="/invoices/builder"
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Plus size={20} className="mr-2" />
                Create Your First Invoice
              </Link>
            )}
          </div>
        ) : (
          <Card className="overflow-hidden p-0 min-h-[600px]">
            <table className="w-full">
              <thead className={theme === 'soft-modern' ? "bg-gradient-to-br from-slate-50 to-slate-100 border-b-2 border-slate-200" : "bg-slate-50 dark:bg-gray-700 border-b-2 border-slate-100 dark:border-gray-600"}>
                <tr>
                  <th className="w-12 px-4 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="w-16 text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Invoice #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Date / Due
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {filteredInvoices.map((invoice, index) => (
                  <tr
                    key={invoice.id}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-slate-100 dark:border-gray-700"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.has(invoice.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectInvoice(invoice.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="text-center px-4 py-4">
                      <span className="text-sm font-medium text-slate-400">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          invoice.status === 'paid'
                            ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20'
                            : invoice.status === 'overdue'
                            ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20'
                            : 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20'
                        }`}>
                          <FileText size={20} className={
                            invoice.status === 'paid'
                              ? 'text-green-600 dark:text-green-400'
                              : invoice.status === 'overdue'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-blue-600 dark:text-blue-400'
                          } />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{invoice.invoice_number}</p>
                          {invoice.quote_id && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">From quote</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{invoice.customer_name}</p>
                      {invoice.customer_email && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{invoice.customer_email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                      </p>
                      <p className={`text-xs ${
                        new Date(invoice.due_date) < new Date() && invoice.status !== 'paid'
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        Due: {format(new Date(invoice.due_date), 'MMM dd')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${invoice.total_amount.toLocaleString()}
                      </p>
                      {invoice.amount_paid > 0 && invoice.status !== 'paid' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ${invoice.amount_paid.toLocaleString()} paid
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 text-xs rounded-lg font-semibold border ${getStatusColor(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                          <Download size={16} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === invoice.id ? null : invoice.id);
                            }}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <MoreVertical size={16} className="text-gray-600 dark:text-gray-400" />
                          </button>

                          {activeDropdown === invoice.id && (
                            <ActionsDropdown
                              invoice={invoice}
                              onClose={() => setActiveDropdown(null)}
                            />
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {selectedInvoices.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center gap-6">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {selectedInvoices.size} selected
              </span>

              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

              <div className="flex items-center gap-3">
                <button
                  onClick={bulkMarkPaid}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Paid
                </button>

                <button
                  onClick={bulkArchive}
                  className="px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>

                <button
                  onClick={bulkDelete}
                  className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-xl hover:bg-rose-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>

                <button
                  onClick={() => {
                    setSelectedInvoices(new Set());
                    setSelectAll(false);
                  }}
                  className="px-4 py-2 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
