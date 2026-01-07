/**
 * Custom Fields Type Definitions
 * Inspired by Salesforce, GoHighLevel, Monday.com
 */

// Supported field types
export type CustomFieldType =
    | 'text'
    | 'textarea'
    | 'number'
    | 'currency'
    | 'date'
    | 'datetime'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'url'
    | 'phone'
    | 'email';

// Custom field definition schema
export interface CustomFieldDefinition {
    id: string;
    organization_id: string;
    entity_type: 'customer' | 'lead' | 'opportunity' | 'product'; // Which entity this field applies to
    field_key: string;           // Unique key, e.g., "referral_source"
    field_label: string;         // Display label, e.g., "Referral Source"
    field_type: CustomFieldType;
    description?: string;        // Help text for the field
    options?: SelectOption[];    // For select/multiselect types
    validation?: FieldValidation;
    is_required: boolean;
    is_active: boolean;          // Soft delete / disable field
    default_value?: any;
    placeholder?: string;
    order: number;               // Display order in forms
    show_in_list: boolean;       // Show as column in list view
    show_in_card: boolean;       // Show on customer card/profile
    created_at: string;
    updated_at: string;
}

// Select/multiselect option
export interface SelectOption {
    value: string;
    label: string;
    color?: string;              // Optional color for visual distinction
}

// Field validation rules
export interface FieldValidation {
    min_length?: number;
    max_length?: number;
    min_value?: number;
    max_value?: number;
    pattern?: string;            // Regex pattern
    pattern_message?: string;    // Custom error for pattern mismatch
}

// Custom field value stored in customer.custom_fields
export interface CustomFieldValue {
    field_id: string;
    value: any;
    updated_at: string;
}

// Field group for organizing related fields
export interface CustomFieldGroup {
    id: string;
    organization_id: string;
    entity_type: 'customer' | 'lead' | 'opportunity' | 'product';
    group_name: string;
    group_icon?: string;
    order: number;
    field_ids: string[];
    is_collapsed_by_default: boolean;
    created_at: string;
    updated_at: string;
}

// Form for creating/editing a custom field
export interface CustomFieldFormData {
    field_label: string;
    field_key?: string;          // Auto-generated from label if not provided
    field_type: CustomFieldType;
    description?: string;
    options?: SelectOption[];
    is_required: boolean;
    default_value?: any;
    placeholder?: string;
    show_in_list: boolean;
    show_in_card: boolean;
    validation?: FieldValidation;
}

// Preset field type configurations
export const FIELD_TYPE_CONFIG: Record<CustomFieldType, {
    icon: string;
    label: string;
    description: string;
    hasOptions: boolean;
    defaultPlaceholder?: string;
}> = {
    text: {
        icon: 'Type',
        label: 'Text',
        description: 'Single line text input',
        hasOptions: false,
        defaultPlaceholder: 'Enter text...'
    },
    textarea: {
        icon: 'AlignLeft',
        label: 'Long Text',
        description: 'Multi-line text area',
        hasOptions: false,
        defaultPlaceholder: 'Enter detailed text...'
    },
    number: {
        icon: 'Hash',
        label: 'Number',
        description: 'Numeric value',
        hasOptions: false,
        defaultPlaceholder: '0'
    },
    currency: {
        icon: 'DollarSign',
        label: 'Currency',
        description: 'Money field with formatting',
        hasOptions: false,
        defaultPlaceholder: '$0.00'
    },
    date: {
        icon: 'Calendar',
        label: 'Date',
        description: 'Date picker',
        hasOptions: false
    },
    datetime: {
        icon: 'Clock',
        label: 'Date & Time',
        description: 'Date and time picker',
        hasOptions: false
    },
    select: {
        icon: 'ChevronDown',
        label: 'Dropdown',
        description: 'Single selection from options',
        hasOptions: true,
        defaultPlaceholder: 'Select an option...'
    },
    multiselect: {
        icon: 'CheckSquare',
        label: 'Multi-Select',
        description: 'Multiple selections from options',
        hasOptions: true,
        defaultPlaceholder: 'Select options...'
    },
    checkbox: {
        icon: 'ToggleLeft',
        label: 'Checkbox',
        description: 'Yes/No toggle',
        hasOptions: false
    },
    url: {
        icon: 'Link',
        label: 'URL',
        description: 'Website link',
        hasOptions: false,
        defaultPlaceholder: 'https://'
    },
    phone: {
        icon: 'Phone',
        label: 'Phone',
        description: 'Phone number with formatting',
        hasOptions: false,
        defaultPlaceholder: '+1 (555) 000-0000'
    },
    email: {
        icon: 'Mail',
        label: 'Email',
        description: 'Email address',
        hasOptions: false,
        defaultPlaceholder: 'email@example.com'
    }
};

// Generate field key from label (like Salesforce API names)
export const generateFieldKey = (label: string): string => {
    return label
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 40);
};

// Validate field key uniqueness
export const isValidFieldKey = (key: string, existingKeys: string[]): boolean => {
    return !existingKeys.includes(key) && /^[a-z][a-z0-9_]*$/.test(key);
};
