/**
 * Subtle Onboarding Hints
 * Minimalist, non-intrusive contextual guidance
 * Inspired by Apple's design philosophy
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';
import { TourManager } from '@/lib/tourManager';
import Cookies from 'js-cookie';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface HintProps {
    id: string;
    children: React.ReactNode;
    hint: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

// ═══════════════════════════════════════════════════════════════════════
// SUBTLE HINT COMPONENT - Appears next to elements
// ═══════════════════════════════════════════════════════════════════════

export const SubtleHint: React.FC<HintProps> = ({
    id,
    children,
    hint,
    position = 'right'
}) => {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        checkVisibility();
    }, [id]);

    const checkVisibility = async () => {
        // Check if cookies accepted first
        if (!Cookies.get('cookies_accepted')) return;

        const shouldShow = await TourManager.shouldShowTooltip(id);
        setDismissed(!shouldShow);
        if (shouldShow) {
            // Small delay before showing
            setTimeout(() => setVisible(true), 800);
        }
    };

    const handleDismiss = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setVisible(false);
        await TourManager.dismissTooltip(id);
        setDismissed(true);
    };

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    return (
        <div className="relative inline-flex">
            {children}

            {visible && !dismissed && (
                <div
                    className={`
            absolute z-50 ${positionClasses[position]}
            bg-gray-900 dark:bg-white
            text-white dark:text-gray-900
            text-xs font-medium
            px-3 py-2 rounded-lg
            shadow-lg
            max-w-[200px]
            animate-fade-in
            flex items-center gap-2
          `}
                >
                    <span className="leading-tight">{hint}</span>
                    <button
                        onClick={handleDismiss}
                        className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                        <X size={12} />
                    </button>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// COPILOT INTRODUCTION - First thing users see, minimal and helpful
// ═══════════════════════════════════════════════════════════════════════

export const CoPilotIntro: React.FC = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        checkAndShow();
    }, []);

    const checkAndShow = async () => {
        // Wait for cookies acceptance
        if (!Cookies.get('cookies_accepted')) return;

        const hasSeenIntro = await TourManager.hasCompletedTour('copilot_intro');
        if (!hasSeenIntro) {
            setTimeout(() => setVisible(true), 1200);
        }
    };

    const handleDismiss = async () => {
        setVisible(false);
        await TourManager.markTourCompleted('copilot_intro');
    };

    if (!visible) return null;

    return createPortal(
        <div
            className="fixed bottom-24 right-6 z-[100] animate-slide-up"
            style={{ maxWidth: '280px' }}
        >
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800">
                <div className="p-4">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
                            <Sparkles size={12} className="text-white" />
                        </div>
                        <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
                            Your AI assistant
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3 pl-[34px]">
                        Need help? Click the purple button below anytime.
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pl-[34px]">
                        <span className="text-[11px] text-gray-400">→ On your right</span>
                        <button
                            onClick={handleDismiss}
                            className="text-[11px] text-violet-600 dark:text-violet-400 font-medium hover:underline"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ═══════════════════════════════════════════════════════════════════════
// FEATURE INDICATOR - Tiny dot that shows new/helpful features
// ═══════════════════════════════════════════════════════════════════════

interface FeatureIndicatorProps {
    id: string;
    children: React.ReactNode;
    label?: string;
}

export const FeatureIndicator: React.FC<FeatureIndicatorProps> = ({
    id,
    children,
    label
}) => {
    const [showDot, setShowDot] = useState(false);
    const [showLabel, setShowLabel] = useState(false);

    useEffect(() => {
        checkVisibility();
    }, [id]);

    const checkVisibility = async () => {
        if (!Cookies.get('cookies_accepted')) return;

        const shouldShow = await TourManager.shouldShowTooltip(`feature_${id}`);
        setShowDot(shouldShow);
    };

    const handleClick = async () => {
        if (showDot && label) {
            setShowLabel(true);
            // Auto-hide after showing
            setTimeout(async () => {
                setShowLabel(false);
                setShowDot(false);
                await TourManager.dismissTooltip(`feature_${id}`);
            }, 3000);
        }
    };

    return (
        <div className="relative inline-flex" onClick={handleClick}>
            {children}

            {/* Small indicator dot */}
            {showDot && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}

            {/* Brief label on click */}
            {showLabel && label && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                    <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                        {label}
                    </div>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// INLINE TIP - Shows next to cursor/interaction
// ═══════════════════════════════════════════════════════════════════════

interface InlineTipProps {
    id: string;
    tip: string;
    show: boolean;
    onDismiss?: () => void;
}

export const InlineTip: React.FC<InlineTipProps> = ({
    id,
    tip,
    show,
    onDismiss
}) => {
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        checkDismissed();
    }, [id]);

    const checkDismissed = async () => {
        const wasDismissed = !(await TourManager.shouldShowTooltip(`tip_${id}`));
        setDismissed(wasDismissed);
    };

    const handleDismiss = async () => {
        await TourManager.dismissTooltip(`tip_${id}`);
        setDismissed(true);
        onDismiss?.();
    };

    if (!show || dismissed) return null;

    return (
        <div className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 ml-2">
            <span>{tip}</span>
            <button
                onClick={handleDismiss}
                className="opacity-60 hover:opacity-100"
            >
                <X size={10} />
            </button>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS (add to your global CSS)
// ═══════════════════════════════════════════════════════════════════════

/*
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
*/

export default SubtleHint;
