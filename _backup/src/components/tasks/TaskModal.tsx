import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  CheckCircle,
  UserPlus,
  Phone,
  Mail,
  MessageSquare,
  RefreshCw,
  Users,
  FileText,
  Flag,
  Clock
} from 'lucide-react';
import { useTaskStore, TaskType, TaskPriority, Task } from '@/stores/taskStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useCalendarStore } from '@/stores/calendarStore';
import QuickAddCustomerModal from '@/components/shared/QuickAddCustomerModal';
import TimePicker from '@/components/shared/TimePicker';
import DurationPicker from '@/components/shared/DurationPicker';
import { DatePicker } from '@/components/shared/DatePicker';
import { Dropdown } from '@/components/shared/Dropdown';
import { calculateEndTime, formatDateTimeRange } from '@/utils/time.utils';
import toast from 'react-hot-toast';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
  customerName?: string;
  task?: Task | null;
  preselectedDate?: Date;
  defaultShowOnCalendar?: boolean;
}

export default function TaskModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  task,
  preselectedDate,
  defaultShowOnCalendar = false,
}: TaskModalProps) {
  const { createTask, updateTask, completeTask, tasks } = useTaskStore();
  const { customers } = useCustomerStore();
  const { events } = useCalendarStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'call' as TaskType,
    priority: 'medium' as TaskPriority,
    status: 'pending' as 'pending' | 'in_progress' | 'completed',
    due_date: new Date().toISOString().split('T')[0],
    show_on_calendar: false,
    start_time: '',
    end_time: '',
    duration: 30,
    customer_id: customerId || '',
    customer_name: customerName || '',
    outcome: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);

  const taskTypeOptions = [
    { value: 'call', label: 'Call', icon: <Phone size={16} />, color: 'text-blue-600' },
    { value: 'email', label: 'Email', icon: <Mail size={16} />, color: 'text-purple-600' },
    { value: 'sms', label: 'SMS', icon: <MessageSquare size={16} />, color: 'text-green-600' },
    { value: 'follow_up', label: 'Follow Up', icon: <RefreshCw size={16} />, color: 'text-orange-600' },
    { value: 'meeting', label: 'Meeting Prep', icon: <Users size={16} />, color: 'text-indigo-600' },
    { value: 'other', label: 'Other', icon: <FileText size={16} />, color: 'text-gray-600' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', icon: <div className="w-2 h-2 bg-green-500 rounded-full" />, color: 'text-green-600' },
    { value: 'medium', label: 'Medium', icon: <div className="w-2 h-2 bg-yellow-500 rounded-full" />, color: 'text-yellow-600' },
    { value: 'high', label: 'High', icon: <div className="w-2 h-2 bg-orange-500 rounded-full" />, color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', icon: <div className="w-2 h-2 bg-red-500 rounded-full" />, color: 'text-red-600' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: <Clock size={16} />, color: 'text-gray-600' },
    { value: 'in_progress', label: 'In Progress', icon: <RefreshCw size={16} />, color: 'text-blue-600' },
    { value: 'completed', label: 'Completed', icon: <CheckCircle size={16} />, color: 'text-green-600' },
    { value: 'cancelled', label: 'Cancelled', icon: <X size={16} />, color: 'text-red-600' },
  ];

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        type: task.type,
        priority: task.priority,
        status: task.status as any,
        due_date: task.due_date,
        show_on_calendar: task.show_on_calendar || false,
        start_time: task.start_time || '',
        end_time: task.end_time || '',
        duration: task.duration || 30,
        customer_id: task.customer_id,
        customer_name: task.customer_name,
        outcome: task.outcome || '',
      });
    } else {
      setFormData(prev => ({
        ...prev,
        due_date: preselectedDate ? preselectedDate.toISOString().split('T')[0] : prev.due_date,
        show_on_calendar: defaultShowOnCalendar,
        customer_id: customerId || prev.customer_id,
        customer_name: customerName || prev.customer_name,
      }));
    }
  }, [task, customerId, customerName, preselectedDate, defaultShowOnCalendar]);

  const getConflictingTimes = () => {
    if (!formData.show_on_calendar) {
      return [];
    }

    const dateEvents = events.filter(e => e.date === formData.due_date);
    const dateTasks = tasks.filter(t =>
      t.due_date === formData.due_date &&
      t.show_on_calendar === true &&
      (!task || t.id !== task.id)
    );

    const eventTimes = dateEvents.map(e => e.start_time);
    const taskTimes = dateTasks.map(t => t.start_time).filter(Boolean);

    return [...eventTimes, ...taskTimes];
  };

  const checkTimeConflict = () => {
    if (!formData.start_time) return false;

    const conflicts = getConflictingTimes();
    return conflicts.includes(formData.start_time);
  };

  useEffect(() => {
    if (formData.start_time && formData.duration) {
      const endTime = calculateEndTime(formData.start_time, formData.duration);
      setFormData(prev => ({ ...prev, end_time: endTime }));
    }
  }, [formData.start_time, formData.duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id) {
      setError('Please select a customer');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a task title');
      return;
    }

    if (formData.show_on_calendar) {
      if (!formData.start_time) {
        setError('Please select a start time for this calendar task');
        return;
      }

      if (checkTimeConflict()) {
        setError('You already have a task or appointment at this time');
        return;
      }
    }

    setSaving(true);
    setError('');

    try {
      if (task) {
        if (formData.status === 'completed' && formData.outcome) {
          await completeTask(task.id, formData.outcome);
          toast.success('Task completed');
        } else {
          await updateTask(task.id, {
            title: formData.title,
            description: formData.description,
            type: formData.type,
            priority: formData.priority,
            status: formData.status,
            due_date: formData.due_date,
            show_on_calendar: formData.show_on_calendar,
            start_time: formData.show_on_calendar ? formData.start_time : undefined,
            end_time: formData.show_on_calendar ? formData.end_time : undefined,
            duration: formData.show_on_calendar ? formData.duration : undefined,
          });
          toast.success('Task updated');
        }
      } else {
        await createTask(formData);
        toast.success('Task created');
      }

      onClose();

      setFormData({
        title: '',
        description: '',
        type: 'call',
        priority: 'medium',
        status: 'pending',
        due_date: new Date().toISOString().split('T')[0],
        show_on_calendar: false,
        start_time: '',
        end_time: '',
        duration: 30,
        customer_id: customerId || '',
        customer_name: customerName || '',
        outcome: '',
      });
    } catch (error: any) {
      setError(error.message);
      toast.error('Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {task ? 'Edit Task' : 'Create Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Call customer about quote"
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Dropdown
              label="Type"
              options={taskTypeOptions}
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value as TaskType })}
              required
            />

            <Dropdown
              label="Priority"
              options={priorityOptions}
              value={formData.priority}
              onChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label="Due Date"
              selectedDate={new Date(formData.due_date)}
              onDateChange={(date) => setFormData({ ...formData, due_date: date.toISOString().split('T')[0] })}
              minDate={new Date()}
              required
            />

            <div className="flex flex-col">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Calendar Display
              </label>
              <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white text-sm">Show on Calendar</span>
                </div>

                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    show_on_calendar: !formData.show_on_calendar,
                    start_time: formData.show_on_calendar ? '' : formData.start_time,
                    duration: formData.show_on_calendar ? 30 : formData.duration,
                  })}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    formData.show_on_calendar ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    formData.show_on_calendar ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {task && (
            <Dropdown
              label="Status"
              options={statusOptions}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value as any })}
            />
          )}

          {formData.show_on_calendar && (
            <>
              <TimePicker
                selectedTime={formData.start_time}
                onTimeChange={(time) => setFormData({ ...formData, start_time: time })}
                label="Start Time"
                excludeTimes={getConflictingTimes()}
                required={false}
              />

              <DurationPicker
                duration={formData.duration}
                onDurationChange={(duration) => setFormData({ ...formData, duration })}
                label="Duration"
                required={false}
              />

              {formData.start_time && formData.end_time && (
                <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                  <Clock size={16} className="text-primary-600 dark:text-primary-400" />
                  <span className="text-sm text-primary-700 dark:text-primary-300 font-medium">
                    {formatDateTimeRange(formData.due_date, formData.start_time, formData.end_time)}
                  </span>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Customer *
            </label>
            {formData.customer_name ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border-2 border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <User size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="font-medium">{formData.customer_name}</span>
                </div>
                {!customerId && !task && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, customer_id: '', customer_name: '' })}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                  >
                    Change
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" size={16} />
                  <select
                    value={formData.customer_id}
                    onChange={(e) => {
                      const customer = customers.find(c => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        customer_id: e.target.value,
                        customer_name: customer?.name || '',
                      });
                    }}
                    className="w-full px-4 py-3 pl-10 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer transition-all"
                    required
                  >
                    <option value="">Select customer...</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCustomer(true)}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-medium transition-all whitespace-nowrap flex items-center gap-2"
                  title="Add new customer"
                >
                  <UserPlus size={16} />
                  <span className="hidden sm:inline">New</span>
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details about this task..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>

          {formData.status === 'completed' && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Outcome {task && <span className="text-gray-500">(required when completing)</span>}
              </label>
              <textarea
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                placeholder="What was the result of this task?"
                rows={2}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                required={formData.status === 'completed'}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {saving ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>

      <QuickAddCustomerModal
        isOpen={showQuickAddCustomer}
        onClose={() => setShowQuickAddCustomer(false)}
        onCustomerCreated={(customer) => {
          setFormData({
            ...formData,
            customer_id: customer.id,
            customer_name: customer.name,
          });
          setShowQuickAddCustomer(false);
        }}
      />
    </div>
  );
}
