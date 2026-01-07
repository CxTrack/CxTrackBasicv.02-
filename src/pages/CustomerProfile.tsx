import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, Mail, Phone, Calendar,
  FileText, MessageSquare, CheckSquare, Activity, DollarSign,
  Plus, MoreVertical, Send, X, RefreshCw, Users, Trash2, Edit2
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
import type { Customer } from '@/types/database.types';
import type { Quote, Invoice } from '@/types/app.types';
import type { Task } from '@/stores/taskStore';

type TabType = 'overview' | 'communications' | 'documents' | 'tasks' | 'activity';

export const CustomerProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentCustomer,
    fetchCustomerById,
    loading,
    notes,
    fetchNotes,
    addNote: addNoteStore,
    updateNote: updateNoteStore,
    deleteNote: deleteNoteStore,
    contacts,
    fetchContacts,
    addContact,
    deleteContact
  } = useCustomerStore();
  const { quotes, fetchQuotes } = useQuoteStore();
  const { invoices, fetchInvoices } = useInvoiceStore();
  const { fetchTasks } = useTaskStore();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchCustomerById(id);
      fetchNotes(id);
      fetchContacts(id);
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

  const customerQuotes = quotes.filter((q: Quote) => q.customer_id === id);
  const customerInvoices = invoices.filter((inv: Invoice) => inv.customer_id === id);
  const totalValue = customerInvoices.reduce((sum: number, inv: Invoice) => sum + inv.total_amount, 0);
  const pendingInvoices = customerInvoices.filter((inv: Invoice) => inv.status !== 'paid').reduce((sum: number, inv: Invoice) => sum + inv.amount_due, 0);

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

        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-sm">
                {currentCustomer.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {currentCustomer.name}
                  </h1>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${currentCustomer.status === 'Active'
                    ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                    {currentCustomer.status}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs mt-0.5">
                  {currentCustomer.email && (
                    <a href={`mailto:${currentCustomer.email}`} className="text-gray-500 hover:text-primary-600 flex items-center">
                      <Mail size={12} className="mr-1" /> {currentCustomer.email}
                    </a>
                  )}
                  {currentCustomer.phone && (
                    <span className="text-gray-500 flex items-center">
                      <Phone size={12} className="mr-1" /> {currentCustomer.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-6 mr-6 border-r border-gray-100 dark:border-gray-700 pr-6">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">Value</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">${totalValue.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">Quotes</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{customerQuotes.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">Pending</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">${pendingInvoices.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Send size={18} />
                </button>
                <Link
                  to={`/customers/${id}/edit`}
                  className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  <Edit size={16} className="mr-2" />
                  Edit Profile
                </Link>
              </div>
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
                  className={`flex items-center py-4 border-b-2 transition-colors ${activeTab === tab.id
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
            onAddNote={() => {
              setEditingNote(null);
              setShowNoteModal(true);
            }}
            onEditNote={(note) => {
              setEditingNote(note);
              setShowNoteModal(true);
            }}
            onDeleteNote={async (id) => {
              if (confirm('Are you sure you want to delete this note?')) {
                await deleteNoteStore(id);
                toast.success('Note deleted');
              }
            }}
            notes={notes}
            contacts={contacts}
            onAddContact={addContact}
            onDeleteContact={deleteContact}
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

      {showNoteModal && (
        <NoteModal
          isOpen={showNoteModal}
          onClose={() => {
            setShowNoteModal(false);
            setEditingNote(null);
          }}
          customer={currentCustomer}
          note={editingNote}
          onSave={async (data) => {
            if (editingNote) {
              await updateNoteStore(editingNote.id, data);
              toast.success('Note updated');
            } else {
              await addNoteStore(data);
              toast.success('Note added');
            }
            setShowNoteModal(false);
            setEditingNote(null);
          }}
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
  onAddNote,
  onEditNote,
  onDeleteNote,
  notes,
  contacts,
  onAddContact: _onAddContact,
  onDeleteContact
}: {
  customer: any;
  quotes: any[];
  invoices: any[];
  onScheduleMeeting: () => void;
  onCreateQuote: () => void;
  onCreateInvoice: () => void;
  onAddTask: () => void;
  onAddNote: () => void;
  onEditNote: (note: any) => void;
  onDeleteNote: (id: string) => void;
  notes: any[];
  contacts: any[];
  onAddContact: (contact: any) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
}) {
  const isBusinessCustomer = customer.customer_type === 'business' || customer.type === 'Business';

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
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

        {/* Contacts Section - Only for Business Customers */}
        {isBusinessCustomer && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Team Contacts ({contacts.length})
                </h2>
              </div>
            </div>

            {contacts.length === 0 ? (
              <div className="text-center py-8">
                <Users size={40} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No contacts added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-primary-500/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold">
                        {contact.name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
                          {contact.is_primary && (
                            <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 text-xs font-medium rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        {contact.title && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{contact.title}</p>
                        )}
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-primary-600">
                              <Mail size={12} /> {contact.email}
                            </a>
                          )}
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={12} /> {formatPhoneDisplay(contact.phone)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Remove this contact?')) {
                          onDeleteContact(contact.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                    <span className={`text-xs px-2 py-1 rounded-full ${quote.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
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
                    <span className={`text-xs px-2 py-1 rounded-full ${invoice.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
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

          {notes && notes.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
              {notes.map((note) => (
                <div key={note.id} className="group p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-primary-500/50 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-gray-800 dark:text-gray-200 flex-1 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditNote(note)}
                        className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {format(new Date(note.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-lg">
              <p className="text-[11px] text-gray-500">No notes yet</p>
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
            {customer.tags && (customer.tags as string[]).map((tag, idx) => (
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

function CommunicationsTab({ customer: _customer }: { customer: Customer }) {
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

function DocumentsTab({ customer: _customer }: { customer: Customer }) {
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

function TasksTab({ customer, onAddTask }: { customer: Customer; onAddTask: () => void }) {
  const { getTasksByCustomer } = useTaskStore();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { fetchTasks } = useTaskStore();

  const customerTasks = getTasksByCustomer(customer.id);
  const pendingTasks = customerTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = customerTasks.filter(t => t.status === 'completed');

  const handleTaskClick = (task: Task) => {
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
                            <span className={`w-2 h-2 rounded-full ${task.priority === 'urgent' ? 'bg-red-500' :
                              task.priority === 'high' ? 'bg-orange-500' :
                                task.priority === 'medium' ? 'bg-yellow-500' :
                                  'bg-green-500'
                              }`} />
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${task.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
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

function ActivityTab({ customer }: { customer: Customer }) {
  const { getEventsByCustomer } = useCalendarStore();
  const { getTasksByCustomer } = useTaskStore();
  const { quotes } = useQuoteStore();
  const { invoices } = useInvoiceStore();

  const customerEvents = getEventsByCustomer(customer.id);
  const customerTasks = getTasksByCustomer(customer.id);
  const customerQuotes = quotes.filter(q => q.customer_id === customer.id);
  const customerInvoices = invoices.filter(inv => inv.customer_id === customer.id);

  interface ActivityItem {
    type: string;
    title: string;
    description?: string | null;
    date: Date;
    status?: string | null;
    [key: string]: any;
  }

  const allActivities: ActivityItem[] = [
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
      description: 'Initial record created',
      date: new Date(customer.created_at),
      status: null,
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
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${activity.status === 'scheduled' || activity.status === 'pending'
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

function ScheduleMeetingModal({ isOpen, onClose, customer }: { isOpen: boolean; onClose: () => void; customer: Customer }) {
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

      const newEvent = await createEvent(eventData as any);

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



function NoteModal({
  isOpen,
  onClose,
  customer,
  note,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  note?: any;
  onSave: (data: any) => Promise<void>
}) {
  const [content, setContent] = useState(note?.content || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note) setContent(note.content);
    else setContent('');
  }, [note]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await onSave({
        customer_id: customer.id,
        content: content.trim()
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {note ? 'Edit Note' : 'Add Note'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            placeholder="Type your note here..."
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
