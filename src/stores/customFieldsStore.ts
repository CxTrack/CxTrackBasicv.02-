/**
 * Custom Fields Store
 * Manages custom field definitions with demo mode support
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { DEMO_MODE, generateDemoId, loadDemoData, saveDemoData } from '@/config/demo.config';
import {
    CustomFieldDefinition,
    CustomFieldFormData,
    generateFieldKey
} from '@/types/customFields.types';

const DEMO_CUSTOM_FIELDS_KEY = 'cxtrack_demo_custom_fields';

interface CustomFieldsStore {
    fields: CustomFieldDefinition[];
    loading: boolean;
    error: string | null;

    // CRUD operations
    fetchFields: (entityType?: string) => Promise<void>;
    createField: (data: CustomFieldFormData, entityType: string) => Promise<CustomFieldDefinition | null>;
    updateField: (id: string, updates: Partial<CustomFieldFormData>) => Promise<void>;
    deleteField: (id: string) => Promise<void>;
    reorderFields: (fieldIds: string[]) => Promise<void>;

    // Utilities
    getFieldsByEntity: (entityType: string) => CustomFieldDefinition[];
    getFieldByKey: (key: string) => CustomFieldDefinition | undefined;
}

// Default demo custom fields to showcase the feature
const DEFAULT_DEMO_FIELDS: CustomFieldDefinition[] = [
    {
        id: 'cf_referral_source',
        organization_id: '00000000-0000-0000-0000-000000000000',
        entity_type: 'customer',
        field_key: 'referral_source',
        field_label: 'Referral Source',
        field_type: 'select',
        description: 'How did this customer find us?',
        options: [
            { value: 'google', label: 'Google Search', color: '#4285F4' },
            { value: 'facebook', label: 'Facebook', color: '#1877F2' },
            { value: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
            { value: 'referral', label: 'Customer Referral', color: '#10B981' },
            { value: 'trade_show', label: 'Trade Show', color: '#8B5CF6' },
            { value: 'cold_call', label: 'Cold Call', color: '#F59E0B' },
            { value: 'other', label: 'Other', color: '#6B7280' }
        ],
        is_required: false,
        is_active: true,
        order: 1,
        show_in_list: true,
        show_in_card: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'cf_annual_revenue',
        organization_id: '00000000-0000-0000-0000-000000000000',
        entity_type: 'customer',
        field_key: 'annual_revenue',
        field_label: 'Annual Revenue',
        field_type: 'currency',
        description: 'Estimated annual revenue of the business',
        is_required: false,
        is_active: true,
        placeholder: '$0',
        order: 2,
        show_in_list: true,
        show_in_card: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'cf_contract_end',
        organization_id: '00000000-0000-0000-0000-000000000000',
        entity_type: 'customer',
        field_key: 'contract_end_date',
        field_label: 'Contract End Date',
        field_type: 'date',
        description: 'When does their current contract expire?',
        is_required: false,
        is_active: true,
        order: 3,
        show_in_list: false,
        show_in_card: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'cf_employee_count',
        organization_id: '00000000-0000-0000-0000-000000000000',
        entity_type: 'customer',
        field_key: 'employee_count',
        field_label: 'Employee Count',
        field_type: 'select',
        description: 'Company size by number of employees',
        options: [
            { value: '1-10', label: '1-10 employees', color: '#10B981' },
            { value: '11-50', label: '11-50 employees', color: '#3B82F6' },
            { value: '51-200', label: '51-200 employees', color: '#8B5CF6' },
            { value: '201-500', label: '201-500 employees', color: '#F59E0B' },
            { value: '500+', label: '500+ employees', color: '#EF4444' }
        ],
        is_required: false,
        is_active: true,
        order: 4,
        show_in_list: false,
        show_in_card: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'cf_newsletter',
        organization_id: '00000000-0000-0000-0000-000000000000',
        entity_type: 'customer',
        field_key: 'newsletter_subscribed',
        field_label: 'Newsletter Subscribed',
        field_type: 'checkbox',
        description: 'Has the customer opted into newsletter?',
        is_required: false,
        is_active: true,
        default_value: false,
        order: 5,
        show_in_list: false,
        show_in_card: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

export const useCustomFieldsStore = create<CustomFieldsStore>((set, get) => ({
    fields: [],
    loading: false,
    error: null,

    fetchFields: async (entityType?: string) => {
        set({ loading: true, error: null });

        if (DEMO_MODE) {
            let fields = loadDemoData<CustomFieldDefinition>(DEMO_CUSTOM_FIELDS_KEY);

            // Initialize with default demo fields if empty
            if (fields.length === 0) {
                fields = DEFAULT_DEMO_FIELDS;
                saveDemoData(DEMO_CUSTOM_FIELDS_KEY, fields);
            }

            // Filter by entity type if specified
            if (entityType) {
                fields = fields.filter(f => f.entity_type === entityType);
            }

            set({ fields: fields.filter(f => f.is_active), loading: false });
            return;
        }

        try {
            let query = supabase
                .from('custom_field_definitions')
                .select('*')
                .eq('is_active', true)
                .order('order', { ascending: true });

            if (entityType) {
                query = query.eq('entity_type', entityType);
            }

            const { data, error } = await query;
            if (error) throw error;
            set({ fields: data || [], loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    createField: async (data: CustomFieldFormData, entityType: string) => {
        set({ loading: true, error: null });

        const fieldKey = data.field_key || generateFieldKey(data.field_label);
        const existingKeys = get().fields.map(f => f.field_key);

        // Check for duplicate key
        if (existingKeys.includes(fieldKey)) {
            set({ error: 'A field with this key already exists', loading: false });
            return null;
        }

        if (DEMO_MODE) {
            const newField: CustomFieldDefinition = {
                id: generateDemoId('cf'),
                organization_id: '00000000-0000-0000-0000-000000000000',
                entity_type: entityType as any,
                field_key: fieldKey,
                field_label: data.field_label,
                field_type: data.field_type,
                description: data.description,
                options: data.options,
                validation: data.validation,
                is_required: data.is_required,
                is_active: true,
                default_value: data.default_value,
                placeholder: data.placeholder,
                order: get().fields.length + 1,
                show_in_list: data.show_in_list,
                show_in_card: data.show_in_card,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const allFields = loadDemoData<CustomFieldDefinition>(DEMO_CUSTOM_FIELDS_KEY);
            saveDemoData(DEMO_CUSTOM_FIELDS_KEY, [...allFields, newField]);
            set(state => ({ fields: [...state.fields, newField], loading: false }));
            return newField;
        }

        try {
            const { data: createdField, error } = await supabase
                .from('custom_field_definitions')
                .insert({
                    ...data,
                    field_key: fieldKey,
                    entity_type: entityType,
                    is_active: true,
                    order: get().fields.length + 1
                })
                .select()
                .single();

            if (error) throw error;
            set(state => ({ fields: [...state.fields, createdField], loading: false }));
            return createdField;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return null;
        }
    },

    updateField: async (id: string, updates: Partial<CustomFieldFormData>) => {
        set({ loading: true, error: null });

        if (DEMO_MODE) {
            const allFields = loadDemoData<CustomFieldDefinition>(DEMO_CUSTOM_FIELDS_KEY);
            const index = allFields.findIndex(f => f.id === id);

            if (index !== -1) {
                allFields[index] = {
                    ...allFields[index],
                    ...updates,
                    updated_at: new Date().toISOString()
                };
                saveDemoData(DEMO_CUSTOM_FIELDS_KEY, allFields);
                set(state => ({
                    fields: state.fields.map(f => f.id === id ? allFields[index] : f),
                    loading: false
                }));
            }
            return;
        }

        try {
            const { error } = await supabase
                .from('custom_field_definitions')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                fields: state.fields.map(f =>
                    f.id === id ? { ...f, ...updates, updated_at: new Date().toISOString() } : f
                ),
                loading: false
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    deleteField: async (id: string) => {
        set({ loading: true, error: null });

        if (DEMO_MODE) {
            const allFields = loadDemoData<CustomFieldDefinition>(DEMO_CUSTOM_FIELDS_KEY);
            // Soft delete - mark as inactive
            const index = allFields.findIndex(f => f.id === id);
            if (index !== -1) {
                allFields[index].is_active = false;
                saveDemoData(DEMO_CUSTOM_FIELDS_KEY, allFields);
            }
            set(state => ({
                fields: state.fields.filter(f => f.id !== id),
                loading: false
            }));
            return;
        }

        try {
            // Soft delete
            const { error } = await supabase
                .from('custom_field_definitions')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
            set(state => ({
                fields: state.fields.filter(f => f.id !== id),
                loading: false
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    reorderFields: async (fieldIds: string[]) => {
        set({ loading: true, error: null });

        if (DEMO_MODE) {
            const allFields = loadDemoData<CustomFieldDefinition>(DEMO_CUSTOM_FIELDS_KEY);
            fieldIds.forEach((id, index) => {
                const field = allFields.find(f => f.id === id);
                if (field) field.order = index + 1;
            });
            saveDemoData(DEMO_CUSTOM_FIELDS_KEY, allFields);

            const currentFields = get().fields;
            const reorderedFields = fieldIds
                .map(id => currentFields.find(f => f.id === id))
                .filter(Boolean) as CustomFieldDefinition[];

            set({ fields: reorderedFields, loading: false });
            return;
        }

        try {
            // Batch update order
            const updates = fieldIds.map((id, index) => ({
                id,
                order: index + 1
            }));

            for (const update of updates) {
                await supabase
                    .from('custom_field_definitions')
                    .update({ order: update.order })
                    .eq('id', update.id);
            }

            const currentFields = get().fields;
            const reorderedFields = fieldIds
                .map(id => currentFields.find(f => f.id === id))
                .filter(Boolean) as CustomFieldDefinition[];

            set({ fields: reorderedFields, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    getFieldsByEntity: (entityType: string) => {
        return get().fields.filter(f => f.entity_type === entityType);
    },

    getFieldByKey: (key: string) => {
        return get().fields.find(f => f.field_key === key);
    }
}));
