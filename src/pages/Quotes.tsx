import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Plus, Filter, FileText, DollarSign,
  TrendingUp, Clock, MoreVertical, Edit,
  Send, CheckCircle, XCircle, Copy, Archive, CheckCircle2, Trash2
} from 'lucide-react';
import { useQuoteStore } from '../stores/quoteStore';
import { useOrganizationStore } from '../stores/organizationStore';
import { useThemeStore } from '../stores/themeStore';
import { PageContainer, Card } from '../components/theme/ThemeComponents';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { QuoteStatus } from '../types/app.types';

export default function Quotes() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | QuoteStatus>('all');
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const { quotes, loading, fetchQuotes } = useQuoteStore();
  const { currentOrganization, demoMode, getOrganizationId } = useOrganizationStore();
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
      <Card className="border-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Quotes
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Create and manage customer quotes
              </p>
            </div>
            <Link
              to="/quotes/builder"
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              <Plus size={20} className="mr-2" />
              New Quote
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className={theme === 'soft-modern' ? "rounded-xl p-4 bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)]" : "bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
                <DollarSign size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalValue.toLocaleString()}
              </p>
            </div>

            <div className={theme === 'soft-modern' ? "rounded-xl p-4 bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)]" : "bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                <Clock size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sentCount}</p>
            </div>

            <div className={theme === 'soft-modern' ? "rounded-xl p-4 bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)]" : "bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Accepted</span>
                <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.acceptedCount}</p>
            </div>

            <div className={theme === 'soft-modern' ? "rounded-xl p-4 bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)]" : "bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</span>
                <TrendingUp size={18} className="text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.conversionRate.toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search quotes by number, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
              {(['all', 'draft', 'sent', 'accepted', 'declined'] as const).map((status) => (
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
        ) : (
          <Card className="overflow-hidden p-0">
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
                        <Link
                          to={`/quotes/builder/${quote.id}`}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <Edit size={16} className="text-gray-600 dark:text-gray-400" />
                        </Link>
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
        )}
      </div>

      {selectedQuotes.size > 0 && (
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
      )}
    </PageContainer>
  );
}
