import React, { useState, useEffect } from 'react';
import { format, addMinutes } from 'date-fns';
import { useCustomerStore } from '@/stores/customerStore';
import { useCalendarStore } from '@/stores/calendarStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  X, Clock, Mail, Phone, MapPin,
  Video, FileText, Save, Plus, Search, Check
} from 'lucide-react';
import { PhoneInput } from '../ui/PhoneInput';
import TimePicker from '../shared/TimePicker';
import DurationPicker from '../shared/DurationPicker';
import toast from 'react-hot-toast';
import type { CalendarEvent } from '@/types/database.types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  event?: CalendarEvent | null;
}

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function EventModal({ isOpen, onClose, selectedDate, event }: EventModalProps) {
  const { customers, fetchCustomers, createCustomer } = useCustomerStore();
  const { createEvent, updateEvent, fetchEvents } = useCalendarStore();
  const { currentOrganization, getOrganizationId } = useOrganizationStore();
  const { user } = useAuthContext();

  const [formData, setFormData] = useState({
    title: '',
    date: getTodayDate(),
    start_time: '9:00 AM',
    duration: 30,
    customer_id: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    location: '',
    meeting_url: '',
    event_type: 'appointment' as const,
    color: '#6366f1',
    description: '',
    reminder_minutes: 30
  });

  const [newCustomer, setNewCustomer] = useState({
    customer_category: 'Personal' as 'Personal' | 'Business',
    first_name: '',
    middle_name: '',
    last_name: '',
    business_name: '',
    email: '',
    phone: ''
  });

  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && currentOrganization) {
      fetchCustomers();
    }
  }, [isOpen, currentOrganization, fetchCustomers]);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        date: format(new Date(event.start_time), 'yyyy-MM-dd'),
        start_time: format(new Date(event.start_time), 'HH:mm'),
        duration: Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000),
        customer_id: event.customer_id || '',
        customer_name: event.attendees?.[0]?.name || '',
        customer_email: event.attendees?.[0]?.email || '',
        customer_phone: '', // Phone not directly in attendees array object
        location: event.location || '',
        meeting_url: event.meeting_url || '',
        event_type: (event.event_type as any) || 'appointment',
        color: event.color_code || '#6366f1',
        description: event.description || '',
        reminder_minutes: event.reminders?.[0]?.minutes || 30
      });
    } else {
      setFormData({
        title: '',
        date: getTodayDate(),
        start_time: '09:00',
        duration: 30,
        customer_id: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        location: '',
        meeting_url: '',
        event_type: 'appointment',
        color: '#6366f1',
        description: '',
        reminder_minutes: 30
      });
    }
  }, [event, selectedDate]);

  const getEndTime = () => {
    if (!formData.start_time) return '';

    const [time, period] = formData.start_time.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;

    if (period === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }

    const start = new Date();
    start.setHours(hour24, minutes);
    const end = addMinutes(start, formData.duration);

    const endHours = end.getHours();
    const endMinutes = end.getMinutes();
    const endPeriod = endHours >= 12 ? 'PM' : 'AM';
    const displayHours = endHours % 12 || 12;

    return `${displayHours}:${endMinutes.toString().padStart(2, '0')} ${endPeriod}`;
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  ).slice(0, 5);

  const handleCustomerSelect = (customer: any) => {
    setFormData({
      ...formData,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_email: customer.email || '',
      customer_phone: customer.phone || ''
    });
    setShowCustomerSearch(false);
    setCustomerSearchTerm('');
  };

  const handleCreateQuickCustomer = async () => {
    // Validate based on customer type
    if (newCustomer.customer_category === 'Personal') {
      if (!newCustomer.first_name || !newCustomer.last_name || !newCustomer.email) {
        toast.error('First name, last name, and email are required');
        return;
      }
    } else {
      if (!newCustomer.business_name || !newCustomer.email) {
        toast.error('Business name and email are required');
        return;
      }
    }

    let orgId;
    try {
      orgId = getOrganizationId();
    } catch (err) {
      toast.error('No organization selected');
      return;
    }

    try {
      // Construct full name based on category
      const fullName = newCustomer.customer_category === 'Personal'
        ? [newCustomer.first_name, newCustomer.middle_name, newCustomer.last_name]
          .filter(Boolean)
          .join(' ')
        : newCustomer.business_name;

      const customer = await createCustomer({
        name: fullName,
        first_name: newCustomer.customer_category === 'Personal' ? newCustomer.first_name : undefined,
        middle_name: newCustomer.customer_category === 'Personal' ? newCustomer.middle_name : undefined,
        last_name: newCustomer.customer_category === 'Personal' ? newCustomer.last_name : undefined,
        customer_category: newCustomer.customer_category,
        email: newCustomer.email,
        phone: newCustomer.phone,
        status: 'Active',
        type: newCustomer.customer_category === 'Business' ? 'Business' : 'Individual',
        organization_id: orgId
      });

      if (customer) {
        handleCustomerSelect(customer);
        setShowNewCustomerForm(false);
        setNewCustomer({
          customer_category: 'Personal',
          first_name: '',
          middle_name: '',
          last_name: '',
          business_name: '',
          email: '',
          phone: ''
        });
        toast.success('Customer created successfully');
      }
    } catch (error) {
      toast.error('Failed to create customer');
    }
  };

  const handleClearCustomer = () => {
    setFormData({
      ...formData,
      customer_id: '',
      customer_name: '',
      customer_email: '',
      customer_phone: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.start_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    let orgId;
    try {
      orgId = getOrganizationId();
    } catch (err) {
      toast.error('No organization selected');
      return;
    }

    setSaving(true);

    try {
      const [time, period] = formData.start_time.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour24 = hours;

      if (period === 'PM' && hours !== 12) {
        hour24 = hours + 12;
      } else if (period === 'AM' && hours === 12) {
        hour24 = 0;
      }

      const [year, month, day] = formData.date.split('-').map(Number);
      const startDateTime = new Date(year, month - 1, day, hour24, minutes, 0, 0);
      const endDateTime = addMinutes(startDateTime, formData.duration);

      const eventData = {
        organization_id: orgId,
        user_id: event?.user_id || orgId, // Fallback to orgId as user_id if missing for demo/mock
        title: formData.title,
        description: formData.description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        customer_id: formData.customer_id || null,
        attendees: formData.customer_email ? [{
          name: formData.customer_name,
          email: formData.customer_email
        }] : [],
        location: formData.location || null,
        meeting_url: formData.meeting_url || null,
        event_type: formData.event_type as any,
        color_code: formData.color,
        reminders: formData.reminder_minutes > 0 ? [{
          minutes: formData.reminder_minutes,
          method: 'email'
        }] : [],
        status: 'scheduled' as const,
        cal_com_event_id: event?.cal_com_event_id || null,
        is_recurring: event?.is_recurring || false,
        recurrence_rule: event?.recurrence_rule || null,
        metadata: event?.metadata || {},
        created_by: event?.created_by || user?.id || null
      };

      if (event) {
        console.log('💾 Updating event with data:', eventData);
        await updateEvent(event.id, eventData);
        console.log('🔄 Refreshing calendar...');
        await fetchEvents(orgId);
        toast.success('Event updated successfully');
      } else {
        await createEvent(eventData);
        toast.success('Event created successfully');
      }

      onClose();
    } catch (error) {
      console.error('Failed to save event:', error);
      toast.error('Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const hasSelectedCustomer = formData.customer_id || formData.customer_name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Client Meeting"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              min={getTodayDate()}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <TimePicker
            selectedTime={formData.start_time}
            onTimeChange={(time) => setFormData({ ...formData, start_time: time })}
            label="Start Time"
            required={true}
          />

          <DurationPicker
            duration={formData.duration}
            onDurationChange={(duration) => setFormData({ ...formData, duration })}
            label="Duration"
          />

          {formData.start_time && (
            <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <Clock size={16} className="text-primary-600 dark:text-primary-400" />
              <span className="text-sm text-primary-700 dark:text-primary-300 font-medium">
                {format(new Date(formData.date), 'MMM d, yyyy')} • {formData.start_time} - {getEndTime()}
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Customer
            </label>

            {!hasSelectedCustomer && !showCustomerSearch && !showNewCustomerForm && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowCustomerSearch(true)}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                >
                  <Search size={24} className="text-blue-600 dark:text-blue-400 mb-2" />
                  <span className="font-medium text-gray-900 dark:text-white">Select Existing</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCustomerForm(true)}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                >
                  <Plus size={24} className="text-green-600 dark:text-green-400 mb-2" />
                  <span className="font-medium text-gray-900 dark:text-white">Add New</span>
                </button>
              </div>
            )}

            {showCustomerSearch && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                {customerSearchTerm && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => handleCustomerSelect(customer)}
                          className="w-full p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left border border-gray-200 dark:border-gray-600"
                        >
                          <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                          {customer.email && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</p>
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                        No customers found
                      </p>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomerSearch(false);
                    setCustomerSearchTerm('');
                  }}
                  className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {showNewCustomerForm && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                  <FileText size={14} className="mr-1" />
                  You can add more details later
                </p>

                {/* Customer Type Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Customer Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCustomer({ ...newCustomer, customer_category: 'Personal' })}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${newCustomer.customer_category === 'Personal'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-500'
                        }`}
                    >
                      Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCustomer({ ...newCustomer, customer_category: 'Business' })}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${newCustomer.customer_category === 'Business'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-500'
                        }`}
                    >
                      Business
                    </button>
                  </div>
                </div>

                {/* Conditional Name Fields */}
                {newCustomer.customer_category === 'Personal' ? (
                  <>
                    <input
                      type="text"
                      value={newCustomer.first_name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                      placeholder="First Name *"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={newCustomer.middle_name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, middle_name: e.target.value })}
                      placeholder="Middle Name (optional)"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={newCustomer.last_name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                      placeholder="Last Name *"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </>
                ) : (
                  <input
                    type="text"
                    value={newCustomer.business_name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, business_name: e.target.value })}
                    placeholder="Business Name *"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}

                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="Email *"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <PhoneInput
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleCreateQuickCustomer}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Create & Select
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCustomerForm(false);
                      setNewCustomer({
                        customer_category: 'Personal',
                        first_name: '',
                        middle_name: '',
                        last_name: '',
                        business_name: '',
                        email: '',
                        phone: ''
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {hasSelectedCustomer && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Check size={16} className="text-green-600 dark:text-green-400 mr-2" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formData.customer_name}
                      </span>
                    </div>
                    {formData.customer_email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mb-1">
                        <Mail size={14} className="mr-2" />
                        {formData.customer_email}
                      </p>
                    )}
                    {formData.customer_phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Phone size={14} className="mr-2" />
                        {formData.customer_phone}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Conference Room A"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Video Meeting URL
            </label>
            <div className="relative">
              <Video size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                value={formData.meeting_url}
                onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://meet.google.com/..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Type
            </label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value as any })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="appointment">Appointment</option>
              <option value="meeting">Meeting</option>
              <option value="call">Call</option>
              <option value="task">Task</option>
              <option value="reminder">Reminder</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {[
                '#3b82f6', // Blue
                '#10b981', // Green
                '#f59e0b', // Amber
                '#ef4444', // Red
                '#8b5cf6', // Purple
                '#ec4899', // Pink
                '#06b6d4', // Cyan
                '#6366f1', // Indigo
              ].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg transition-all hover:scale-110 ${formData.color === color
                    ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-110'
                    : 'hover:opacity-80'
                    }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reminder
            </label>
            <select
              value={formData.reminder_minutes}
              onChange={(e) => setFormData({ ...formData, reminder_minutes: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="0">No reminder</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="1440">1 day before</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Add event details..."
            />
          </div>
        </form>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Saving...' : event ? 'Update Event' : 'Save Event'}
          </button>
        </div>
      </div>
    </div>
  );
}
