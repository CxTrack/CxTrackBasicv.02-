import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Building, Mail, Phone, MapPin, Globe, Calendar, Tag } from 'lucide-react';
import { useCustomerStore } from '@/stores/customerStore';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { AddressAutocomplete, AddressComponents } from '@/components/ui/AddressAutocomplete';
import toast from 'react-hot-toast';

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCustomer, fetchCustomerById, createCustomer, updateCustomer, loading } = useCustomerStore();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    customer_type: 'personal',
    name: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Canada',
    website: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    industry: '',
    business_stage: '',
    business_structure: '',
    hours_per_week: '',
    date_of_birth: '',
    gender: '',
    occupation: '',
    preferred_contact_method: 'email',
    notes: '',
    tags: [] as string[],
    status: 'Active',
    priority: 'Medium',
  });

  useEffect(() => {
    if (id) {
      fetchCustomerById(id);
    }
  }, [id]);

  useEffect(() => {
    if (currentCustomer && id) {
      setFormData({
        customer_type: currentCustomer.customer_type || 'personal',
        name: currentCustomer.name || '',
        first_name: currentCustomer.first_name || '',
        middle_name: currentCustomer.middle_name || '',
        last_name: currentCustomer.last_name || '',
        email: currentCustomer.email || '',
        phone: currentCustomer.phone || '',
        company: currentCustomer.company || '',
        title: currentCustomer.title || '',
        address: currentCustomer.address || '',
        city: currentCustomer.city || '',
        state: currentCustomer.state || '',
        postal_code: currentCustomer.postal_code || '',
        country: currentCustomer.country || 'Canada',
        website: currentCustomer.website || '',
        linkedin: currentCustomer.linkedin || '',
        twitter: currentCustomer.twitter || '',
        facebook: currentCustomer.facebook || '',
        instagram: currentCustomer.instagram || '',
        industry: currentCustomer.industry || '',
        business_stage: currentCustomer.business_stage || '',
        business_structure: currentCustomer.business_structure || '',
        hours_per_week: currentCustomer.hours_per_week?.toString() || '',
        date_of_birth: currentCustomer.date_of_birth || '',
        gender: currentCustomer.gender || '',
        occupation: currentCustomer.occupation || '',
        preferred_contact_method: currentCustomer.preferred_contact_method || 'email',
        notes: currentCustomer.notes || '',
        tags: currentCustomer.tags || [],
        status: currentCustomer.status || 'Active',
        priority: currentCustomer.priority || 'Medium',
      });
    }
  }, [currentCustomer, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error('Please fill in required fields');
      return;
    }

    if (formData.customer_type === 'business' && !formData.company) {
      toast.error('Company Name is required for business customers');
      return;
    }

    setSaving(true);

    try {
      const customerData = {
        ...formData,
        hours_per_week: formData.hours_per_week ? parseInt(formData.hours_per_week) : null,
      };

      if (id) {
        await updateCustomer(id, customerData);
        toast.success('Customer updated successfully');
      } else {
        const newCustomer = await createCustomer(customerData);
        toast.success('Customer created successfully');
        if (newCustomer) {
          navigate(`/customers/${newCustomer.id}`);
          return;
        }
      }
      navigate(`/customers/${id}`);
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading && id) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={id ? `/customers/${id}` : '/customers'}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {id ? 'Edit Customer' : 'New Customer'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {id ? 'Update customer information' : 'Add a new customer to your database'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to={id ? `/customers/${id}` : '/customers'}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center disabled:opacity-50"
            >
              <Save size={18} className="mr-2" />
              {saving ? 'Saving...' : id ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <User size={20} className="mr-2 text-primary-600 dark:text-primary-400" />
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, customer_type: 'personal' })}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${formData.customer_type === 'personal'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <User size={20} className="mb-1 text-primary-600 dark:text-primary-400" />
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Personal</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, customer_type: 'business' })}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${formData.customer_type === 'business'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <Building size={20} className="mb-1 text-primary-600 dark:text-primary-400" />
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Business</p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="M."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  placeholder="John Doe"
                />
              </div>

              {formData.customer_type === 'business' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="CEO"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <PhoneInput
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Contact
                  </label>
                  <select
                    value={formData.preferred_contact_method}
                    onChange={(e) => setFormData({ ...formData, preferred_contact_method: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="sms">SMS</option>
                    <option value="any">Any</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPin size={20} className="mr-2 text-primary-600 dark:text-primary-400" />
              Address Information
            </h2>

            <div className="space-y-4">
              <div>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(value) => setFormData({ ...formData, address: value })}
                  onAddressSelect={(components: AddressComponents) => {
                    setFormData(prev => ({
                      ...prev,
                      address: components.address,
                      city: components.city || prev.city,
                      state: components.state || prev.state,
                      postal_code: components.postal_code || prev.postal_code,
                      country: components.country || prev.country,
                    }));
                  }}
                  label="Street Address"
                  placeholder="Start typing an address..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="Toronto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="ON"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="M5H 2N2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  placeholder="Canada"
                />
              </div>
            </div>
          </div>

          {formData.customer_type === 'business' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Building size={20} className="mr-2 text-primary-600 dark:text-primary-400" />
                Business Details
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="Technology"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business Stage
                    </label>
                    <input
                      type="text"
                      value={formData.business_stage}
                      onChange={(e) => setFormData({ ...formData, business_stage: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="Startup"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business Structure
                    </label>
                    <input
                      type="text"
                      value={formData.business_structure}
                      onChange={(e) => setFormData({ ...formData, business_structure: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="LLC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hours Per Week
                    </label>
                    <input
                      type="number"
                      value={formData.hours_per_week}
                      onChange={(e) => setFormData({ ...formData, hours_per_week: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.customer_type === 'personal' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Calendar size={20} className="mr-2 text-primary-600 dark:text-primary-400" />
                Personal Details
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gender
                    </label>
                    <input
                      type="text"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="Male/Female/Other"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Globe size={20} className="mr-2 text-primary-600 dark:text-primary-400" />
              Social Links
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={formData.twitter}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="https://twitter.com/username"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="https://facebook.com/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="https://instagram.com/username"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Tag size={20} className="mr-2 text-primary-600 dark:text-primary-400" />
              Additional Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  placeholder="Add any additional notes about this customer..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pb-6">
            <Link
              to={id ? `/customers/${id}` : '/customers'}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center disabled:opacity-50"
            >
              <Save size={18} className="mr-2" />
              {saving ? 'Saving...' : id ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
