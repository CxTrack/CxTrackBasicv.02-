import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';
import { useQuoteStore } from '@/stores/quoteStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { useCustomerStore } from '@/stores/customerStore';
import {
  Plus, Search, FileText, DollarSign, TrendingUp,
  LayoutGrid, List, Columns, MoreVertical, Send, Mouse
} from 'lucide-react';
import { Card, PageContainer, IconBadge } from '@/components/theme/ThemeComponents';
import { ResizableTable, ColumnDef } from '@/components/compact/ResizableTable';

interface PipelineItem {
  id: string;
  type: 'quote' | 'invoice';
  number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  stage: string;
  probability: number;
}

type ViewMode = 'kanban' | 'table' | 'split';
type SortField = 'customer' | 'amount' | 'stage' | 'probability' | 'date';
type SortDirection = 'asc' | 'desc';

const STAGES = [
  { id: 'lead', name: 'Lead', probability: 0.1, color: 'bg-slate-100 text-slate-700' },
  { id: 'qualified', name: 'Qualified', probability: 0.25, color: 'bg-blue-100 text-blue-700' },
  { id: 'proposal', name: 'Proposal', probability: 0.5, color: 'bg-purple-100 text-purple-700' },
  { id: 'negotiation', name: 'Negotiation', probability: 0.75, color: 'bg-orange-100 text-orange-700' },
  { id: 'won', name: 'Won', probability: 1, color: 'bg-green-100 text-green-700' },
  { id: 'lost', name: 'Lost', probability: 0, color: 'bg-red-100 text-red-700' },
];

const getStageColor = (stage: string) => {
  const colors: Record<string, string> = {
    'negotiation': 'bg-orange-100 text-orange-700 border-orange-200',
    'proposal': 'bg-purple-100 text-purple-700 border-purple-200',
    'qualified': 'bg-blue-100 text-blue-700 border-blue-200',
    'lead': 'bg-slate-100 text-slate-700 border-slate-200',
    'won': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'lost': 'bg-red-100 text-red-700 border-red-200',
  };
  return colors[stage] || 'bg-slate-100 text-slate-700 border-slate-200';
};

const Pipeline: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { quotes, fetchQuotes } = useQuoteStore();
  const { invoices, fetchInvoices } = useInvoiceStore();
  const { customers, fetchCustomers } = useCustomerStore();

  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [selectedItem, setSelectedItem] = useState<PipelineItem | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        const quotesJSON = localStorage.getItem('cxtrack_demo_quotes');
        const invoicesJSON = localStorage.getItem('cxtrack_demo_invoices');
        const customersJSON = localStorage.getItem('cxtrack_demo_customers');

        const localQuotes = quotesJSON ? JSON.parse(quotesJSON) : [];
        const localInvoices = invoicesJSON ? JSON.parse(invoicesJSON) : [];
        const localCustomers = customersJSON ? JSON.parse(customersJSON) : [];

        const pipelineItems: PipelineItem[] = [];

        localQuotes.forEach((quote: any) => {
          if (['sent', 'viewed', 'draft'].includes(quote.status)) {
            const customer = localCustomers.find((c: any) => c.id === quote.customer_id);
            pipelineItems.push({
              id: quote.id,
              type: 'quote',
              number: quote.quote_number,
              customer_name: customer?.name || 'Unknown',
              customer_email: customer?.email || '',
              total_amount: quote.total_amount,
              status: quote.status,
              created_at: quote.created_at,
              stage: 'proposal',
              probability: 0.5,
            });
          }
        });

        localInvoices.forEach((invoice: any) => {
          if (['sent', 'viewed', 'draft'].includes(invoice.status)) {
            const customer = localCustomers.find((c: any) => c.id === invoice.customer_id);
            pipelineItems.push({
              id: invoice.id,
              type: 'invoice',
              number: invoice.invoice_number,
              customer_name: customer?.name || 'Unknown',
              customer_email: customer?.email || '',
              total_amount: invoice.total_amount,
              status: invoice.status,
              created_at: invoice.created_at,
              stage: 'negotiation',
              probability: 0.75,
            });
          } else if (invoice.status === 'paid') {
            const customer = localCustomers.find((c: any) => c.id === invoice.customer_id);
            pipelineItems.push({
              id: invoice.id,
              type: 'invoice',
              number: invoice.invoice_number,
              customer_name: customer?.name || 'Unknown',
              customer_email: customer?.email || '',
              total_amount: invoice.total_amount,
              status: invoice.status,
              created_at: invoice.created_at,
              stage: 'won',
              probability: 1,
            });
          }
        });

        pipelineItems.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setItems(pipelineItems);
      } catch (error) {
        console.error('Error loading pipeline data from localStorage:', error);
      }

      await Promise.all([fetchQuotes(), fetchInvoices(), fetchCustomers()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (quotes.length > 0 || invoices.length > 0) {
      const pipelineItems: PipelineItem[] = [];

      quotes?.forEach(quote => {
        if (['sent', 'viewed', 'draft'].includes(quote.status)) {
          const customer = customers.find(c => c.id === quote.customer_id);
          pipelineItems.push({
            id: quote.id,
            type: 'quote',
            number: quote.quote_number,
            customer_name: customer?.name || 'Unknown',
            customer_email: customer?.email || '',
            total_amount: quote.total_amount,
            status: quote.status,
            created_at: quote.created_at,
            stage: 'proposal',
            probability: 0.5,
          });
        }
      });

      invoices.forEach(invoice => {
        if (['sent', 'viewed', 'draft'].includes(invoice.status)) {
          const customer = customers.find(c => c.id === invoice.customer_id);
          pipelineItems.push({
            id: invoice.id,
            type: 'invoice',
            number: invoice.invoice_number,
            customer_name: customer?.name || 'Unknown',
            customer_email: customer?.email || '',
            total_amount: invoice.total_amount,
            status: invoice.status,
            created_at: invoice.created_at,
            stage: 'negotiation',
            probability: 0.75,
          });
        } else if (invoice.status === 'paid') {
          const customer = customers.find(c => c.id === invoice.customer_id);
          pipelineItems.push({
            id: invoice.id,
            type: 'invoice',
            number: invoice.invoice_number,
            customer_name: customer?.name || 'Unknown',
            customer_email: customer?.email || '',
            total_amount: invoice.total_amount,
            status: invoice.status,
            created_at: invoice.created_at,
            stage: 'won',
            probability: 1,
          });
        }
      });

      pipelineItems.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      if (pipelineItems.length > 0) {
        setItems(pipelineItems);
      }
    }
  }, [quotes, invoices, customers]);

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = selectedStage === 'all' || item.stage === selectedStage;

    return matchesSearch && matchesStage;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'customer':
        comparison = a.customer_name.localeCompare(b.customer_name);
        break;
      case 'amount':
        comparison = a.total_amount - b.total_amount;
        break;
      case 'stage':
        comparison = a.stage.localeCompare(b.stage);
        break;
      case 'probability':
        comparison = a.probability - b.probability;
        break;
      case 'date':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const totalValue = filteredItems.reduce((sum, item) => sum + item.total_amount, 0);
  const weightedValue = filteredItems.reduce((sum, item) => sum + (item.total_amount * item.probability), 0);

  const groupedByStage = STAGES.map(stage => ({
    ...stage,
    items: filteredItems.filter(item => item.stage === stage.id),
  }));

  const pipelineColumns: ColumnDef<PipelineItem>[] = [
    {
      id: 'deal',
      header: 'Deal',
      defaultWidth: 250,
      minWidth: 200,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${item.type === 'quote' ? 'bg-purple-500' : 'bg-blue-500'}`} />
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              {item.number}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {item.type}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      defaultWidth: 200,
      minWidth: 150,
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white truncate">
            {item.customer_name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {item.customer_email}
          </p>
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      defaultWidth: 120,
      minWidth: 100,
      render: (item) => (
        <div className="text-right font-bold text-slate-900 dark:text-white">
          ${item.total_amount.toLocaleString()}
        </div>
      ),
    },
    {
      id: 'stage',
      header: 'Stage',
      defaultWidth: 140,
      minWidth: 100,
      render: (item) => (
        <div className="flex justify-center">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStageColor(item.stage)}`}>
            {item.stage}
          </span>
        </div>
      ),
    },
    {
      id: 'probability',
      header: 'Probability',
      defaultWidth: 160,
      minWidth: 120,
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${item.probability >= 0.75 ? 'bg-green-500' :
                item.probability >= 0.5 ? 'bg-blue-500' :
                  item.probability >= 0.25 ? 'bg-orange-500' : 'bg-slate-400'
                }`}
              style={{ width: `${item.probability * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-8 text-right">
            {Math.round(item.probability * 100)}%
          </span>
        </div>
      ),
    },
    {
      id: 'created',
      header: 'Created',
      defaultWidth: 120,
      minWidth: 100,
      render: (item) => (
        <div className="text-sm text-slate-600 dark:text-slate-400 text-right">
          {new Date(item.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      defaultWidth: 100,
      minWidth: 80,
      render: (item) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/${item.type === 'quote' ? 'quotes' : 'invoices'}/${item.id}`);
            }}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-blue-600"
          >
            <FileText size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // More actions
            }}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-slate-600"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer className="gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sales Pipeline
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track quotes and invoices through your sales process
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2 ${viewMode === 'kanban'
                ? 'bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`hidden md:flex px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all items-center gap-2 ${viewMode === 'table'
                ? 'bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`hidden md:flex px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all items-center gap-2 ${viewMode === 'split'
                ? 'bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <Columns className="w-4 h-4" />
              <span className="hidden sm:inline">Split</span>
            </button>
          </div>

          <button
            onClick={() => navigate('/quotes/builder')}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">New Quote</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hover className="flex items-center gap-4 p-4 h-24">
          <IconBadge
            icon={<FileText size={20} className="text-blue-600" />}
            gradient="bg-blue-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Items</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{filteredItems.length}</h3>
          </div>
        </Card>

        <Card hover className="flex items-center gap-4 p-4 h-24">
          <IconBadge
            icon={<DollarSign size={20} className="text-green-600" />}
            gradient="bg-green-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Value</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">${totalValue.toLocaleString()}</h3>
          </div>
        </Card>

        <Card hover className="flex items-center gap-4 p-4 h-24">
          <IconBadge
            icon={<TrendingUp size={20} className="text-purple-600" />}
            gradient="bg-purple-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Weighted Value</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">${Math.round(weightedValue).toLocaleString()}</h3>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700">
        <div className="flex bg-slate-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedStage('all')}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${selectedStage === 'all'
              ? 'bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
          >
            All Stages
          </button>
          {STAGES.map(stage => (
            <button
              key={stage.id}
              onClick={() => setSelectedStage(stage.id)}
              className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${selectedStage === stage.id
                ? 'bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              {stage.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 md:max-w-xl md:ml-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pipeline..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-gray-700 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Views */}
      {loading ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={theme === 'soft-modern' ? '' : 'text-gray-600 dark:text-gray-400'} style={theme === 'soft-modern' ? { color: '#6B6B6B' } : undefined}>Loading pipeline...</p>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className={`w-16 h-16 mx-auto mb-4 ${theme === 'soft-modern' ? '' : 'text-gray-400 dark:text-gray-500'}`} style={theme === 'soft-modern' ? { color: '#9CA3AF' } : undefined} />
          <h3 className={`text-xl font-semibold mb-2 ${theme === 'soft-modern' ? '' : 'text-gray-900 dark:text-white'}`} style={theme === 'soft-modern' ? { color: '#2D2D2D' } : undefined}>
            No pipeline items
          </h3>
          <p className={`mb-6 ${theme === 'soft-modern' ? '' : 'text-gray-600 dark:text-gray-400'}`} style={theme === 'soft-modern' ? { color: '#6B6B6B' } : undefined}>
            Create quotes and invoices to build your sales pipeline
          </p>
          <button
            onClick={() => navigate('/quotes/builder')}
            className={theme === 'soft-modern' ? "px-6 py-3 rounded-xl font-medium transition-all" : "px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"}
            style={theme === 'soft-modern' ? {
              background: 'linear-gradient(135deg, #A8C5E8, #90B5D8)',
              color: 'white',
              boxShadow: '4px 4px 8px rgba(0,0,0,0.08)'
            } : undefined}
          >
            Create Your First Quote
          </button>
        </Card>
      ) : viewMode === 'table' ? (
        <ResizableTable
          columns={pipelineColumns}
          data={sortedItems}
          onRowClick={(item) => navigate(`/${item.type === 'quote' ? 'quotes' : 'invoices'}/${item.id}`)}
          onSort={(id) => handleSort(id as any)}
          sortColumn={sortField}
          sortDirection={sortDirection}
          storageKey="pipeline-table-v1"
        />
      ) : viewMode === 'split' ? (
        <div className="grid grid-cols-12 gap-6" style={{ height: 'calc(100vh - 400px)' }}>
          <div className="col-span-12 lg:col-span-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
            <div className="bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-700 px-6 py-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">All Deals ({filteredItems.length})</h3>
            </div>
            <div className="overflow-y-auto" style={{ height: 'calc(100% - 64px)' }}>
              {sortedItems.map(item => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => setSelectedItem(item)}
                  className={`px-6 py-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-all ${selectedItem?.id === item.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600 dark:border-l-blue-500'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white mb-1">
                        {item.customer_name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {item.number}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      ${item.total_amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${getStageColor(item.stage)}`}>
                      {item.stage}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {Math.round(item.probability * 100)}% probability
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
            {selectedItem ? (
              <div className="h-full overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b-2 border-slate-200 dark:border-slate-700 px-8 py-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                        {selectedItem.type === 'invoice' ? 'Invoice' : 'Quote'}
                      </p>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {selectedItem.customer_name}
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400">
                        {selectedItem.customer_email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Deal Value</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        ${selectedItem.total_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${getStageColor(selectedItem.stage)}`}>
                      {selectedItem.stage}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-white/50 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${selectedItem.probability * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {Math.round(selectedItem.probability * 100)}% probability
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                      Deal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Number</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {selectedItem.number}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Status</p>
                        <p className="font-semibold text-slate-900 dark:text-white capitalize">
                          {selectedItem.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Created</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {new Date(selectedItem.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Type</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {selectedItem.type === 'invoice' ? 'Invoice' : 'Quote'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                      Deal Timeline
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">Deal Created</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {new Date(selectedItem.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {selectedItem.status === 'sent' && (
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                            <Send className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white">Sent to Customer</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {new Date(selectedItem.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/${selectedItem.type === 'quote' ? 'quotes' : 'invoices'}/${selectedItem.id}`)}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => navigate(`/${selectedItem.type === 'quote' ? 'quotes' : 'invoices'}/builder/${selectedItem.id}`)}
                      className="px-6 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-white"
                    >
                      Edit
                    </button>
                    <button className="p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <MoreVertical className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-8">
                <div>
                  <Mouse className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Select a deal
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Click a deal from the list to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {groupedByStage.map(stage => (
            <div key={stage.id}>
              <Card className="p-4 min-h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${theme === 'soft-modern' ? '' : 'text-gray-900 dark:text-white'}`} style={theme === 'soft-modern' ? { color: '#2D2D2D' } : undefined}>
                      {stage.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${theme === 'soft-modern' ? '' : stage.color}`} style={theme === 'soft-modern' ? {
                      background: 'rgba(168, 197, 232, 0.2)',
                      color: '#4A5F80'
                    } : undefined}>
                      {stage.items.length}
                    </span>
                  </div>
                  <span className={`text-xs ${theme === 'soft-modern' ? '' : 'text-gray-500 dark:text-gray-400'}`} style={theme === 'soft-modern' ? { color: '#9CA3AF' } : undefined}>
                    {stage.probability * 100}%
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  {stage.items.length === 0 ? (
                    <div className={`text-center py-8 border-2 border-dashed rounded-lg ${theme === 'soft-modern' ? '' : 'border-gray-200 dark:border-gray-700'}`} style={theme === 'soft-modern' ? {
                      borderColor: 'rgba(203, 213, 225, 0.3)'
                    } : undefined}>
                      <p className={`text-sm ${theme === 'soft-modern' ? '' : 'text-gray-500 dark:text-gray-400'}`} style={theme === 'soft-modern' ? { color: '#9CA3AF' } : undefined}>
                        No items
                      </p>
                    </div>
                  ) : (
                    stage.items.map(item => (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => navigate(`/${item.type === 'quote' ? 'quotes' : 'invoices'}/${item.id}`)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${theme === 'soft-modern'
                          ? ''
                          : theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 hover:border-blue-500'
                            : 'bg-white border-gray-200 hover:border-blue-500'
                          }`}
                        style={theme === 'soft-modern' ? {
                          background: 'rgba(255, 255, 255, 0.6)',
                          border: '2px solid rgba(255, 255, 255, 0.8)',
                          boxShadow: '2px 2px 4px rgba(0,0,0,0.06)',
                        } : undefined}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${item.type === 'quote'
                            ? theme === 'soft-modern' ? '' : 'bg-blue-100 text-blue-700'
                            : theme === 'soft-modern' ? '' : 'bg-purple-100 text-purple-700'
                            }`} style={theme === 'soft-modern' ? {
                              background: item.type === 'quote' ? 'rgba(168, 197, 232, 0.3)' : 'rgba(201, 184, 212, 0.3)',
                              color: item.type === 'quote' ? '#4A5F80' : '#7A6050'
                            } : undefined}>
                            {item.type === 'quote' ? 'Quote' : 'Invoice'}
                          </span>
                          <span className={`text-xs ${theme === 'soft-modern' ? '' : 'text-gray-500 dark:text-gray-400'}`} style={theme === 'soft-modern' ? { color: '#9CA3AF' } : undefined}>
                            {item.number}
                          </span>
                        </div>

                        <h4 className={`font-semibold mb-1 ${theme === 'soft-modern' ? '' : 'text-gray-900 dark:text-white'}`} style={theme === 'soft-modern' ? { color: '#2D2D2D' } : undefined}>
                          {item.customer_name}
                        </h4>
                        <p className={`text-sm mb-3 ${theme === 'soft-modern' ? '' : 'text-gray-600 dark:text-gray-400'}`} style={theme === 'soft-modern' ? { color: '#6B6B6B' } : undefined}>
                          {item.customer_email}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className={`text-lg font-bold ${theme === 'soft-modern' ? '' : 'text-gray-900 dark:text-white'}`} style={theme === 'soft-modern' ? { color: '#2D2D2D' } : undefined}>
                            ${item.total_amount.toLocaleString()}
                          </span>
                          <span className={`text-xs ${theme === 'soft-modern' ? '' : 'text-gray-500 dark:text-gray-400'}`} style={theme === 'soft-modern' ? { color: '#9CA3AF' } : undefined}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

    </PageContainer>
  );
};

export default Pipeline;
