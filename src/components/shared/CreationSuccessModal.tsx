import { CheckCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SuccessAction {
    label: string;
    path: string;
    icon: React.ReactNode;
    variant?: 'primary' | 'secondary';
}

interface CreationSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    itemName: string;
    itemNumber?: string;
    actions: SuccessAction[];
}

export default function CreationSuccessModal({
    isOpen,
    onClose,
    title,
    subtitle,
    itemName,
    itemNumber,
    actions
}: CreationSuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Success Header */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-8 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
                    {subtitle && <p className="text-green-100 text-sm">{subtitle}</p>}
                </div>

                {/* Item Info */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{itemName}</p>
                            {itemNumber && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">{itemNumber}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                        What would you like to do next?
                    </p>

                    {actions.map((action, index) => (
                        <Link
                            key={index}
                            to={action.path}
                            onClick={onClose}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${action.variant === 'primary'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            {action.icon}
                            {action.label}
                        </Link>
                    ))}

                    <button
                        onClick={onClose}
                        className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-2"
                    >
                        Stay on this page
                    </button>
                </div>
            </div>
        </div>
    );
}
