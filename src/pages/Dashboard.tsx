import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Calendar, FileText, DollarSign, TrendingUp,
  UserPlus, CalendarPlus, FilePlus, Phone,
  ArrowRight, Activity, Package, GripVertical, CheckCircle, User,
  ArrowUpRight, Clock, ChevronRight, Plus
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCustomerStore } from '@/stores/customerStore';
import { useCallStore } from '@/stores/callStore';
import { useCalendarStore } from '@/stores/calendarStore';
import { useQuoteStore } from '@/stores/quoteStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { useProductStore } from '@/stores/productStore';
import { useThemeStore } from '@/stores/themeStore';
import { useDealStore } from '@/stores/dealStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { revenueService, RevenueStats } from '@/services/revenue.service';
import { format, formatDistanceToNow } from 'date-fns';
import CustomerModal from '@/components/customers/CustomerModal';
import EventModal from '@/components/calendar/EventModal';
import TaskModal from '@/components/tasks/TaskModal';
import { useTaskStore, Task } from '@/stores/taskStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { Card, NestedCard, Button } from '@/components/theme/ThemeComponents';

type ActivityFilter = 'all' | 'appointments' | 'quotes' | 'invoices' | 'products' | 'customers' | 'tasks';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  bgColor: string;
  iconColor: string;
}

function SortableQuickAction({ action }: { action: QuickAction }) {
  const { theme } = useThemeStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = action.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
      >
        <div className="p-1 bg-gray-200 dark:bg-gray-700 rounded shadow-sm">
          <GripVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </div>
      </div>

      <button
        onClick={action.onClick}
        className={theme === 'soft-modern' ? "w-full card p-6 text-left hover:shadow-md transition-all" : "w-full bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all group text-left"}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className={theme === 'soft-modern' ? "w-12 h-12 rounded-lg icon-container flex items-center justify-center" : `w-14 h-14 ${action.bgColor} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
          >
            <Icon size={20} className={theme === 'soft-modern' ? "icon-primary" : action.iconColor} />
          </div>
          <span className={theme === 'soft-modern' ? "text-sm font-medium text-primary" : "font-semibold text-gray-900 dark:text-white"}>
            {action.label}
          </span>
        </div>
      </button>
    </div>
  );
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { calls, fetchCalls } = useCallStore();
  const { events: calendarEvents, fetchEvents } = useCalendarStore();
  const { quotes, fetchQuotes } = useQuoteStore();
  const { invoices, fetchInvoices } = useInvoiceStore();
  const { products, fetchProducts } = useProductStore();
  const { tasks, fetchTasks, getPendingTasks, getOverdueTasks } = useTaskStore();
  const { fetchPipelineStats } = useDealStore();
  const { currentOrganization } = useOrganizationStore();
  const { preferences, saveQuickActionsOrder } = usePreferencesStore();

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');
  const [taskTypeFilter, setTaskTypeFilter] = useState<'all' | 'call' | 'email' | 'sms'>('all');
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [localStorageStats, setLocalStorageStats] = useState({
    pipelineValue: 0,
    weightedPipeline: 0,
    openDealsCount: 0,
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleAddCustomer = () => setShowCustomerModal(true);
  const handleSchedule = () => setShowEventModal(true);
  const handleCreateQuote = () => navigate('/quotes/builder');
  const handleNewInvoice = () => navigate('/invoices/builder');
  const handleCreateTask = () => {
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    if (taskFilter === 'pending') {
      filtered = getPendingTasks();
    } else if (taskFilter === 'overdue') {
      filtered = getOverdueTasks();
    } else if (taskFilter === 'completed') {
      filtered = tasks.filter(t => t.status === 'completed');
    }

    if (taskTypeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === taskTypeFilter);
    }

    return filtered.slice(0, 10);
  };

  const [quickActions, setQuickActions] = useState<QuickAction[]>([
    {
      id: 'add-customer',
      label: 'Add Customer',
      icon: UserPlus,
      onClick: handleAddCustomer,
      bgColor: 'bg-primary-100 dark:bg-primary-500/20',
      iconColor: 'text-primary-600 dark:text-white',
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: CalendarPlus,
      onClick: handleSchedule,
      bgColor: 'bg-primary-100 dark:bg-primary-500/20',
      iconColor: 'text-primary-600 dark:text-white',
    },
    {
      id: 'create-quote',
      label: 'Create Quote',
      icon: FilePlus,
      onClick: handleCreateQuote,
      bgColor: 'bg-primary-100 dark:bg-primary-500/20',
      iconColor: 'text-primary-600 dark:text-white',
    },
    {
      id: 'new-invoice',
      label: 'New Invoice',
      icon: FileText,
      onClick: handleNewInvoice,
      bgColor: 'bg-primary-100 dark:bg-primary-500/20',
      iconColor: 'text-primary-600 dark:text-white',
    },
    {
      id: 'create-task',
      label: 'Create Task',
      icon: CheckCircle,
      onClick: handleCreateTask,
      bgColor: 'bg-primary-100 dark:bg-primary-500/20',
      iconColor: 'text-primary-600 dark:text-white',
    },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuickActions((actions) => {
        const oldIndex = actions.findIndex((a) => a.id === active.id);
        const newIndex = actions.findIndex((a) => a.id === over.id);

        const newOrder = arrayMove(actions, oldIndex, newIndex);

        // Save to Supabase via store
        saveQuickActionsOrder(newOrder.map(a => a.id));

        return newOrder;
      });
    }
  };

  useEffect(() => {
    if (preferences.quickActionsOrder && preferences.quickActionsOrder.length > 0) {
      const defaultActions: QuickAction[] = [
        {
          id: 'add-customer',
          label: 'Add Customer',
          icon: UserPlus,
          onClick: handleAddCustomer,
          bgColor: 'bg-primary-100 dark:bg-primary-500/20',
          iconColor: 'text-primary-600 dark:text-white',
        },
        {
          id: 'schedule',
          label: 'Schedule',
          icon: CalendarPlus,
          onClick: handleSchedule,
          bgColor: 'bg-primary-100 dark:bg-primary-500/20',
          iconColor: 'text-primary-600 dark:text-white',
        },
        {
          id: 'create-quote',
          label: 'Create Quote',
          icon: FilePlus,
          onClick: handleCreateQuote,
          bgColor: 'bg-primary-100 dark:bg-primary-500/20',
          iconColor: 'text-primary-600 dark:text-white',
        },
        {
          id: 'new-invoice',
          label: 'New Invoice',
          icon: FileText,
          onClick: handleNewInvoice,
          bgColor: 'bg-primary-100 dark:bg-primary-500/20',
          iconColor: 'text-primary-600 dark:text-white',
        },
        {
          id: 'create-task',
          label: 'Create Task',
          icon: CheckCircle,
          onClick: handleCreateTask,
          bgColor: 'bg-primary-100 dark:bg-primary-500/20',
          iconColor: 'text-primary-600 dark:text-white',
        },
      ];

      const orderedActions = preferences.quickActionsOrder
        .map((id: string) => defaultActions.find(a => a.id === id))
        .filter((a): a is QuickAction => a !== undefined);

      // Add any missing default actions
      const existingIds = new Set(preferences.quickActionsOrder);
      const missingActions = defaultActions.filter(a => !existingIds.has(a.id));

      setQuickActions([...orderedActions, ...missingActions]);
    }
  }, [preferences.quickActionsOrder]);

  useEffect(() => {
    fetchCustomers();
    fetchCalls();
    fetchEvents();
    fetchQuotes();
    fetchInvoices();
    fetchProducts();
    fetchTasks();
    fetchPipelineStats();

    if (currentOrganization) {
      revenueService.getRevenueStats(currentOrganization.id)
        .then(setRevenueStats)
        .catch(error => console.error('Error loading revenue stats:', error));
    }

    loadStatsFromLocalStorage();
  }, [currentOrganization?.id]);

  useEffect(() => {
    loadStatsFromLocalStorage();
  }, [quotes, invoices]);

  const loadStatsFromLocalStorage = () => {
    try {
      const invoicesJSON = localStorage.getItem('cxtrack_demo_invoices');
      const quotesJSON = localStorage.getItem('cxtrack_demo_quotes');

      let totalPipeline = 0;
      let weightedPipeline = 0;
      let openDealsCount = 0;

      if (invoicesJSON) {
        const invoices = JSON.parse(invoicesJSON);
        invoices.forEach((invoice: any) => {
          if (['sent', 'viewed', 'draft', 'paid'].includes(invoice.status)) {
            const amount = invoice.total_amount || 0;
            totalPipeline += amount;
            openDealsCount++;

            if (invoice.status === 'paid') {
              weightedPipeline += amount * 1.0;
            } else {
              weightedPipeline += amount * 0.75;
            }
          }
        });
      }

      if (quotesJSON) {
        const quotes = JSON.parse(quotesJSON);
        quotes.forEach((quote: any) => {
          if (['sent', 'viewed', 'draft'].includes(quote.status)) {
            const amount = quote.total_amount || 0;
            totalPipeline += amount;
            weightedPipeline += amount * 0.5;
            openDealsCount++;
          }
        });
      }

      console.log('Dashboard stats:', { totalPipeline, weightedPipeline, openDealsCount });

      setLocalStorageStats({
        pipelineValue: totalPipeline,
        weightedPipeline: Math.round(weightedPipeline),
        openDealsCount,
      });
    } catch (error) {
      console.error('Error loading stats from localStorage:', error);
    }
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'Active').length;
  const recentCalls = calls.slice(0, 3);

  const upcomingAppointments = calendarEvents
    .filter(event => {
      const eventDate = new Date(event.start_time);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today && event.status === 'scheduled';
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  const todaysAppointments = calendarEvents.filter(event => {
    const eventDate = new Date(event.start_time);
    const today = new Date();
    return (
      eventDate.toDateString() === today.toDateString() &&
      event.status === 'scheduled'
    );
  }).length;

  const getAllActivities = () => {
    const activities: Array<{
      id: string;
      type: 'appointment' | 'quote' | 'invoice' | 'customer' | 'product' | 'task';
      title: string;
      subtitle?: string;
      timestamp: string;
      icon: any;
      iconBg: string;
      iconColor: string;
    }> = [];

    calendarEvents.forEach(event => {
      const customerName = event.customer_id
        ? customers.find(c => c.id === event.customer_id)?.name
        : null;
      activities.push({
        id: event.id,
        type: 'appointment',
        title: event.title,
        subtitle: customerName || undefined,
        timestamp: event.created_at,
        icon: Calendar,
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
      });
    });

    quotes.forEach(quote => {
      const customerName = customers.find(c => c.id === quote.customer_id)?.name || 'Unknown';
      activities.push({
        id: quote.id,
        type: 'quote',
        title: `Quote #${quote.quote_number} created`,
        subtitle: customerName,
        timestamp: quote.created_at,
        icon: FileText,
        iconBg: 'bg-purple-100 dark:bg-purple-900/30',
        iconColor: 'text-purple-600 dark:text-purple-400',
      });
    });

    invoices.forEach(invoice => {
      const customerName = customers.find(c => c.id === invoice.customer_id)?.name || 'Unknown';
      activities.push({
        id: invoice.id,
        type: 'invoice',
        title: `Invoice #${invoice.invoice_number} created`,
        subtitle: customerName,
        timestamp: invoice.created_at,
        icon: DollarSign,
        iconBg: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400',
      });
    });

    customers.forEach(customer => {
      activities.push({
        id: customer.id,
        type: 'customer',
        title: `${customer.name} added`,
        subtitle: customer.email || undefined,
        timestamp: customer.created_at,
        icon: Users,
        iconBg: 'bg-orange-100 dark:bg-orange-900/30',
        iconColor: 'text-orange-600 dark:text-orange-400',
      });
    });

    products.forEach(product => {
      activities.push({
        id: product.id,
        type: 'product',
        title: `Product "${product.name}" added`,
        subtitle: `$${product.price.toFixed(2)}`,
        timestamp: product.created_at,
        icon: Package,
        iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
      });
    });

    tasks.forEach(task => {
      const customerName = customers.find(c => c.id === task.customer_id)?.name || 'Unknown';
      activities.push({
        id: task.id,
        type: 'task',
        title: `Task: ${task.title}`,
        subtitle: `${customerName} • ${task.type}`,
        timestamp: task.created_at,
        icon: CheckCircle,
        iconBg: 'bg-teal-100 dark:bg-teal-900/30',
        iconColor: 'text-teal-600 dark:text-teal-400',
      });
    });

    return activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const getFilteredActivities = () => {
    const all = getAllActivities();

    if (activityFilter === 'all') return all.slice(0, 5);

    return all
      .filter(a => {
        if (activityFilter === 'appointments') return a.type === 'appointment';
        if (activityFilter === 'quotes') return a.type === 'quote';
        if (activityFilter === 'invoices') return a.type === 'invoice';
        if (activityFilter === 'products') return a.type === 'product';
        if (activityFilter === 'customers') return a.type === 'customer';
        if (activityFilter === 'tasks') return a.type === 'task';
        return true;
      })
      .slice(0, 5);
  };

  const recentActivities = getFilteredActivities();

  return (
    <div className={`min-h-screen ${theme === 'soft-modern' ? 'bg-soft-cream' : 'bg-gray-50 dark:bg-gray-950'}`}>
      <div className="md:hidden">
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back!</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Here's what's happening today</p>
            </div>
            <div
              onClick={() => navigate('/calendar')}
              className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md cursor-pointer active:scale-95 transition-transform"
            >
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className={theme === 'soft-modern' ? 'card p-4' : 'bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm'}>
              <div className="flex items-center justify-between mb-2">
                <div className={theme === 'soft-modern' ? 'w-10 h-10 icon-container rounded-lg flex items-center justify-center' : 'w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center'}>
                  <Users size={18} className={theme === 'soft-modern' ? 'icon-primary' : 'text-blue-600 dark:text-white'} />
                </div>
                <span className={theme === 'soft-modern' ? 'text-xs badge badge-success' : 'text-xs text-green-600 dark:text-white font-medium'}>+{activeCustomers}</span>
              </div>
              <p className={theme === 'soft-modern' ? 'text-2xl font-bold text-primary' : 'text-2xl font-bold text-gray-900 dark:text-white'}>{totalCustomers}</p>
              <p className={theme === 'soft-modern' ? 'text-xs text-tertiary' : 'text-xs text-gray-600 dark:text-gray-400'}>Customers</p>
            </div>

            <div className={theme === 'soft-modern' ? 'card p-4' : 'bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm'}>
              <div className="flex items-center justify-between mb-2">
                <div className={theme === 'soft-modern' ? 'w-10 h-10 icon-container rounded-lg flex items-center justify-center' : 'w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center'}>
                  <Phone size={18} className={theme === 'soft-modern' ? 'icon-success' : 'text-green-600 dark:text-white'} />
                </div>
                <span className={theme === 'soft-modern' ? 'text-xs badge badge-success' : 'text-xs text-green-600 dark:text-white font-medium'}>+{calls.length}</span>
              </div>
              <p className={theme === 'soft-modern' ? 'text-2xl font-bold text-primary' : 'text-2xl font-bold text-gray-900 dark:text-white'}>{calls.length}</p>
              <p className={theme === 'soft-modern' ? 'text-xs text-tertiary' : 'text-xs text-gray-600 dark:text-gray-400'}>Total Calls</p>
            </div>

            <div className={theme === 'soft-modern' ? 'card p-4' : 'bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm'}>
              <div className="flex items-center justify-between mb-2">
                <div className={theme === 'soft-modern' ? 'w-10 h-10 icon-container rounded-lg flex items-center justify-center' : 'w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center'}>
                  <DollarSign size={18} className={theme === 'soft-modern' ? 'icon-success' : 'text-purple-600 dark:text-white'} />
                </div>
                <span className={`text-xs font-medium ${theme === 'soft-modern' ? 'badge badge-success' : (revenueStats && revenueStats.month_over_month_percent >= 0 ? 'text-green-600 dark:text-white' : 'text-red-600 dark:text-red-400')}`}>
                  {revenueStats && revenueStats.month_over_month_percent >= 0 ? '+' : ''}{revenueStats ? `${revenueStats.month_over_month_percent.toFixed(1)}%` : '0%'}
                </span>
              </div>
              <p className={theme === 'soft-modern' ? 'text-2xl font-bold text-primary' : 'text-2xl font-bold text-gray-900 dark:text-white'}>
                ${revenueStats ? ((revenueStats.current_month_revenue / 1000).toFixed(1)) : '0'}k
              </p>
              <p className={theme === 'soft-modern' ? 'text-xs text-tertiary' : 'text-xs text-gray-600 dark:text-gray-400'}>Revenue</p>
            </div>

            <div className={theme === 'soft-modern' ? 'card p-4' : 'bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm'}>
              <div className="flex items-center justify-between mb-2">
                <div className={theme === 'soft-modern' ? 'w-10 h-10 icon-container rounded-lg flex items-center justify-center' : 'w-10 h-10 bg-pink-100 dark:bg-pink-500/20 rounded-lg flex items-center justify-center'}>
                  <TrendingUp size={18} className={theme === 'soft-modern' ? 'icon-primary' : 'text-pink-600 dark:text-white'} />
                </div>
                <span className={theme === 'soft-modern' ? 'text-xs text-tertiary font-medium' : 'text-xs text-gray-600 dark:text-gray-400 font-medium'}>
                  {localStorageStats.openDealsCount} deals
                </span>
              </div>
              <p className={theme === 'soft-modern' ? 'text-2xl font-bold text-primary' : 'text-2xl font-bold text-gray-900 dark:text-white'}>
                ${((localStorageStats.pipelineValue / 1000).toFixed(1))}k
              </p>
              <p className={theme === 'soft-modern' ? 'text-xs text-tertiary' : 'text-xs text-gray-600 dark:text-gray-400'}>Pipeline</p>
            </div>
          </div>
        </div>

        <div className="px-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleAddCustomer}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all active:scale-[0.98] shadow-sm text-left"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mb-3">
                <UserPlus size={24} className="text-blue-600 dark:text-white" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Add Customer</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Create new customer</p>
            </button>

            <button
              onClick={handleSchedule}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all active:scale-[0.98] shadow-sm text-left"
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center mb-3">
                <CalendarPlus size={24} className="text-green-600 dark:text-white" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Schedule</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Book appointment</p>
            </button>

            <button
              onClick={handleCreateQuote}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all active:scale-[0.98] shadow-sm text-left"
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center mb-3">
                <FilePlus size={24} className="text-purple-600 dark:text-white" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Create Quote</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">New quote</p>
            </button>

            <button
              onClick={handleNewInvoice}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all active:scale-[0.98] shadow-sm text-left"
            >
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center mb-3">
                <FileText size={24} className="text-orange-600 dark:text-white" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">New Invoice</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Create invoice</p>
            </button>
          </div>
        </div>

        <div className="px-4 pb-24">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <Link
              to="/activity"
              className="text-sm text-primary-600 dark:text-white font-medium flex items-center"
            >
              View All
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>

          {recentCalls.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity size={24} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCalls.map((call) => (
                <Link
                  key={call.id}
                  to={`/calls/${call.id}`}
                  className="block bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${call.direction === 'inbound'
                      ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-white'
                      : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-white'
                      }`}>
                      <Phone size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {call.direction === 'inbound' ? 'Incoming Call' : 'Outgoing Call'}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                          {format(new Date(call.created_at), 'h:mm a')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {call.phone_number} • {Math.floor(call.duration_seconds / 60)}m
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 pb-24">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h3>
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
                >
                  + Add Task
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {['all', 'pending', 'overdue', 'completed'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setTaskFilter(filter as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${taskFilter === filter
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'all', label: 'All Types' },
                    { value: 'call', label: 'Calls' },
                    { value: 'email', label: 'Emails' },
                    { value: 'sms', label: 'SMS' },
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setTaskTypeFilter(type.value as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${taskTypeFilter === type.value
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {getFilteredTasks().length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No tasks found</p>
                  <button
                    onClick={handleCreateTask}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm"
                  >
                    Create your first task
                  </button>
                </div>
              ) : (
                getFilteredTasks().map(task => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {task.title}
                          </h4>
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded flex-shrink-0">
                            {task.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            {task.customer_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {format(new Date(task.due_date), 'MMM dd')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' :
                          task.priority === 'high' ? 'bg-orange-500' :
                            task.priority === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                          }`} />

                        <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${task.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          task.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                          }`}>
                          {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1920px] mx-auto">
            {theme === 'soft-modern' ? (
              <div
                className="rounded-3xl p-8 border border-white/50 mb-6"
                style={{
                  background: '#F8F6F2',
                  boxShadow: '8px 8px 16px rgba(0,0,0,0.08), -8px -8px 16px rgba(255,255,255,0.9)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-semibold mb-2" style={{ color: '#2D2D2D' }}>
                      Welcome back, Admin
                    </h1>
                    <p className="text-lg" style={{ color: '#6B6B6B' }}>
                      Here's what's happening today.
                    </p>
                  </div>

                  <div
                    className="px-6 py-4 rounded-2xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.6)',
                      boxShadow: '4px 4px 8px rgba(0,0,0,0.06), -2px -2px 6px rgba(255,255,255,0.8)'
                    }}
                  >
                    <div className="flex items-center gap-3 text-right">
                      <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#9CA3AF' }}>Today</p>
                        <p className="text-lg font-semibold" style={{ color: '#2D2D2D' }}>
                          {currentTime.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-xs font-medium" style={{ color: '#6B6B6B' }}>
                          {currentTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#EAE4DB] transition-colors"
                        style={{ background: '#F0EBE3' }}
                        onClick={() => navigate('/calendar')}
                      >
                        <Calendar size={20} style={{ color: '#6B6B6B' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-6 lg:mb-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome back, Admin!
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Here's what's happening with your organization today.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                      {currentTime.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {currentTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div
                    onClick={() => navigate('/calendar')}
                    className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer group"
                  >
                    <Calendar className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className={theme === 'soft-modern' ? "card p-6" : "bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"}>
                <div className="flex items-center justify-between mb-4">
                  <div className={theme === 'soft-modern' ? "w-12 h-12 rounded-lg icon-container flex items-center justify-center" : "w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center"}>
                    <Users size={20} className={theme === 'soft-modern' ? "icon-primary" : "text-blue-600 dark:text-white"} />
                  </div>
                  <span className={theme === 'soft-modern' ? "badge badge-success" : "px-2.5 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-white text-xs font-medium rounded-full"}>
                    +{activeCustomers}
                  </span>
                </div>
                <p className={theme === 'soft-modern' ? "text-body-sm text-secondary mb-1" : "text-sm font-medium mb-1 text-gray-500 dark:text-gray-400"}>
                  Total Customers
                </p>
                <p className={theme === 'soft-modern' ? "text-h1 text-primary" : "text-3xl font-bold text-gray-900 dark:text-white"}>{totalCustomers}</p>
                <div className={theme === 'soft-modern' ? "mt-4 flex items-center text-body-sm" : "mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400"}>
                  <span className={theme === 'soft-modern' ? "font-medium text-success" : "font-medium"}>{activeCustomers}</span>
                  <span className={theme === 'soft-modern' ? "ml-2 text-tertiary" : "ml-2"}>active this month</span>
                </div>
              </div>

              <div className={theme === 'soft-modern' ? "card p-6" : "bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"}>
                <div className="flex items-center justify-between mb-4">
                  <div className={theme === 'soft-modern' ? "w-12 h-12 rounded-lg icon-container flex items-center justify-center" : "w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center"}>
                    <Calendar size={20} className={theme === 'soft-modern' ? "icon-success" : "text-green-600 dark:text-white"} />
                  </div>
                  <span className={theme === 'soft-modern' ? "badge badge-primary" : "px-2.5 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-white text-xs font-medium rounded-full"}>
                    Today
                  </span>
                </div>
                <p className={theme === 'soft-modern' ? "text-body-sm text-secondary mb-1" : "text-sm font-medium mb-1 text-gray-500 dark:text-gray-400"}>
                  Appointments
                </p>
                <p className={theme === 'soft-modern' ? "text-h1 text-primary" : "text-3xl font-bold text-gray-900 dark:text-white"}>{todaysAppointments}</p>
                <div className="mt-4">
                  <Link to="/calendar" className={theme === 'soft-modern' ? "text-body-sm font-medium text-primary hover:underline flex items-center gap-1" : "text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"}>
                    View Calendar
                    {theme === 'soft-modern' && <ArrowUpRight size={12} />}
                    {theme !== 'soft-modern' && ' →'}
                  </Link>
                </div>
              </div>

              <div className={theme === 'soft-modern' ? "card p-6" : "bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"}>
                <div className="flex items-center justify-between mb-4">
                  <div className={theme === 'soft-modern' ? "w-12 h-12 rounded-lg icon-container flex items-center justify-center" : "w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center"}>
                    <DollarSign size={20} className={theme === 'soft-modern' ? "icon-success" : "text-purple-600 dark:text-white"} />
                  </div>
                  <span className={theme === 'soft-modern' ? "badge badge-success" : "px-2.5 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-white text-xs font-medium rounded-full"}>
                    +$0
                  </span>
                </div>
                <p className={theme === 'soft-modern' ? "text-body-sm text-secondary mb-1" : "text-sm font-medium mb-1 text-gray-500 dark:text-gray-400"}>
                  Monthly Revenue
                </p>
                <p className={theme === 'soft-modern' ? "text-h1 text-primary" : "text-3xl font-bold text-gray-900 dark:text-white"}>
                  ${(revenueStats?.current_month_revenue || 0).toLocaleString()}
                </p>
                <div className={theme === 'soft-modern' ? "mt-4 flex items-center text-body-sm" : "mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400"}>
                  <span className={theme === 'soft-modern' ? "font-medium text-success" : "font-medium"}>
                    {revenueStats && revenueStats.month_over_month_change >= 0 ? '+' : ''}{revenueStats ? `$${Math.abs(revenueStats.month_over_month_change).toLocaleString()}` : '$0'}
                  </span>
                  <span className={theme === 'soft-modern' ? "ml-2 text-tertiary" : "ml-2"}>vs last month</span>
                </div>
              </div>

              <div className={theme === 'soft-modern' ? "card p-6" : "bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"}>
                <div className="flex items-center justify-between mb-4">
                  <div className={theme === 'soft-modern' ? "w-12 h-12 rounded-lg icon-container flex items-center justify-center" : "w-12 h-12 bg-pink-100 dark:bg-pink-500/20 rounded-xl flex items-center justify-center"}>
                    <TrendingUp size={20} className={theme === 'soft-modern' ? "icon-primary" : "text-pink-600 dark:text-white"} />
                  </div>
                  <span className={theme === 'soft-modern' ? "badge badge-neutral" : "px-2.5 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-white text-xs font-medium rounded-full"}>
                    +0%
                  </span>
                </div>
                <p className={theme === 'soft-modern' ? "text-body-sm text-secondary mb-1" : "text-sm font-medium mb-1 text-gray-500 dark:text-gray-400"}>
                  Pipeline Value
                </p>
                <p className={theme === 'soft-modern' ? "text-h1 text-primary" : "text-3xl font-bold text-gray-900 dark:text-white"}>
                  ${localStorageStats.pipelineValue.toLocaleString()}
                </p>
                <div className="mt-4">
                  <div className={theme === 'soft-modern' ? "text-body-sm text-tertiary mb-2" : "text-sm mb-2 text-gray-500 dark:text-gray-400"}>
                    ${localStorageStats.weightedPipeline.toLocaleString()} weighted
                  </div>
                  <Link to="/pipeline" className={theme === 'soft-modern' ? "text-body-sm font-medium text-primary hover:underline flex items-center gap-1" : "text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"}>
                    View Pipeline
                    {theme === 'soft-modern' && <ArrowUpRight size={12} />}
                    {theme !== 'soft-modern' && ' →'}
                  </Link>
                </div>
              </div>
            </div>

            <div
              className={theme === 'soft-modern' ? "rounded-3xl p-4 border border-white/50 mb-4 sm:mb-6" : "mb-4 sm:mb-6"}
              style={theme === 'soft-modern' ? {
                background: '#F8F6F2',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.08), -8px -8px 16px rgba(255,255,255,0.9)'
              } : undefined}
            >

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={quickActions.map(a => a.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                    {quickActions.map((action) => (
                      <SortableQuickAction key={action.id} action={action} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <Card className="flex flex-col h-[600px] overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shrink-0">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Latest updates across your CRM</p>
                    </div>
                  </div>
                  <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 font-medium flex items-center gap-1 transition-colors shrink-0">
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
                  {['All', 'Appointments', 'Quotes', 'Invoices', 'Products', 'Customers', 'Tasks'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActivityFilter(filter.toLowerCase() as ActivityFilter)}
                      className={`
                      px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-all
                      ${activityFilter === filter.toLowerCase()
                          ? 'bg-blue-600 text-white shadow-md'
                          : theme === 'soft-modern'
                            ? 'bg-white text-slate-600 shadow-[2px_2px_4px_rgba(0,0,0,0.06),-2px_-2px_4px_rgba(255,255,255,0.9)] hover:shadow-[1px_1px_3px_rgba(0,0,0,0.08)]'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                    `}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity size={32} className="text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">No recent activity</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Your activity will appear here</p>
                    </div>
                  ) : (
                    recentActivities.map((activity) => {
                      const IconComponent = activity.icon;
                      return (
                        <NestedCard key={activity.id} onClick={() => { }}>
                          <div className="flex items-start gap-4 min-w-0">
                            <div className={`p-2.5 rounded-xl ${activity.iconBg} shadow-inner shrink-0`}>
                              <IconComponent className={`w-5 h-5 ${activity.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                                {activity.title}
                              </h4>
                              {activity.subtitle && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                                  {activity.subtitle}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-500 flex-wrap">
                                <span className="truncate">{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </NestedCard>
                      );
                    })
                  )}
                </div>
              </Card>

              <Card className="flex flex-col h-[600px] overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shrink-0">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Appointments</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Your scheduled meetings</p>
                    </div>
                  </div>
                  <Link to="/calendar" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 font-medium flex items-center gap-1 transition-colors shrink-0">
                    View Calendar
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {upcomingAppointments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar size={32} className="text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium mb-3">No upcoming appointments</p>
                      <Button
                        variant="primary"
                        onClick={() => setShowEventModal(true)}
                        className="flex items-center gap-2 mx-auto"
                      >
                        <CalendarPlus size={18} />
                        Schedule Appointment
                      </Button>
                    </div>
                  ) : (
                    upcomingAppointments.map((event) => {
                      const customerName = event.customer_id
                        ? customers.find(c => c.id === event.customer_id)?.name
                        : null;
                      return (
                        <NestedCard
                          key={event.id}
                          onClick={() => navigate('/calendar')}
                        >
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-inner shrink-0">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                                {event.title}
                              </h4>
                              {customerName && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                                  with {customerName}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                                <Clock className="w-4 h-4 shrink-0" />
                                <span className="truncate">{format(new Date(event.start_time), 'MMM dd, yyyy • h:mm a')}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </NestedCard>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Your to-do items</p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleCreateTask}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </Button>
                </div>

                <div className="space-y-3 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {['All', 'Pending', 'Overdue', 'Completed'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setTaskFilter(filter.toLowerCase() as any)}
                        className={`
                        px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                        ${taskFilter === filter.toLowerCase()
                            ? 'bg-blue-600 text-white shadow-md'
                            : theme === 'soft-modern'
                              ? 'bg-white text-slate-600 shadow-[2px_2px_4px_rgba(0,0,0,0.06),-2px_-2px_4px_rgba(255,255,255,0.9)] hover:shadow-[1px_1px_3px_rgba(0,0,0,0.08)]'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }
                      `}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {[
                      { value: 'all', label: 'All Types' },
                      { value: 'call', label: 'Calls' },
                      { value: 'email', label: 'Emails' },
                      { value: 'sms', label: 'SMS' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setTaskTypeFilter(type.value as any)}
                        className={`
                        px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                        ${taskTypeFilter === type.value
                            ? 'bg-slate-700 dark:bg-slate-600 text-white shadow-md'
                            : theme === 'soft-modern'
                              ? 'bg-white text-slate-600 shadow-[2px_2px_4px_rgba(0,0,0,0.06),-2px_-2px_4px_rgba(255,255,255,0.9)] hover:shadow-[1px_1px_3px_rgba(0,0,0,0.08)]'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }
                      `}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {getFilteredTasks().length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">No tasks found</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 mb-4">Create a task to get started</p>
                      <Button
                        variant="primary"
                        onClick={handleCreateTask}
                        className="flex items-center gap-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        Create your first task
                      </Button>
                    </div>
                  ) : (
                    getFilteredTasks().map(task => (
                      <NestedCard
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {task.title}
                              </h4>
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded flex-shrink-0">
                                {task.type}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <User size={14} />
                                {task.customer_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {format(new Date(task.due_date), 'MMM dd')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' :
                                task.priority === 'high' ? 'bg-orange-500' :
                                  task.priority === 'medium' ? 'bg-yellow-500' :
                                    'bg-green-500'
                                }`} />
                              <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{task.priority}</span>
                            </div>

                            <span className={`px-3 py-1 text-xs rounded-lg font-medium shadow-inner flex-shrink-0 ${task.status === 'completed' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                              {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </NestedCard>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {showCustomerModal && (
        <CustomerModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          navigateToProfileAfterCreate={true}
        />
      )}

      {showEventModal && (
        <EventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          selectedDate={new Date()}
        />
      )}

      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
            fetchTasks();
          }}
          task={selectedTask}
        />
      )}
    </div>
  );
};
