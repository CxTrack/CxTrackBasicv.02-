/**
 * CSV Import Wizard
 * Multi-step modal for importing customer data from CSV
 */

import React, { useState, useRef, useCallback } from 'react';
import {
    X, Upload, FileText, ArrowRight, Check, AlertTriangle,
    ChevronRight, RefreshCw, Database, ArrowLeft, Download
} from 'lucide-react';
import { useCustomerStore } from '@/stores/customerStore';
import {
    parseCSV,
    autoDetectMapping,
    getCRMFields,
    transformRowToCustomer,
    findDuplicates,
    validateImportData,
    DuplicateMatch
} from '@/utils/csv.utils';
import toast from 'react-hot-toast';

interface CSVImporterProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type ImportStep = 'upload' | 'map' | 'preview' | 'importing' | 'complete';

export const CSVImporter: React.FC<CSVImporterProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [csvData, setCsvData] = useState<{ headers: string[], rows: Record<string, string>[] } | null>(null);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update' | 'create'>('skip');
    const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
    const [importStats, setImportStats] = useState({ created: 0, updated: 0, skipped: 0, failed: 0 });

    const { customers, createCustomer, updateCustomer } = useCustomerStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setStep('upload');
        setFile(null);
        setCsvData(null);
        setMapping({});
        setDuplicates([]);
        setImportStats({ created: 0, updated: 0, skipped: 0, failed: 0 });
    };

    const handleClose = () => {
        if (step === 'importing') return;
        resetState();
        onClose();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
            toast.error('Please upload a valid CSV file');
            return;
        }

        setFile(selectedFile);

        // Parse CSV
        const text = await selectedFile.text();
        const parsed = parseCSV(text);

        if (parsed.headers.length === 0) {
            toast.error('CSV file appears to be empty or invalid');
            setFile(null);
            return;
        }

        setCsvData(parsed);

        // Auto-detect mapping
        const detectedMapping = autoDetectMapping(parsed.headers);
        setMapping(detectedMapping);

        setStep('map');
    };

    const handleMappingChange = (csvHeader: string, crmField: string) => {
        setMapping(prev => ({ ...prev, [csvHeader]: crmField }));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
            const text = await droppedFile.text();
            const parsed = parseCSV(text);
            setFile(droppedFile);
            setCsvData(parsed);
            setMapping(autoDetectMapping(parsed.headers));
            setStep('map');
        } else {
            toast.error('Please upload a valid CSV file');
        }
    };

    const continueToPreview = () => {
        // Validate that at least one field is mapped
        if (Object.values(mapping).every(v => !v)) {
            toast.error('Please map at least one field to continue');
            return;
        }

        // Check for duplicates
        if (csvData) {
            const foundDuplicates = findDuplicates(csvData.rows, mapping, customers);
            setDuplicates(foundDuplicates);
        }

        setStep('preview');
    };

    const executeImport = async () => {
        if (!csvData) return;

        setStep('importing');
        let created = 0;
        let updated = 0;
        let skipped = 0;
        let failed = 0;

        const duplicateIndices = new Set(duplicates.map(d => d.csvRowIndex));

        try {
            // Process non-duplicates
            for (let i = 0; i < csvData.rows.length; i++) {
                const row = csvData.rows[i];

                // Handle confirmed duplicates based on action
                if (duplicateIndices.has(i)) {
                    const duplicate = duplicates.find(d => d.csvRowIndex === i);

                    if (duplicateAction === 'skip') {
                        skipped++;
                        continue;
                    }

                    if (duplicateAction === 'update' && duplicate) {
                        try {
                            const updates = transformRowToCustomer(row, mapping);
                            await updateCustomer(duplicate.existingCustomer.id, updates);
                            updated++;
                        } catch (err) {
                            failed++;
                        }
                        continue;
                    }

                    // If 'create', fall through to creation logic
                }

                // Create new customer
                try {
                    const newCustomer = transformRowToCustomer(row, mapping);
                    // Add required fields
                    if (!newCustomer.organization_id) {
                        // Let the store/backend handle ID generation and org ID
                    }
                    await createCustomer(newCustomer as any);
                    created++;
                } catch (err) {
                    failed++;
                }
            }

            setImportStats({ created, updated, skipped, failed });
            setStep('complete');
            onSuccess();
        } catch (error) {
            toast.error('An error occurred during import');
            setStep('preview');
        }
    };

    const crmFields = getCRMFields();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Customers</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Add contacts from CSV</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center mb-8">
                        {['Upload', 'Map Fields', 'Preview', 'Finish'].map((label, i) => {
                            const stepIndex = ['upload', 'map', 'preview', 'complete'].indexOf(step);
                            const isCurrent = stepIndex === i;
                            const isCompleted = stepIndex > i;

                            return (
                                <div key={label} className="flex items-center">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                        isCurrent ? 'border-primary-600 text-primary-600' :
                                            'border-gray-300 text-gray-300'
                                        }`}>
                                        {isCompleted ? <Check size={16} /> : <span>{i + 1}</span>}
                                    </div>
                                    <span className={`ml-2 text-sm font-medium ${isCurrent ? 'text-primary-600' : 'text-gray-500'
                                        }`}>{label}</span>
                                    {i < 3 && (
                                        <div className={`w-12 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                            }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* STEP 1: UPLOAD */}
                    {step === 'upload' && (
                        <div
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-primary-500 dark:hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                accept=".csv"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600 dark:text-primary-400">
                                <Upload size={40} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Drop your CSV file here
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                or click to browse from your computer
                            </p>
                            <div className="flex justify-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1"><FileText size={16} /> .CSV format</span>
                                <span className="flex items-center gap-1"><Database size={16} /> Max 5MB</span>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: MAP FIELDS */}
                    {step === 'map' && csvData && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                                <AlertTriangle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Smart Mapping Active</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        We've automatically matched fields based on your CSV headers. Please review and adjust as needed.
                                    </p>
                                </div>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">CSV Header</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Preview (Row 1)</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Map To Field</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {csvData.headers.map((header) => {
                                            const sampleValue = csvData.rows[0]?.[header] || '';

                                            return (
                                                <tr key={header} className="bg-white dark:bg-gray-800">
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{header}</td>
                                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                        {sampleValue}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={mapping[header] || ''}
                                                            onChange={(e) => handleMappingChange(header, e.target.value)}
                                                            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 ${mapping[header]
                                                                ? 'border-green-300 bg-green-50 dark:bg-green-900/10 text-green-800 dark:text-green-300'
                                                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                                                }`}
                                                        >
                                                            <option value="">Do not import</option>
                                                            {crmFields.map(field => (
                                                                <option key={field.key} value={field.key}>
                                                                    {field.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PREVIEW */}
                    {step === 'preview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{csvData?.rows.length}</div>
                                    <div className="text-sm text-gray-500">Total Contacts</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-green-600">{Object.keys(mapping).filter(k => mapping[k]).length}</div>
                                    <div className="text-sm text-gray-500">Fields Mapped</div>
                                </div>
                                <div className={`p-4 rounded-xl text-center ${duplicates.length > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-700/50'
                                    }`}>
                                    <div className={`text-2xl font-bold ${duplicates.length > 0 ? 'text-orange-600' : 'text-gray-900 dark:text-white'
                                        }`}>{duplicates.length}</div>
                                    <div className="text-sm text-gray-500">Duplicates</div>
                                </div>
                            </div>

                            {duplicates.length > 0 && (
                                <div className="border border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-900/10 rounded-xl p-6">
                                    <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-4 flex items-center gap-2">
                                        <AlertTriangle size={20} />
                                        Duplicate Action
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-100 dark:border-orange-900/30 cursor-pointer hover:border-orange-300">
                                            <input
                                                type="radio"
                                                name="duplicateAction"
                                                value="skip"
                                                checked={duplicateAction === 'skip'}
                                                onChange={(e) => setDuplicateAction(e.target.value as any)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <span className="block font-medium text-gray-900 dark:text-white">Skip duplicates</span>
                                                <span className="text-sm text-gray-500">Do not import existing contacts (safest)</span>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-100 dark:border-orange-900/30 cursor-pointer hover:border-orange-300">
                                            <input
                                                type="radio"
                                                name="duplicateAction"
                                                value="update"
                                                checked={duplicateAction === 'update'}
                                                onChange={(e) => setDuplicateAction(e.target.value as any)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <span className="block font-medium text-gray-900 dark:text-white">Update existing</span>
                                                <span className="text-sm text-gray-500">Overwrite existing records with new data</span>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-100 dark:border-orange-900/30 cursor-pointer hover:border-orange-300">
                                            <input
                                                type="radio"
                                                name="duplicateAction"
                                                value="create"
                                                checked={duplicateAction === 'create'}
                                                onChange={(e) => setDuplicateAction(e.target.value as any)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <span className="block font-medium text-gray-900 dark:text-white">Create specific duplicates</span>
                                                <span className="text-sm text-gray-500">Import as new records anyway</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: IMPORTING / COMPLETE */}
                    {step === 'importing' && (
                        <div className="text-center py-12">
                            <div className="animate-spin w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Importing Contacts...</h3>
                            <p className="text-gray-500">Please wait while we process your file.</p>
                        </div>
                    )}

                    {step === 'complete' && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                                <Check size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Import Complete!</h3>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{importStats.created}</div>
                                    <div className="text-sm text-green-700 dark:text-green-300">Created</div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{importStats.updated}</div>
                                    <div className="text-sm text-blue-700 dark:text-blue-300">Updated</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{importStats.skipped}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">Skipped</div>
                                </div>
                                {importStats.failed > 0 && (
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{importStats.failed}</div>
                                        <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                    {step === 'upload' ? (
                        <button
                            onClick={() => { }}
                            className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1"
                        >
                            <Download size={16} /> Download CSV Template
                        </button>
                    ) : step !== 'importing' && step !== 'complete' && (
                        <button
                            onClick={() => step === 'preview' ? setStep('map') : setStep('upload')}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft size={18} /> Back
                        </button>
                    )}

                    <div className="flex gap-3 ml-auto">
                        {step === 'complete' ? (
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Done
                            </button>
                        ) : step === 'upload' ? (
                            // Upload handled by dropzone/click
                            null
                        ) : step === 'map' ? (
                            <button
                                onClick={continueToPreview}
                                className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue <ArrowRight size={18} />
                            </button>
                        ) : step === 'preview' ? (
                            <button
                                onClick={executeImport}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Import {csvData ? csvData.rows.length : 0} Customers <Check size={18} />
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CSVImporter;
