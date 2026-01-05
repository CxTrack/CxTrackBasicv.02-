import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, Mail, Phone, MapPin, Building, Calendar,
  FileText, MessageSquare, CheckSquare, Activity, DollarSign,
  Plus, MoreVertical, Send, X, RefreshCw, Users
} from 'lucide-react';
import { format } from 'date-fns';
import { useCustomerStore } from '@/stores/customerStore';
import { useQuoteStore } from '@/stores/quoteStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { useCalendarStore } from '@/stores/calendarStore';
import { useTaskStore } from '@/stores/taskStore';
import { formatPhoneDisplay } from '@/utils/phone.utils';
import TimePickerButtons from '@/components/shared/TimePickerButtons';
import DurationPicker from '@/components/shared/DurationPicker';
import TaskModal from '@/components/tasks/TaskModal';
import toast from 'react-hot-toast';

type TabType = 'overview' | 'communications' | 'documents' | 'tasks' | 'activity';

export const CustomerProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCustomer, fetchCustomerById, loading } = useCustomerStore();
  const { quotes, fetchQuotes } = useQuoteStore();
  const { invoices, fetchInvoices } = useInvoiceStore();
  const { tasks, fetchTasks, getTasksByCustomer } = useTaskStore();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCustomerById(id);
      fetchQuotes();
      fetchInvoices();
      fetchTasks();
    }
  }, [id]);

  if (loading || !currentCustomer) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const customerQuotes = quotes.filter(q => q.customer_id === id);
  const customerInvoices = invoices.filter(inv => inv.customer_id === id);
  const totalValue = customerInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const pendingInvoices = customerInvoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.amount_due, 0);

  const handleScheduleMeeting = () => {
    setShowScheduleModal(true);
  };

  const handleCreateQuote = () => {
    navigate(`/quotes/builder?customer=${id}`);
  };

  const handleCreateInvoice = () => {
    navigate(`/invoices/builder?customer=${id}`);
  };

  const handleAddTask = () => {
    setShowAddTaskModal(true);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/customers')}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Customers
            </button>

            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <MoreVertical size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {currentCustomer.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentCustomer.name}
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    currentCustomer.status === 'Active'
                      ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {currentCustomer.status}
                  </span>
                </div>

                {currentCustomer.company && (
                  <p className="text-gray-600 dark:text-gray-400 mb-3 flex items-center">
                    <Building size={16} className="mr-2" />
                    {currentCustomer.company}
                  </p>
                )}

                <div className="flex items-center space-x-4 text-sm">
                  {currentCustomer.email && (
                    <a
                      href={`mailto:${currentCustomer.email}`}
                      className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <Mail size={16} className="mr-1.5" />
                      {currentCustomer.email}
                    </a>
                  )}
                  {currentCustomer.phone && (
                    <a
                      href={`tel:${currentCustomer.phone}`}
                      className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <Phone size={16} className="mr-1.5" />
                      {currentCustomer.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Send size={16} className="mr-2" />
                Email
              </button>
              <Link
                to={`/customers/${id}/edit`}
                className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <Edit size={16} className="mr-2" />
                Edit
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Open Quotes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{customerQuotes.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Invoices</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${pendingInvoices.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Contact</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentCustomer.last_contact_date ? format(new Date(currentCustomer.last_contact_date), 'MMM d') : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6">
          <div className="flex items-center space-x-8 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'communications', label: 'Communications', icon: MessageSquare },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare },
              { id: 'activity', label: 'Activity', icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={18} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <OverviewTab
            customer={currentCustomer}
            quotes={customerQuotes}
            invoices={customerInvoices}
            onScheduleMeeting={handleScheduleMeeting}
            onCreateQuote={handleCreateQuote}
            onCreateInvoice={handleCreateInvoice}
            onAddTask={handleAddTask}
            onAddNote={() => setShowAddNoteModal(true)}
          />
        )}
        {activeTab === 'communications' && <CommunicationsTab customer={currentCustomer} />}
        {activeTab === 'documents' && <DocumentsTab customer={currentCustomer} />}
        {activeTab === 'tasks' && <TasksTab customer={currentCustomer} onAddTask={handleAddTask} />}
        {activeTab === 'activity' && <ActivityTab customer={currentCustomer} />}
      </div>

      {/* Modals */}
      {showScheduleModal && (
        <ScheduleMeetingModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          customer={currentCustomer}
        />
      )}

      {showAddTaskModal && (
        <TaskModal
          isOpen={showAddTaskModal}
          onClose={() => {
            setShowAddTaskModal(false);
            fetchTasks();
          }}
          customerId={currentCustomer.id}
          customerName={currentCustomer.name}
        />
      )}

      {showAddNoteModal && (
        <AddNoteModal
          isOpen={showAddNoteModal}
          onClose={() => setShowAddNoteModal(false)}
          customer={currentCustomer}
        />
      )}
    </div>
  );
};

function OverviewTab({
  customer,
  quotes,
  invoices,
  onScheduleMeeting,
  onCreateQuote,
  onCreateInvoice,
  onAddTask,
  onAddNote
}: {
  customer: any;
  quotes: any[];
  invoices: any[];
  onScheduleMeeting: () => void;
  onCreateQuote: () => void;
  onCreateInvoice: () => void;
  onAddTask: () => void;
  onAddNote: () => void;
}) {
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contact Information
            </h2>
            <Link to={`/customers/${customer.id}/edit`} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              Edit
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
              <p className="text-gray-900 dark:text-white">{customer.email || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</p>
              <p className="text-gray-900 dark:text-white">{formatPhoneDisplay(customer.phone) || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Address</p>
              <p className="text-gray-900 dark:text-white">{customer.address || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Customer Since</p>
              <p className="text-gray-900 dark:text-white">
                {customer.created_at ? format(new Date(customer.created_at), 'MMM d, yyyy') : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Quotes
            </h2>
            <Link
              to={`/quotes/builder?customer=${customer.id}`}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              New Quote
            </Link>
          </div>

          {quotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 dark:text-gray-400">No quotes yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.slice(0, 5).map((quote) => (
                <Link
                  key={quote.id}
                  to={`/quotes/${quote.id}`}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{quote.quote_number}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(quote.quote_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">${quote.total_amount.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      quote.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                      quote.status === 'sent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {quote.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Invoices
            </h2>
            <Link
              to={`/invoices/builder?customer=${customer.id}`}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              New Invoice
            </Link>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 dark:text-gray-400">No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <Link
                  key={invoice.id}
                  to={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{invoice.invoice_number}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">${invoice.total_amount.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button
              onClick={onScheduleMeeting}
              className="w-full flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
            >
              <Calendar size={16} className="mr-3 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">Schedule Meeting</span>
            </button>
            <button
              onClick={onCreateQuote}
              className="w-full flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
            >
              <FileText size={16} className="mr-3 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">Create Quote</span>
            </button>
            <button
              onClick={onCreateInvoice}
              className="w-full flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
            >
              <DollarSign size={16} className="mr-3 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">Create Invoice</span>
            </button>
            <button
              onClick={onAddTask}
              className="w-full flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
            >
              <CheckSquare size={16} className="mr-3 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">Add Task</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notes
            </h3>
            <button
              onClick={onAddNote}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              Add Note
            </button>
          </div>

          {customer.notes ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">{customer.notes}</p>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">No notes yet</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Tags
            </h3>
            <button className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
              Add Tag
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded text-xs">
              {customer.customer_type}
            </span>
            {customer.tags && customer.tags.map((tag: string, idx: number) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunicationsTab({ customer }: { customer: any }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-12">
          <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No communications yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Emails, calls, and meetings will appear here
          </p>
          <button className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
            Log Communication
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({ customer }: { customer: any }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Documents
          </h2>
          <button className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
            <Plus size={16} className="mr-2" />
            Upload Document
          </button>
        </div>

        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No documents uploaded yet
          </p>
        </div>
      </div>
    </div>
  );
}

function TasksTab({ customer, onAddTask }: { customer: any; onAddTask: () => void }) {
  const { getTasksByCustomer } = useTaskStore();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const { fetchTasks } = useTaskStore();

  const customerTasks = getTasksByCustomer(customer.id);
  const pendingTasks = customerTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = customerTasks.filter(t => t.status === 'completed');

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const getTaskIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      call: Phone,
      email: Mail,
      sms: MessageSquare,
      follow_up: RefreshCw,
      meeting: Users,
      other: FileText,
    };
    return icons[type] || FileText;
  };

  const getTaskTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      call: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
      email: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
      sms: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
      follow_up: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',
      meeting: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400',
      other: 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400',
    };
    return colors[type] || colors.other;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tasks ({customerTasks.length})
          </h2>
          <button
            onClick={onAddTask}
            className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Add Task
          </button>
        </div>

        {customerTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No tasks for this customer
            </p>
            <button
              onClick={onAddTask}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm"
            >
              Create First Task
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Pending ({pendingTasks.length})
                </h3>
                <div className="space-y-2">
                  {pendingTasks.map(task => {
                    const TaskIcon = getTaskIcon(task.type);
                    const typeColor = getTaskTypeColor(task.type);

                    return (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColor}`}>
                            <TaskIcon size={18} />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {task.title}
                              </h4>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${typeColor}`}>
                                {task.type.replace('_', ' ')}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              task.priority === 'urgent' ? 'bg-red-500' :
                              task.priority === 'high' ? 'bg-orange-500' :
                              task.priority === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`} />
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              task.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                            }`}>
                              {task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {completedTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Completed ({completedTasks.length})
                </h3>
                <div className="space-y-2">
                  {completedTasks.map(task => {
                    const TaskIcon = getTaskIcon(task.type);
                    const typeColor = getTaskTypeColor(task.type);

                    return (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer opacity-75"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 opacity-50 ${typeColor}`}>
                            <TaskIcon size={18} />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white line-through">
                                {task.title}
                              </h4>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded opacity-50 ${typeColor}`}>
                                {task.type.replace('_', ' ')}
                              </span>
                            </div>
                            {task.outcome && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <strong>Outcome:</strong> {task.outcome}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                              <span>Completed: {format(new Date(task.completed_at || task.updated_at), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>

                          <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex-shrink-0">
                            Completed
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
            fetchTasks();
          }}
          task={selectedTask}
          customerId={customer.id}
          customerName={customer.name}
        />
      )}
    </div>
  );
}

function ActivityTab({ customer }: { customer: any }) {
  const { getEventsByCustomer } = useCalendarStore();
  const { getTasksByCustomer } = useTaskStore();
  const { quotes } = useQuoteStore();
  const { invoices } = useInvoiceStore();

  const customerEvents = getEventsByCustomer(customer.id);
  const customerTasks = getTasksByCustomer(customer.id);
  const customerQuotes = quotes.filter(q => q.customer_id === customer.id);
  const customerInvoices = invoices.filter(inv => inv.customer_id === customer.id);

  const allActivities = [
    ...customerEvents.map(event => ({
      type: 'event',
      title: event.title,
      description: event.description,
      date: new Date(event.start_time),
      status: event.status,
      event,
    })),
    ...customerTasks.map(task => ({
      type: 'task',
      title: `Task: ${task.title}`,
      description: task.description,
      date: new Date(task.created_at),
      status: task.status,
      priority: task.priority,
      taskType: task.type,
    })),
    ...customerQuotes.map(quote => ({
      type: 'quote',
      title: `Quote #${quote.quote_number}`,
      description: `Total: $${quote.total_amount.toFixed(2)}`,
      date: new Date(quote.created_at),
      status: quote.status,
    })),
    ...customerInvoices.map(invoice => ({
      type: 'invoice',
      title: `Invoice #${invoice.invoice_number}`,
      description: `Total: $${invoice.total_amount.toFixed(2)}`,
      date: new Date(invoice.created_at),
      status: invoice.status,
    })),
    {
      type: 'created',
      title: 'Customer created',
      date: new Date(customer.created_at),
    },
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Activity Timeline
        </h2>

        <div className="space-y-4">
          {allActivities.map((activity, index) => {
            const getActivityIcon = () => {
              switch (activity.type) {
                case 'event':
                  return { icon: Calendar, bg: 'bg-blue-100 dark:bg-blue-900/20', color: 'text-blue-600 dark:text-blue-400' };
                case 'task':
                  return { icon: CheckSquare, bg: 'bg-teal-100 dark:bg-teal-900/20', color: 'text-teal-600 dark:text-teal-400' };
                case 'quote':
                  return { icon: FileText, bg: 'bg-purple-100 dark:bg-purple-900/20', color: 'text-purple-600 dark:text-purple-400' };
                case 'invoice':
                  return { icon: DollarSign, bg: 'bg-green-100 dark:bg-green-900/20', color: 'text-green-600 dark:text-green-400' };
                default:
                  return { icon: Activity, bg: 'bg-primary-100 dark:bg-primary-900/20', color: 'text-primary-600 dark:text-primary-400' };
              }
            };

            const { icon: Icon, bg, color } = getActivityIcon();

            return (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <Icon size={14} className={color} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {activity.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {format(activity.date, 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                    {activity.status && (
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                        activity.status === 'scheduled' || activity.status === 'pending'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : activity.status === 'completed' || activity.status === 'paid'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : activity.status === 'in_progress'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : activity.status === 'draft' || activity.status === 'sent'
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {activity.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {allActivities.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No activity recorded yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ScheduleMeetingModal({ isOpen, onClose, customer }: { isOpen: boolean; onClose: () => void; customer: any }) {
  const { createEvent } = useCalendarStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: `Meeting with ${customer.name}`,
    date: new Date().toISOString().split('T')[0],
    time: '09:00 AM',
    duration: 30,
  });

  const convertTo24Hour = (time12h: string) => {
    const match = time12h.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return '';

    let [, hours, minutes, period] = match;
    let hour = parseInt(hours);

    if (period.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }

    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  const calculateEndTime = () => {
    const match = formData.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return '';

    let [, hours, minutes, period] = match;
    let hour = parseInt(hours);

    if (period.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }

    const startMinutes = hour * 60 + parseInt(minutes);
    const endMinutes = startMinutes + formData.duration;
    const endHour = Math.floor(endMinutes / 60) % 24;
    const endMin = endMinutes % 60;

    const endAmPm = endHour >= 12 ? 'PM' : 'AM';
    const endHour12 = endHour % 12 || 12;

    return `${endHour12}:${endMin.toString().padStart(2, '0')} ${endAmPm}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      console.log('💾 Saving meeting to calendar...');

      const startTime24 = convertTo24Hour(formData.time);
      const startDateTime = `${formData.date}T${startTime24}:00`;

      const endTime24 = convertTo24Hour(calculateEndTime());
      const endDateTime = `${formData.date}T${endTime24}:00`;

      const eventData = {
        title: formData.title,
        description: `Meeting with ${customer.name}`,
        event_type: 'meeting' as const,
        start_time: startDateTime,
        end_time: endDateTime,
        customer_id: customer.id,
        location: '',
        meeting_url: null,
        status: 'scheduled' as const,
        is_recurring: false,
        recurrence_rule: null,
        attendees: [],
        color_code: '#10b981',
      };

      const newEvent = await createEvent(eventData);

      if (newEvent) {
        console.log('✅ Meeting scheduled:', newEvent);
        toast.success('Meeting scheduled successfully!');
        onClose();
      } else {
        throw new Error('Failed to create event');
      }
    } catch (error: any) {
      console.error('❌ Error scheduling meeting:', error);
      setError(error.message || 'Failed to schedule meeting');
      toast.error('Failed to schedule meeting');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Schedule Meeting
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <TimePickerButtons
            selectedTime={formData.time}
            onTimeChange={(time) => setFormData({ ...formData, time })}
            label="Start Time *"
          />

          <DurationPicker
            duration={formData.duration}
            onDurationChange={(duration) => setFormData({ ...formData, duration })}
          />

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-4 py-3 rounded-lg">
            <Calendar size={16} />
            <span>
              {formData.date ? format(new Date(formData.date), 'MMM d, yyyy') : 'Select a date'} • {formData.time} - {calculateEndTime()}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddTaskModal({ isOpen, onClose, customer }: { isOpen: boolean; onClose: () => void; customer: any }) {
  const [formData, setFormData] = useState({
    title: '',
    due_date: '',
    priority: 'medium',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add Task
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Task Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Follow up with customer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
}

function AddNoteModal({ isOpen, onClose, customer }: { isOpen: boolean; onClose: () => void; customer: any }) {
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add Note
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Add a note about this customer..."
          />
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}
