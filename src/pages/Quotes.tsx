import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Plus, Filter, FileText, DollarSign, Download,
  Clock, MoreVertical, List, Grid,
  Archive, CheckCircle2, Trash2,
  ArrowRight, Target, Zap
} from 'lucide-react';
import { useQuoteStore } from '../stores/quoteStore';
import { useOrganizationStore } from '../stores/organizationStore';
import { useThemeStore } from '../stores/themeStore';
import { PageContainer, Card, IconBadge } from '../components/theme/ThemeComponents';
import { CompactStatsBar } from '../components/compact/CompactViews';
import { ResizableTable, ColumnDef } from '../components/compact/ResizableTable';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { QuoteStatus } from '../types/app.types';
import { ReportGenerator, ExportButton } from '../components/reports/ReportGenerator';

export default function Quotes() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | QuoteStatus>('all');
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [viewMode, setViewMode] = useState<'compact' | 'table'>('compact');

  const { quotes, loading, fetchQuotes, deleteQuote } = useQuoteStore();
  const { currentOrganization, demoMode, getOrganizationId, currentMembership } = useOrganizationStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    try {
      const orgId = currentOrganization?.id || (demoMode ? getOrganizationId() : undefined);
      if (orgId) {
        fetchQuotes(orgId);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    }
  }, [currentOrganization?.id, demoMode]);

  const filteredQuotes = useMemo(() => {
    let filtered = quotes;

    if (filterStatus !== 'all') {
      filtered = filtered.filter((q) => q.status === filterStatus);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((q) =>
        q.quote_number.toLowerCase().includes(search) ||
        q.customer_name.toLowerCase().includes(search) ||
        q.customer_email?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [quotes, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    const totalValue = quotes.reduce((sum, q) => sum + q.total_amount, 0);
    const draftCount = quotes.filter((q) => q.status === 'draft').length;
    const sentCount = quotes.filter((q) => q.status === 'sent' || q.status === 'viewed').length;
    const acceptedCount = quotes.filter((q) => q.status === 'accepted').length;
    const conversionRate = quotes.length > 0 ? (acceptedCount / quotes.length) * 100 : 0;

    return { totalValue, draftCount, sentCount, acceptedCount, conversionRate };
  }, [quotes]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedQuotes(new Set());
    } else {
      setSelectedQuotes(new Set(filteredQuotes.map(q => q.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectQuote = (id: string) => {
    const newSelected = new Set(selectedQuotes);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedQuotes(newSelected);
    setSelectAll(newSelected.size === filteredQuotes.length);
  };

  const bulkMarkAccepted = () => {
    toast.success(`${selectedQuotes.size} quotes marked as accepted`);
    setSelectedQuotes(new Set());
    setSelectAll(false);
  };

  const bulkArchive = () => {
    if (!confirm(`Archive ${selectedQuotes.size} quotes?`)) return;
    toast.success(`${selectedQuotes.size} quotes archived`);
    setSelectedQuotes(new Set());
    setSelectAll(false);
  };

  const bulkDelete = () => {
    if (!confirm(`Delete ${selectedQuotes.size} quotes permanently?`)) return;
    toast.success(`${selectedQuotes.size} quotes deleted`);
    setSelectedQuotes(new Set());
    setSelectAll(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (currentMembership?.role !== 'owner' && currentMembership?.role !== 'admin') {
      toast.error('You do not have permission to delete quotes');
      return;
    }
    if (!confirm('Are you sure you want to delete this quote?')) return;
    try {
      await deleteQuote(id);
      toast.success('Quote deleted successfully');
    } catch (error) {
      toast.error('Failed to delete quote');
    }
  };

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'sent':
      case 'viewed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'accepted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'declined':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'expired':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'converted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading && quotes.length === 0) {
    return (
      <PageContainer className="items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading quotes...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sales Quotes
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Draft proposals, track customer interest, and convert leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onExport={(format) => console.log(`Exporting quotes as ${format}`)} />
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium text-sm"
          >
            <Download size={16} className="mr-1.5" />
            Report
          </button>
          <Link
            to="/quotes/builder"
            className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium shadow-sm active:scale-95"
          >
            <Plus size={18} className="mr-2" />
            Create Quote
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="flex items-center gap-4 p-4 group h-24">
          <IconBadge
            icon={<DollarSign size={20} className="text-blue-600" />}
            gradient="bg-blue-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pipeline Value</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${(stats.totalValue / 1000).toFixed(1)}k</h3>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </Card>

        <Card hover className="flex items-center gap-4 p-4 group h-24">
          <IconBadge
            icon={<Clock size={20} className="text-amber-600" />}
            gradient="bg-amber-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pending</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.sentCount}</h3>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </Card>

        <Card hover className="flex items-center gap-4 p-4 group h-24">
          <IconBadge
            icon={<Target size={20} className="text-emerald-600" />}
            gradient="bg-emerald-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Accepted</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.acceptedCount}</h3>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </Card>

        <Card hover className="flex items-center gap-4 p-4 group h-24">
          <IconBadge
            icon={<Zap size={20} className="text-purple-600" />}
            gradient="bg-purple-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Win Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.conversionRate.toFixed(0)}%</h3>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700">
        <div className="flex bg-slate-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto scrollbar-hide">
          {(['all', 'draft', 'sent', 'accepted', 'declined'] as const).map((status) => (
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
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-gray-700 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
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
        {filteredQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No quotes found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first quote to get started'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link
                to="/quotes/builder"
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Plus size={20} className="mr-2" />
                Create Your First Quote
              </Link>
            )}
          </div>
        ) : viewMode === 'compact' ? (
          <>
            {/* Compact Stats */}
            <CompactStatsBar stats={[
              { label: 'Total', value: filteredQuotes.length },
              { label: 'Value', value: `$${(stats.totalValue / 1000).toFixed(1)}k` },
              { label: 'Pending', value: stats.sentCount },
              { label: 'Accepted', value: stats.acceptedCount },
            ]} />

            {/* Resizable Table */}
            <ResizableTable
              storageKey="quotes"
              data={filteredQuotes}
              onRowClick={(quote) => navigate(`/quotes/${quote.id}`)}
              columns={[
                {
                  id: 'quote_number',
                  header: 'Quote #',
                  defaultWidth: 120,
                  minWidth: 100,
                  render: (quote) => (
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">{quote.quote_number}</span>
                      <span className="text-[11px] text-gray-400 block">v{quote.version}</span>
                    </div>
                  ),
                },
                {
                  id: 'customer',
                  header: 'Customer',
                  defaultWidth: 200,
                  minWidth: 120,
                  render: (quote) => (
                    <span className="text-gray-700 dark:text-gray-300 truncate block">{quote.customer_name}</span>
                  ),
                },
                {
                  id: 'amount',
                  header: 'Amount',
                  defaultWidth: 110,
                  minWidth: 80,
                  align: 'right',
                  render: (quote) => (
                    <span className="font-bold text-gray-900 dark:text-white">${quote.total_amount.toLocaleString()}</span>
                  ),
                },
                {
                  id: 'status',
                  header: 'Status',
                  defaultWidth: 100,
                  minWidth: 80,
                  render: (quote) => (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                  ),
                },
                {
                  id: 'date',
                  header: 'Date',
                  defaultWidth: 110,
                  minWidth: 80,
                  render: (quote) => (
                    <span className="text-[11px] text-gray-500">{format(new Date(quote.quote_date), 'MMM dd, yyyy')}</span>
                  ),
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  defaultWidth: 100,
                  minWidth: 80,
                  align: 'right',
                  render: (quote) => (
                    <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                      {(currentMembership?.role === 'owner' || currentMembership?.role === 'admin') && (
                        <button onClick={(e) => handleDelete(e, quote.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded opacity-60 hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                        </button>
                      )}
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-60 hover:opacity-100">
                        <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
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
            <Card className="hidden md:block overflow-hidden p-0">
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
                      Quote #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Date
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
                  {filteredQuotes.map((quote, index) => (
                    <tr
                      key={quote.id}
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                      className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-slate-100 dark:border-gray-700"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedQuotes.has(quote.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectQuote(quote.id);
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
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg flex items-center justify-center mr-3">
                            <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{quote.quote_number}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">v{quote.version}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{quote.customer_name}</p>
                        {quote.customer_email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{quote.customer_email}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(quote.quote_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${quote.total_amount.toLocaleString()}
                        </p>
                        {quote.subtotal !== quote.total_amount && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ${quote.subtotal.toLocaleString()} + tax
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 text-xs rounded-lg font-semibold border ${getStatusColor(quote.status)}`}>
                          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          {(currentMembership?.role === 'owner' || currentMembership?.role === 'admin') && (
                            <button
                              onClick={(e) => handleDelete(e, quote.id)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors group"
                            >
                              <Trash2 size={16} className="text-gray-400 group-hover:text-red-600 transition-colors" />
                            </button>
                          )}
                          <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                            <MoreVertical size={16} className="text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 pb-20">
              {filteredQuotes.map((quote) => (
                <div
                  key={quote.id}
                  onClick={() => navigate(`/quotes/${quote.id}`)}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-[0.98] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mr-3">
                        <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{quote.quote_number}</h3>
                        <p className="text-xs text-gray-500">v{quote.version}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{quote.customer_name}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{format(new Date(quote.quote_date), 'MMM dd, yyyy')}</span>
                      <span className="font-bold text-lg text-gray-900 dark:text-white">${quote.total_amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-50 dark:border-gray-700">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/quotes/${quote.id}`); }}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
                    >
                      View Details
                    </button>
                    {(currentMembership?.role === 'owner' || currentMembership?.role === 'admin') && (
                      <button
                        onClick={(e) => handleDelete(e, quote.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
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

      {
        selectedQuotes.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 px-6 py-4">
              <div className="flex items-center gap-6">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {selectedQuotes.size} selected
                </span>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={bulkMarkAccepted}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Accepted
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
                      setSelectedQuotes(new Set());
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
        )
      }

      {/* Report Generator Modal */}
      <ReportGenerator
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        defaultType="quotes"
      />
    </PageContainer >
  );
}
