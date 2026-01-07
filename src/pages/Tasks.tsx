import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  ListTodo,
  LayoutGrid,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  AlertCircle,
  Archive,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TaskModal from '@/components/tasks/TaskModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import { useThemeStore } from '@/stores/themeStore';

type ViewMode = 'table' | 'kanban';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Status = 'To Do' | 'In Progress' | 'Completed';

interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: Priority;
  status: Status;
  dueDate: Date;
  customer?: string;
  showOnCalendar?: boolean;
  startTime?: string;
  created_at?: string;
  due_date?: string;
  start_time?: string;
  duration?: number;
  show_on_calendar?: boolean;
}

const priorityColors: Record<Priority, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  urgent: 'bg-rose-500',
};

const statusStyles: Record<Status, string> = {
  'To Do': 'bg-slate-50 text-slate-700 border-slate-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Call customer about quote',
    type: 'call',
    priority: 'medium',
    status: 'To Do',
    dueDate: new Date('2025-12-25'),
    customer: 'John Doe',
    description: 'Follow up on Q4 quote',
    created_at: new Date().toISOString(),
    due_date: '2025-12-25',
  },
  {
    id: '2',
    title: 'Send proposal email',
    type: 'email',
    priority: 'urgent',
    status: 'To Do',
    dueDate: new Date('2025-12-20'),
    customer: 'Acme Corp',
    description: 'Send updated pricing proposal',
    created_at: new Date().toISOString(),
    due_date: '2025-12-20',
  },
  {
    id: '3',
    title: 'Review contract',
    type: 'other',
    priority: 'high',
    status: 'In Progress',
    dueDate: new Date('2025-12-23'),
    showOnCalendar: true,
    startTime: '2:00 PM',
    description: 'Review and approve new vendor contract',
    created_at: new Date().toISOString(),
    due_date: '2025-12-23',
    start_time: '14:00',
    show_on_calendar: true,
    duration: 60,
  },
  {
    id: '4',
    title: 'Team meeting prep',
    type: 'meeting',
    priority: 'low',
    status: 'Completed',
    dueDate: new Date('2025-12-22'),
    description: 'Prepare agenda and slides',
    created_at: new Date().toISOString(),
    due_date: '2025-12-22',
  },
  {
    id: '5',
    title: 'Update project documentation',
    type: 'other',
    priority: 'medium',
    status: 'In Progress',
    dueDate: new Date('2025-12-26'),
    customer: 'Tech Solutions Inc',
    description: 'Update API documentation for v2.0',
    created_at: new Date().toISOString(),
    due_date: '2025-12-26',
  },
  {
    id: '6',
    title: 'Schedule product demo',
    type: 'meeting',
    priority: 'high',
    status: 'To Do',
    dueDate: new Date('2025-12-24'),
    customer: 'Global Enterprises',
    showOnCalendar: true,
    startTime: '10:00 AM',
    created_at: new Date().toISOString(),
    due_date: '2025-12-24',
    start_time: '10:00',
    show_on_calendar: true,
    duration: 30,
  },
];

interface TasksProps {
  embedded?: boolean;
}

export default function Tasks({ embedded = false }: TasksProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const isOverdue = (dueDate: Date, status: Status): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return status !== 'Completed' && taskDate < today;
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        if (!task.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (dateRange.start && task.dueDate < new Date(dateRange.start)) return false;
      if (dateRange.end && task.dueDate > new Date(dateRange.end)) return false;
      return true;
    });
  }, [tasks, searchQuery, filterPriority, filterStatus, dateRange]);

  const hasActiveFilters =
    dateRange.start !== '' ||
    dateRange.end !== '' ||
    filterPriority !== 'all' ||
    filterStatus !== 'all';

  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) return 'Today';
    if (taskDate.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };



  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(task => task.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectTask = (id: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTasks(newSelected);
    setSelectAll(newSelected.size === filteredTasks.length);
  };

  const bulkComplete = () => {
    setTasks((prev) =>
      prev.map((task) =>
        selectedTasks.has(task.id) ? { ...task, status: 'Completed' as Status } : task
      )
    );
    setSelectedTasks(new Set());
    setSelectAll(false);
  };

  const bulkArchive = () => {
    if (!confirm(`Archive ${selectedTasks.size} tasks?`)) return;
    setTasks((prev) => prev.filter((task) => !selectedTasks.has(task.id)));
    setSelectedTasks(new Set());
    setSelectAll(false);
  };

  const bulkDelete = () => {
    setTasks((prev) => prev.filter((task) => !selectedTasks.has(task.id)));
    setSelectedTasks(new Set());
    setSelectAll(false);
    setShowDeleteModal(false);
    toast.success('Tasks deleted successfully');
  };

  const deleteTask = (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    toast.success('Task deleted successfully');
  };

  const updateTaskStatus = (taskId: string, newStatus: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status: newStatus as Status } : task))
    );
  };

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetailModal(true);
  };

  const clearAllFilters = () => {
    setDateRange({ start: '', end: '' });
    setFilterPriority('all');
    setFilterStatus('all');
  };

  const { theme } = useThemeStore();

  const containerClass = embedded
    ? ''
    : `min-h-screen ${theme === 'soft-modern' ? 'bg-soft-cream' : 'bg-gray-50 dark:bg-gray-950'}`;

  const innerClass = embedded
    ? ''
    : 'p-4 sm:p-6 lg:p-8';

  const cardOuterClass = embedded
    ? ''
    : 'max-w-[1920px] mx-auto';

  const cardClass = embedded
    ? ''
    : theme === 'soft-modern' ? 'card p-8 mb-6' : 'bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 border-2 border-gray-200 dark:border-gray-700 mb-6';

  return (
    <>
      <div className={containerClass}>
        <div className={innerClass}>
          <div className={cardOuterClass}>
            <div className={cardClass}>
              {!embedded && (
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Tasks</h1>
                    <p className="text-slate-600 dark:text-gray-400 mt-1">Manage your tasks and to-dos</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTask(null);
                      setShowTaskModal(true);
                    }}
                    className={theme === 'soft-modern' ? 'btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all' : 'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors'}
                  >
                    <Plus size={18} />
                    New Task
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4 mb-4">

                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={18} />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={
                      theme === 'soft-modern'
                        ? 'input w-full pl-10 pr-4 py-2.5 rounded-xl'
                        : 'w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 dark:text-white'
                    }
                  />
                </div>

                <div className={theme === 'soft-modern' ? 'flex items-center gap-1 bg-base rounded-lg p-1' : 'flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1'}>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'table'
                      ? theme === 'soft-modern'
                        ? 'bg-surface shadow-sm text-primary'
                        : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : theme === 'soft-modern' ? 'text-secondary hover:text-primary' : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    <ListTodo size={16} />
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'kanban'
                      ? theme === 'soft-modern'
                        ? 'bg-surface shadow-sm text-primary'
                        : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : theme === 'soft-modern' ? 'text-secondary hover:text-primary' : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    <LayoutGrid size={16} />
                    Kanban
                  </button>
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={theme === 'soft-modern' ? 'btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all' : 'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors'}
                >
                  <Filter size={18} />
                  Filters
                  {hasActiveFilters && (
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
                      Active
                    </span>
                  )}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className={theme === 'soft-modern' ? 'card mb-6 space-y-4 p-8' : 'mb-6 space-y-4 bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700'}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className={
                        theme === 'soft-modern'
                          ? 'input w-full px-4 py-2.5 rounded-xl'
                          : 'w-full px-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 dark:text-white'
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className={
                        theme === 'soft-modern'
                          ? 'input w-full px-4 py-2.5 rounded-xl'
                          : 'w-full px-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 dark:text-white'
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className={
                      theme === 'soft-modern'
                        ? 'w-full px-4 py-2.5 bg-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.9)] border-2 border-transparent focus:border-blue-500 transition-all text-slate-700'
                        : 'w-full px-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 dark:text-white'
                    }
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={
                      theme === 'soft-modern'
                        ? 'w-full px-4 py-2.5 bg-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.9)] border-2 border-transparent focus:border-blue-500 transition-all text-slate-700'
                        : 'w-full px-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 dark:text-white'
                    }
                  >
                    <option value="all">All Statuses</option>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className={theme === 'soft-modern' ? 'btn-secondary w-full px-4 py-2.5 rounded-xl font-medium transition-all' : 'w-full px-4 py-2.5 rounded-xl font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors'}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}

            {viewMode === 'table' && (
              <>
                {/* Desktop Table View */}
                <div className={theme === 'soft-modern' ? 'hidden md:block card overflow-hidden' : 'hidden md:block overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700'}>
                  <div className="w-full overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[900px]">
                      <thead className={theme === 'soft-modern' ? 'bg-base border-b-2 border-default' : 'bg-slate-50 dark:bg-gray-700 border-b-2 border-slate-100 dark:border-gray-600'}>
                        <tr>
                          <th className="w-12 px-3 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectAll}
                              onChange={handleSelectAll}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="w-12 text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            #
                          </th>
                          <th className="min-w-[250px] px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Task
                          </th>
                          <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Status
                          </th>
                          <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Priority
                          </th>
                          <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Due Date
                          </th>
                          <th className="w-36 px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Customer
                          </th>
                          <th className="w-24 px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-100 dark:divide-gray-700">
                        {filteredTasks.map((task, index) => {
                          const overdue = isOverdue(task.dueDate, task.status);
                          return (
                            <tr
                              key={task.id}
                              onClick={() => openTaskDetail(task)}
                              className={`hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-slate-100 dark:border-gray-700 ${overdue ? 'border-l-4 border-l-rose-500' : ''
                                }`}
                            >
                              <td className="px-3 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedTasks.has(task.id)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleSelectTask(task.id);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="text-center px-3 py-3">
                                <span className="text-sm font-medium text-slate-400">
                                  {index + 1}
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {task.status === 'Completed' ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-slate-300 dark:text-gray-600 flex-shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-medium text-slate-900 dark:text-white truncate">{task.title}</div>
                                    {task.description && (
                                      <div className="text-sm text-slate-500 dark:text-gray-400 mt-0.5 truncate">
                                        {task.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-3 py-3">
                                <select
                                  value={task.status}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    updateTaskStatus(task.id, e.target.value);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`px-2 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors w-full ${statusStyles[task.status]
                                    }`}
                                >
                                  <option value="To Do">To Do</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                </select>
                              </td>

                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityColors[task.priority]
                                      }`}
                                  />
                                  <span className="text-sm text-slate-700 dark:text-gray-300 capitalize truncate">
                                    {task.priority}
                                  </span>
                                </div>
                              </td>

                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  {overdue && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                  <span
                                    className={`text-sm truncate ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-700 dark:text-gray-300'
                                      }`}
                                  >
                                    {formatDate(task.dueDate)}
                                  </span>
                                </div>
                              </td>

                              <td className="px-3 py-3">
                                <span className="text-sm text-slate-700 dark:text-gray-300 truncate block" title={task.customer || ''}>
                                  {task.customer || '—'}
                                </span>
                              </td>

                              <td className="px-3 py-3">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTaskDetail(task);
                                    }}
                                    className="p-1.5 text-slate-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTask(task.id);
                                    }}
                                    className="p-1.5 text-slate-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredTasks.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    return (
                      <div
                        key={task.id}
                        onClick={() => openTaskDetail(task)}
                        className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all active:scale-[0.98] ${overdue ? 'border-rose-200 dark:border-rose-900/30 shadow-rose-50 dark:shadow-none' : 'border-gray-100 dark:border-gray-700'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTask(task.id);
                              }}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedTasks.has(task.id)
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-gray-300 dark:border-gray-600'
                                }`}
                            >
                              {selectedTasks.has(task.id) && <CheckCircle2 size={12} />}
                            </button>
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-2">
                              {task.title}
                            </h3>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                            {task.status}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Customer</span>
                            <span className="font-medium text-gray-900 dark:text-white">{task.customer || '—'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Due Date</span>
                            <div className="flex items-center gap-1.5">
                              {overdue && <AlertCircle size={14} className="text-rose-500" />}
                              <span className={`font-medium ${overdue ? 'text-rose-600' : 'text-gray-900 dark:text-white'}`}>
                                {formatDate(task.dueDate)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Priority</span>
                            <div className="flex items-center gap-1.5 font-medium capitalize text-gray-900 dark:text-white">
                              <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
                              {task.priority}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, task.status === 'Completed' ? 'To Do' : 'Completed'); }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${task.status === 'Completed'
                              ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              : 'bg-emerald-600 text-white'
                              }`}>
                            {task.status === 'Completed' ? 'Mark Incomplete' : 'Complete Task'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openTaskDetail(task); }}
                            className="px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 rounded-lg text-xs font-bold"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredTasks.length === 0 && (
                  <div className="py-12 text-center text-slate-500 dark:text-gray-400">
                    <ListTodo className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-gray-600" />
                    <p className="font-medium">No tasks found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                  </div>
                )}
              </>
            )}

            {viewMode === 'kanban' && (
              <KanbanBoard
                tasks={filteredTasks}
                onTaskMove={(taskId, newStatus) => {
                  setTasks((prev) =>
                    prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
                  );
                }}
                onTaskClick={openTaskDetail}
              />
            )}
          </div>
        </div>
      </div>

      {selectedTasks.size > 0 && viewMode === 'table' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center gap-6">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {selectedTasks.size} selected
              </span>

              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

              <div className="flex items-center gap-3">
                <button
                  onClick={bulkComplete}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Complete
                </button>

                <button
                  onClick={bulkArchive}
                  className="px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-xl hover:bg-rose-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>

                <button
                  onClick={() => {
                    setSelectedTasks(new Set());
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

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={theme === 'soft-modern' ? 'max-w-md w-full rounded-3xl p-8 border border-white/50' : 'max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700'} style={theme === 'soft-modern' ? { background: '#F8F6F2', boxShadow: '8px 8px 16px rgba(0,0,0,0.08), -8px -8px 16px rgba(255,255,255,0.9)' } : undefined}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Delete Tasks</h3>
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  Are you sure you want to delete {selectedTasks.size} task(s)? This action cannot
                  be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className={theme === 'soft-modern' ? 'px-4 py-2.5 rounded-xl font-medium bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.9)] hover:shadow-[3px_3px_8px_rgba(0,0,0,0.12)] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)] transition-all duration-200' : 'px-4 py-2.5 rounded-xl font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors'}
              >
                Cancel
              </button>
              <button
                onClick={bulkDelete}
                className={theme === 'soft-modern' ? 'px-4 py-2.5 rounded-xl font-medium bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-[6px_6px_12px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_8px_rgba(0,0,0,0.2)] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2)] transition-all duration-200' : 'px-4 py-2.5 rounded-xl font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors'}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          task={selectedTask as any}
          defaultShowOnCalendar={false}
        />
      )}

      {showTaskDetailModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask as any}
          isOpen={showTaskDetailModal}
          onClose={() => {
            setShowTaskDetailModal(false);
            setSelectedTask(null);
          }}
          onUpdate={async (id, data) => {
            setTasks((prev) =>
              prev.map((task) => (task.id === id ? { ...task, ...data } as any : task))
            );
            setShowTaskDetailModal(false);
            setSelectedTask(null);
          }}
        />
      )}
    </>
  );
}
