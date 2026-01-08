import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Plus, Filter, FileText,
  AlertCircle, Clock, MoreVertical, List, Grid,
  Download, Eye, Edit, Send, Trash2, Archive, CheckCircle2,
  ArrowRight, Wallet, CreditCard
} from 'lucide-react';
import { useInvoiceStore } from '../stores/invoiceStore';
import { useOrganizationStore } from '../stores/organizationStore';
import { useThemeStore } from '../stores/themeStore';
import { PageContainer, Card, IconBadge } from '../components/theme/ThemeComponents';
import { CompactStatsBar } from '../components/compact/CompactViews';
import { ResizableTable, ColumnDef } from '../components/compact/ResizableTable';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { InvoiceStatus } from '../types/app.types';
import { ReportGenerator, ExportButton } from '../components/reports/ReportGenerator';

export default function Invoices() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | InvoiceStatus>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [viewMode, setViewMode] = useState<'compact' | 'table'>('compact');

  const { invoices, loading, fetchInvoices, deleteInvoice } = useInvoiceStore();
  const { currentOrganization, demoMode, getOrganizationId, currentMembership } = useOrganizationStore();
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
    const handleClickOutside = (_e: MouseEvent) => {
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

          {/* Role-based guard for sensitive actions */}
          {(currentMembership?.role === 'owner' || currentMembership?.role === 'admin') && (
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to delete this invoice?')) {
                  try {
                    await deleteInvoice(invoice.id);
                    toast.success('Invoice deleted successfully');
                    onClose();
                  } catch (error) {
                    toast.error('Failed to delete invoice');
                  }
                }
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Invoice
            </button>
          )}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Financial Center
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Generate invoices, track receivables, and manage billing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onExport={(format) => console.log(`Exporting as ${format}`)} />
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium text-sm"
          >
            <Download size={16} className="mr-1.5" />
            Report
          </button>
          <Link
            to="/invoices/builder"
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-sm active:scale-95"
          >
            <Plus size={18} className="mr-2" />
            New Invoice
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="flex items-center gap-4 p-4 group h-24">
          <IconBadge
            icon={<Wallet size={20} className="text-blue-600" />}
            gradient="bg-blue-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${(stats.totalValue / 1000).toFixed(1)}k</h3>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </Card>

        <Card hover className="flex items-center gap-4 p-4 group h-24">
          <IconBadge
            icon={<CreditCard size={20} className="text-emerald-600" />}
            gradient="bg-emerald-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Paid</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${(stats.totalPaid / 1000).toFixed(1)}k</h3>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </Card>

        <Card hover className="flex items-center gap-4 p-4 group h-24">
          <IconBadge
            icon={<Clock size={20} className="text-orange-600" />}
            gradient="bg-orange-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Outstanding</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${(stats.totalOutstanding / 1000).toFixed(1)}k</h3>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </Card>

        <Card hover className="flex items-center gap-4 p-4 group h-24">
          <IconBadge
            icon={<AlertCircle size={20} className="text-rose-600" />}
            gradient="bg-rose-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Overdue</p>
            <h3 className="text-2xl font-bold text-rose-600">{stats.overdueCount}</h3>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700">
        <div className="flex bg-slate-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto scrollbar-hide">
          {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${filterStatus === status
                ? 'bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 md:max-w-xl md:ml-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoices..."
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
              onClick={() => setViewMode('table')}
              className={`px-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Table View"
            >
              <Grid size={18} />
            </button>
          </div>

          <button className="p-2 bg-slate-100 dark:bg-gray-700 rounded-lg text-slate-500 hover:text-slate-700 transition-all">
            <Filter size={18} />
          </button>
        </div>
      </div>

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
        ) : viewMode === 'compact' ? (
          <>
            {/* Compact Stats */}
            <CompactStatsBar stats={[
              { label: 'Total', value: filteredInvoices.length },
              { label: 'Revenue', value: `$${(stats.totalValue / 1000).toFixed(1)}k` },
              { label: 'Paid', value: `$${(stats.totalPaid / 1000).toFixed(1)}k` },
              { label: 'Outstanding', value: `$${(stats.totalOutstanding / 1000).toFixed(1)}k` },
            ]} />

            {/* Resizable Table */}
            <ResizableTable
              storageKey="invoices"
              data={filteredInvoices}
              onRowClick={(invoice) => navigate(`/invoices/${invoice.id}`)}
              columns={[
                {
                  id: 'invoice_number',
                  header: 'Invoice #',
                  defaultWidth: 140,
                  minWidth: 100,
                  render: (invoice) => (
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">{invoice.invoice_number}</span>
                      <span className="text-[11px] text-gray-400 block">{format(new Date(invoice.invoice_date), 'MMM dd')}</span>
                    </div>
                  ),
                },
                {
                  id: 'customer',
                  header: 'Customer',
                  defaultWidth: 180,
                  minWidth: 120,
                  render: (invoice) => (
                    <span className="text-gray-700 dark:text-gray-300 truncate block">{invoice.customer_name}</span>
                  ),
                },
                {
                  id: 'amount',
                  header: 'Amount',
                  defaultWidth: 100,
                  minWidth: 80,
                  align: 'right',
                  render: (invoice) => (
                    <span className="font-bold text-gray-900 dark:text-white">${invoice.total_amount.toLocaleString()}</span>
                  ),
                },
                {
                  id: 'paid',
                  header: 'Paid',
                  defaultWidth: 90,
                  minWidth: 70,
                  align: 'right',
                  render: (invoice) => (
                    <span className="text-green-600 font-medium">${invoice.amount_paid.toLocaleString()}</span>
                  ),
                },
                {
                  id: 'due',
                  header: 'Due',
                  defaultWidth: 90,
                  minWidth: 70,
                  align: 'right',
                  render: (invoice) => (
                    <span className={invoice.amount_due > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                      ${invoice.amount_due.toLocaleString()}
                    </span>
                  ),
                },
                {
                  id: 'status',
                  header: 'Status',
                  defaultWidth: 100,
                  minWidth: 80,
                  render: (invoice) => (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  ),
                },
                {
                  id: 'due_date',
                  header: 'Due Date',
                  defaultWidth: 90,
                  minWidth: 70,
                  render: (invoice) => (
                    <span className="text-[11px] text-gray-500">{format(new Date(invoice.due_date), 'MMM dd')}</span>
                  ),
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  defaultWidth: 100,
                  minWidth: 80,
                  align: 'right',
                  render: (invoice) => (
                    <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-60 hover:opacity-100">
                        <Download className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === invoice.id ? null : invoice.id);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-60 hover:opacity-100 relative"
                      >
                        <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                        {activeDropdown === invoice.id && (
                          <ActionsDropdown invoice={invoice} onClose={() => setActiveDropdown(null)} />
                        )}
                      </button>
                    </div>
                  ),
                },
              ] as ColumnDef[]}
            />
          </>
        ) : (
          <>
            {/* Desktop Table View */}
            <Card className="hidden md:block overflow-hidden p-0 min-h-[600px]">
              <table className="w-full">
                <thead className={theme === 'soft-modern' ? "bg-base border-b border-default" : "bg-slate-50 dark:bg-gray-700 border-b-2 border-slate-100 dark:border-gray-600"}>
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
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${invoice.status === 'paid'
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
                        <p className={`text-xs ${new Date(invoice.due_date) < new Date() && invoice.status !== 'paid'
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 pb-24">
              {filteredInvoices.map((invoice) => {
                const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status !== 'paid';
                return (
                  <div
                    key={invoice.id}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${invoice.status === 'paid' ? 'bg-green-50' : isOverdue ? 'bg-red-50' : 'bg-blue-50'}`}>
                          <FileText size={20} className={invoice.status === 'paid' ? 'text-green-600' : isOverdue ? 'text-red-600' : 'text-blue-600'} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{invoice.invoice_number}</h3>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                            Due {format(new Date(invoice.due_date), 'MMM dd')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>

                    <div className="space-y-1 mb-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.customer_name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Total Amount</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">${invoice.total_amount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50 dark:border-gray-700">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${invoice.id}`); }}
                        className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                      >
                        View Invoice
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); activeDropdown === invoice.id ? setActiveDropdown(null) : setActiveDropdown(invoice.id); }}
                        className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg relative"
                      >
                        <MoreVertical size={16} />
                        {activeDropdown === invoice.id && (
                          <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                        )}
                        {activeDropdown === invoice.id && (
                          <div className="absolute right-0 bottom-full mb-2 z-50">
                            <ActionsDropdown invoice={invoice} onClose={() => setActiveDropdown(null)} />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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

      {/* Report Generator Modal */}
      <ReportGenerator
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        defaultType="invoices"
      />
    </PageContainer>
  );
}
