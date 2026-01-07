/**
 * Custom Fields Panel
 * Full management UI for custom fields (like Salesforce/GoHighLevel)
 */

import React, { useState, useEffect } from 'react';
import {
    X, Plus, GripVertical, Edit2, Trash2, Eye, EyeOff,
    Type, Hash, Calendar, ChevronDown, CheckSquare, Link,
    Phone, Mail, DollarSign, AlignLeft, Clock, ToggleLeft,
    Save, AlertCircle
} from 'lucide-react';
import { useCustomFieldsStore } from '@/stores/customFieldsStore';
import {
    CustomFieldDefinition,
    CustomFieldType,
    FIELD_TYPE_CONFIG,
    CustomFieldFormData,
    SelectOption
} from '@/types/customFields.types';
import toast from 'react-hot-toast';

interface CustomFieldsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    entityType?: string;
}

// Icon mapping for field types
const getFieldIcon = (type: CustomFieldType) => {
    const icons: Record<CustomFieldType, React.ComponentType<any>> = {
        text: Type,
        textarea: AlignLeft,
        number: Hash,
        currency: DollarSign,
        date: Calendar,
        datetime: Clock,
        select: ChevronDown,
        multiselect: CheckSquare,
        checkbox: ToggleLeft,
        url: Link,
        phone: Phone,
        email: Mail
    };
    return icons[type] || Type;
};

export const CustomFieldsPanel: React.FC<CustomFieldsPanelProps> = ({
    isOpen,
    onClose,
    entityType = 'customer'
}) => {
    const { fields, loading, fetchFields, createField, updateField, deleteField } = useCustomFieldsStore();
    const [showEditor, setShowEditor] = useState(false);
    const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
    const [formData, setFormData] = useState<CustomFieldFormData>({
        field_label: '',
        field_type: 'text',
        description: '',
        is_required: false,
        show_in_list: false,
        show_in_card: true,
        options: []
    });

    useEffect(() => {
        if (isOpen) {
            fetchFields(entityType);
        }
    }, [isOpen, entityType]);

    const handleAddField = () => {
        setEditingField(null);
        setFormData({
            field_label: '',
            field_type: 'text',
            description: '',
            is_required: false,
            show_in_list: false,
            show_in_card: true,
            options: []
        });
        setShowEditor(true);
    };

    const handleEditField = (field: CustomFieldDefinition) => {
        setEditingField(field);
        setFormData({
            field_label: field.field_label,
            field_type: field.field_type,
            description: field.description || '',
            is_required: field.is_required,
            show_in_list: field.show_in_list,
            show_in_card: field.show_in_card,
            options: field.options || [],
            placeholder: field.placeholder,
            default_value: field.default_value
        });
        setShowEditor(true);
    };

    const handleSaveField = async () => {
        if (!formData.field_label.trim()) {
            toast.error('Field label is required');
            return;
        }

        if (editingField) {
            await updateField(editingField.id, formData);
            toast.success('Field updated');
        } else {
            const result = await createField(formData, entityType);
            if (result) {
                toast.success('Field created');
            }
        }
        setShowEditor(false);
    };

    const handleDeleteField = async (field: CustomFieldDefinition) => {
        if (confirm(`Delete "${field.field_label}"? This cannot be undone.`)) {
            await deleteField(field.id);
            toast.success('Field deleted');
        }
    };

    const addOption = () => {
        setFormData(prev => ({
            ...prev,
            options: [...(prev.options || []), { value: '', label: '', color: '#6B7280' }]
        }));
    };

    const updateOption = (index: number, updates: Partial<SelectOption>) => {
        setFormData(prev => ({
            ...prev,
            options: prev.options?.map((opt, i) => i === index ? { ...opt, ...updates } : opt) || []
        }));
    };

    const removeOption = (index: number) => {
        setFormData(prev => ({
            ...prev,
            options: prev.options?.filter((_, i) => i !== index) || []
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-500 to-primary-600">
                    <div>
                        <h2 className="text-xl font-bold text-white">Custom Fields</h2>
                        <p className="text-sm text-primary-100">Add and manage custom data fields for {entityType}s</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!showEditor ? (
                        <>
                            {/* Add Field Button */}
                            <button
                                onClick={handleAddField}
                                className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all group"
                            >
                                <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                    <Plus size={20} />
                                    <span className="font-medium">Add Custom Field</span>
                                </div>
                            </button>

                            {/* Fields List */}
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
                                    <p className="text-gray-500">Loading fields...</p>
                                </div>
                            ) : fields.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Type size={32} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Custom Fields</h3>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                        Custom fields let you track additional information specific to your business.
                                        Click "Add Custom Field" to get started.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {fields.map((field) => {
                                        const Icon = getFieldIcon(field.field_type);
                                        const config = FIELD_TYPE_CONFIG[field.field_type];

                                        return (
                                            <div
                                                key={field.id}
                                                className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-primary-500/50 transition-all"
                                            >
                                                <div className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                    <GripVertical size={20} />
                                                </div>

                                                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                                    <Icon size={20} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-900 dark:text-white">{field.field_label}</span>
                                                        {field.is_required && (
                                                            <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium rounded">
                                                                Required
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                                                            {config.label}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-mono">{field.field_key}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditField(field)}
                                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} className="text-gray-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteField(field)}
                                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} className="text-red-500" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-2 text-gray-400">
                                                    {field.show_in_list ? (
                                                        <Eye size={16} title="Shown in list" />
                                                    ) : (
                                                        <EyeOff size={16} title="Hidden in list" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Field Editor */
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {editingField ? 'Edit Field' : 'New Custom Field'}
                                </h3>
                                <button
                                    onClick={() => setShowEditor(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Field Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Field Type
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(Object.entries(FIELD_TYPE_CONFIG) as [CustomFieldType, typeof FIELD_TYPE_CONFIG[CustomFieldType]][]).map(([type, config]) => {
                                        const Icon = getFieldIcon(type);
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => setFormData(prev => ({ ...prev, field_type: type }))}
                                                className={`p-3 rounded-lg border-2 transition-all ${formData.field_type === type
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/20'
                                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                                    }`}
                                            >
                                                <Icon size={20} className={formData.field_type === type ? 'text-primary-600 mx-auto' : 'text-gray-400 mx-auto'} />
                                                <span className={`block text-xs mt-1 ${formData.field_type === type ? 'text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {config.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Field Label */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Field Label <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.field_label}
                                    onChange={(e) => setFormData(prev => ({ ...prev, field_label: e.target.value }))}
                                    placeholder="e.g., Referral Source"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description (Help Text)
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="e.g., How did this customer find us?"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            {/* Options for Select/Multiselect */}
                            {(formData.field_type === 'select' || formData.field_type === 'multiselect') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Options
                                    </label>
                                    <div className="space-y-2">
                                        {formData.options?.map((option, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={option.color || '#6B7280'}
                                                    onChange={(e) => updateOption(index, { color: e.target.value })}
                                                    className="w-8 h-8 rounded cursor-pointer border-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={option.label}
                                                    onChange={(e) => updateOption(index, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                                    placeholder="Option label"
                                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                />
                                                <button
                                                    onClick={() => removeOption(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={addOption}
                                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                                        >
                                            <Plus size={14} /> Add Option
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Toggles */}
                            <div className="grid grid-cols-3 gap-4">
                                <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_required}
                                        onChange={(e) => setFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.show_in_list}
                                        onChange={(e) => setFormData(prev => ({ ...prev, show_in_list: e.target.checked }))}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Show in List</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.show_in_card}
                                        onChange={(e) => setFormData(prev => ({ ...prev, show_in_card: e.target.checked }))}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Show on Profile</span>
                                </label>
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowEditor(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveField}
                                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                                >
                                    <Save size={18} />
                                    {editingField ? 'Update Field' : 'Create Field'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomFieldsPanel;
