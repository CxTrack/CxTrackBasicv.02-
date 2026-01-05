import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Calendar,
  Clock,
  User,
  FileText,
  Tag,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { useCustomerStore } from '@/stores/customerStore';

interface LogCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (callData: any) => Promise<void>;
  preselectedCustomerId?: string;
}

export default function LogCallModal({
  isOpen,
  onClose,
  onSubmit,
  preselectedCustomerId,
}: LogCallModalProps) {
  const { theme } = useThemeStore();
  const { customers, fetchCustomers } = useCustomerStore();

  const [formData, setFormData] = useState({
    customer_id: preselectedCustomerId || '',
    direction: 'outbound' as 'inbound' | 'outbound',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    duration_minutes: '',
    duration_seconds: '',
    status: 'completed' as 'completed' | 'missed' | 'voicemail' | 'busy',
    outcome: '' as '' | 'positive' | 'neutral' | 'negative' | 'no_answer' | 'callback',
    notes: '',
    tags: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      if (!preselectedCustomerId) {
        resetForm();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedCustomerId && customers.length > 0) {
      const customer = customers.find(c => c.id === preselectedCustomerId);
      if (customer) {
        const customerName = customer.first_name || customer.last_name
          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
          : customer.name || customer.company || '';
        setCustomerSearch(customerName);
        setFormData(prev => ({ ...prev, customer_id: preselectedCustomerId }));
      }
    }
  }, [preselectedCustomerId, customers]);

  const resetForm = () => {
    setFormData({
      customer_id: '',
      direction: 'outbound',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      duration_minutes: '',
      duration_seconds: '',
      status: 'completed',
      outcome: '',
      notes: '',
      tags: [],
    });
    setErrors({});
    setCustomerSearch('');
    setTagInput('');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer = 'Customer is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.time) {
      newErrors.time = 'Time is required';
    }

    const mins = parseInt(formData.duration_minutes) || 0;
    const secs = parseInt(formData.duration_seconds) || 0;
    if (mins === 0 && secs === 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const totalSeconds =
        (parseInt(formData.duration_minutes) || 0) * 60 +
        (parseInt(formData.duration_seconds) || 0);

      const callDateTime = new Date(`${formData.date}T${formData.time}`);

      const callData = {
        customer_id: formData.customer_id,
        customer_phone: customers.find(c => c.id === formData.customer_id)?.phone || '',
        direction: formData.direction,
        started_at: callDateTime.toISOString(),
        ended_at: new Date(callDateTime.getTime() + totalSeconds * 1000).toISOString(),
        duration_seconds: totalSeconds,
        status: formData.status,
        outcome: formData.outcome || null,
        notes: formData.notes || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        call_type: 'human',
      };

      await onSubmit(callData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error logging call:', error);
      setErrors({ submit: 'Failed to log call. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const customerName = customer.first_name || customer.last_name
        ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
        : customer.name || customer.company || '';
      setFormData({ ...formData, customer_id: customerId });
      setCustomerSearch(customerName);
      setShowCustomerDropdown(false);
      setErrors({ ...errors, customer: '' });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const getCustomerName = (customer: any) => {
    if (customer.first_name || customer.last_name) {
      return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    }
    return customer.name || customer.company || 'Unknown';
  };

  const filteredCustomers = customers.filter(c => {
    const name = getCustomerName(c).toLowerCase();
    const phone = c.phone?.toLowerCase() || '';
    const search = customerSearch.toLowerCase();
    return name.includes(search) || phone.includes(search);
  });

  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 ${isDark ? 'bg-black/60' : 'bg-black/30'} backdrop-blur-sm transition-opacity`}
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className={`
              relative w-full max-w-2xl
              ${isDark ? 'bg-gray-800' : 'bg-white'}
              border-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}
              rounded-2xl
              shadow-2xl
              transform transition-all
            `}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-6 border-b-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Log Call
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Record details of your customer conversation
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">

                <div>
                  <label className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Search customer by name or phone..."
                      className={`
                        w-full pl-10 pr-4 py-2.5 rounded-lg border-2
                        ${errors.customer
                          ? 'border-red-500'
                          : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-100'
                          : 'bg-white border-gray-200 text-gray-900'
                        }
                        focus:border-blue-500 focus:outline-none
                        transition-colors
                      `}
                    />

                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className={`
                        absolute z-10 w-full mt-2 py-2 rounded-lg border-2 shadow-lg max-h-60 overflow-y-auto
                        ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
                      `}>
                        {filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => selectCustomer(customer.id)}
                            className={`
                              w-full px-4 py-2.5 text-left transition-colors
                              ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}
                            `}
                          >
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {getCustomerName(customer)}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {customer.phone || 'No phone'}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.customer && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.customer}
                    </p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                    Direction <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, direction: 'outbound' })}
                      className={`
                        p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2
                        ${formData.direction === 'outbound'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : isDark
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      <PhoneOutgoing className="w-5 h-5" />
                      <span className="font-medium">Outbound</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, direction: 'inbound' })}
                      className={`
                        p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2
                        ${formData.direction === 'inbound'
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : isDark
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      <PhoneIncoming className="w-5 h-5" />
                      <span className="font-medium">Inbound</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                      Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className={`
                          w-full pl-10 pr-4 py-2.5 rounded-lg border-2
                          ${errors.date
                            ? 'border-red-500'
                            : isDark
                            ? 'bg-gray-700 border-gray-600 text-gray-100'
                            : 'bg-white border-gray-200 text-gray-900'
                          }
                          focus:border-blue-500 focus:outline-none
                        `}
                      />
                    </div>
                    {errors.date && (
                      <p className="text-sm text-red-500 mt-1">{errors.date}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                      Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className={`
                          w-full pl-10 pr-4 py-2.5 rounded-lg border-2
                          ${errors.time
                            ? 'border-red-500'
                            : isDark
                            ? 'bg-gray-700 border-gray-600 text-gray-100'
                            : 'bg-white border-gray-200 text-gray-900'
                          }
                          focus:border-blue-500 focus:outline-none
                        `}
                      />
                    </div>
                    {errors.time && (
                      <p className="text-sm text-red-500 mt-1">{errors.time}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                    Duration <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                        placeholder="Minutes"
                        className={`
                          w-full px-4 py-2.5 rounded-lg border-2
                          ${errors.duration
                            ? 'border-red-500'
                            : isDark
                            ? 'bg-gray-700 border-gray-600 text-gray-100'
                            : 'bg-white border-gray-200 text-gray-900'
                          }
                          focus:border-blue-500 focus:outline-none
                        `}
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={formData.duration_seconds}
                        onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value })}
                        placeholder="Seconds"
                        className={`
                          w-full px-4 py-2.5 rounded-lg border-2
                          ${errors.duration
                            ? 'border-red-500'
                            : isDark
                            ? 'bg-gray-700 border-gray-600 text-gray-100'
                            : 'bg-white border-gray-200 text-gray-900'
                          }
                          focus:border-blue-500 focus:outline-none
                        `}
                      />
                    </div>
                  </div>
                  {errors.duration && (
                    <p className="text-sm text-red-500 mt-1">{errors.duration}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className={`
                        w-full px-4 py-2.5 rounded-lg border-2
                        ${isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-100'
                          : 'bg-white border-gray-200 text-gray-900'
                        }
                        focus:border-blue-500 focus:outline-none
                      `}
                    >
                      <option value="completed">Completed</option>
                      <option value="missed">Missed</option>
                      <option value="voicemail">Voicemail</option>
                      <option value="busy">Busy</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                      Outcome
                    </label>
                    <select
                      value={formData.outcome}
                      onChange={(e) => setFormData({ ...formData, outcome: e.target.value as any })}
                      className={`
                        w-full px-4 py-2.5 rounded-lg border-2
                        ${isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-100'
                          : 'bg-white border-gray-200 text-gray-900'
                        }
                        focus:border-blue-500 focus:outline-none
                      `}
                    >
                      <option value="">Select outcome...</option>
                      <option value="positive">Positive</option>
                      <option value="neutral">Neutral</option>
                      <option value="negative">Negative</option>
                      <option value="no_answer">No Answer</option>
                      <option value="callback">Callback Requested</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                    Notes
                  </label>
                  <div className="relative">
                    <FileText className={`absolute left-3 top-3 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add notes about this call..."
                      rows={4}
                      className={`
                        w-full pl-10 pr-4 py-2.5 rounded-lg border-2 resize-none
                        ${isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500'
                          : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                        }
                        focus:border-blue-500 focus:outline-none
                      `}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                    Tags
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative flex-1">
                      <Tag className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="Add tag and press Enter..."
                        className={`
                          w-full pl-10 pr-4 py-2.5 rounded-lg border-2
                          ${isDark
                            ? 'bg-gray-700 border-gray-600 text-gray-100'
                            : 'bg-white border-gray-200 text-gray-900'
                          }
                          focus:border-blue-500 focus:outline-none
                        `}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`
                            px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2
                            ${isDark
                              ? 'bg-blue-900/30 text-blue-300'
                              : 'bg-blue-50 text-blue-700'
                            }
                          `}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-600 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {errors.submit && (
                <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{errors.submit}</p>
                </div>
              )}

              <div className={`flex items-center justify-end gap-3 mt-8 pt-6 border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className={`
                    px-6 py-2.5 rounded-xl font-medium transition-colors
                    ${isDark
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="
                    px-6 py-2.5 rounded-xl font-medium
                    bg-blue-600 text-white
                    hover:bg-blue-700
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2
                    shadow-md
                    transition-colors
                  "
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Log Call
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}