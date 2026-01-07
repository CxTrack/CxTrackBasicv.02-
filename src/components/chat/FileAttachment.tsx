import React, { useRef, useState } from 'react';
import { Paperclip, X, Image, FileText, Film, Music, File } from 'lucide-react';

interface FileAttachmentProps {
    onFileSelect: (file: File) => void;
    disabled?: boolean;
}

interface FilePreviewProps {
    file: File;
    onRemove: () => void;
}

const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image size={20} className="text-blue-500" />;
    if (fileType.startsWith('video/')) return <Film size={20} className="text-purple-500" />;
    if (fileType.startsWith('audio/')) return <Music size={20} className="text-green-500" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText size={20} className="text-red-500" />;
    return <File size={20} className="text-gray-500" />;
};

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FileAttachmentButton: React.FC<FileAttachmentProps> = ({ onFileSelect, disabled }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
            e.target.value = ''; // Reset input
        }
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handleChange}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <button
                type="button"
                onClick={handleClick}
                disabled={disabled}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                title="Attach file"
            >
                <Paperclip size={20} />
            </button>
        </>
    );
};

export const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    React.useEffect(() => {
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    return (
        <div className="relative inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-2 pr-3 max-w-[200px] group">
            {/* Preview or Icon */}
            {previewUrl ? (
                <img
                    src={previewUrl}
                    alt={file.name}
                    className="w-10 h-10 rounded-lg object-cover"
                />
            ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    {getFileIcon(file.type)}
                </div>
            )}

            {/* File Info */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                </p>
            </div>

            {/* Remove Button */}
            <button
                onClick={onRemove}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
                <X size={12} />
            </button>
        </div>
    );
};

export default FileAttachmentButton;
