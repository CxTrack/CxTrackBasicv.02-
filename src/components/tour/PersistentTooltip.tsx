/**
 * Persistent Tooltip Component
 * Shows contextual help that remains until manually dismissed
 */

import React, { useState, useEffect } from 'react';
import { X, Lightbulb, Sparkles, Zap, Info } from 'lucide-react';
import { TourManager } from '@/lib/tourManager';

interface PersistentTooltipProps {
    id: string;
    title: string;
    description: string;
    position?: 'top' | 'right' | 'bottom' | 'left';
    type?: 'info' | 'tip' | 'feature' | 'new';
    children?: React.ReactNode;
}

export const PersistentTooltip: React.FC<PersistentTooltipProps> = ({
    id,
    title,
    description,
    position = 'top',
    type = 'info',
    children,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        checkVisibility();
    }, [id]);

    const checkVisibility = async () => {
        const shouldShow = await TourManager.shouldShowTooltip(id);
        if (shouldShow) {
            setIsVisible(true);
            // Trigger entrance animation
            setTimeout(() => setIsAnimating(true), 100);
        }
    };

    const handleDismiss = async () => {
        setIsAnimating(false);
        // Wait for exit animation
        setTimeout(async () => {
            await TourManager.dismissTooltip(id);
            setIsVisible(false);
        }, 200);
    };

    const icons = {
        info: Info,
        tip: Lightbulb,
        feature: Sparkles,
        new: Zap,
    };

    const gradients = {
        info: 'from-blue-500 to-blue-600',
        tip: 'from-amber-500 to-orange-500',
        feature: 'from-purple-500 to-pink-500',
        new: 'from-green-500 to-emerald-500',
    };

    const Icon = icons[type];
    const gradient = gradients[type];

    return (
        <div className="relative inline-block">
            {children}

            {isVisible && (
                <div
                    className={`
            absolute z-50 w-80
            bg-gradient-to-br ${gradient}
            rounded-2xl shadow-2xl p-5
            text-white
            transition-all duration-200
            ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            ${getPositionClasses(position)}
          `}
                >
                    {/* Arrow pointing to element */}
                    <div
                        className={`
              absolute w-4 h-4 
              bg-gradient-to-br ${gradient} 
              rotate-45
              ${getArrowClasses(position)}
            `}
                    />

                    <div className="relative">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-lg mb-1 leading-tight">{title}</h4>
                                <p className="text-white/90 text-sm leading-relaxed">{description}</p>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="w-7 h-7 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                                aria-label="Dismiss"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Dismiss button */}
                        <button
                            onClick={handleDismiss}
                            className="w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
                        >
                            Got it, don't show again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Floating tooltip that can be placed anywhere
 */
export const FloatingTooltip: React.FC<PersistentTooltipProps> = (props) => {
    return (
        <div className="absolute">
            <PersistentTooltip {...props} />
        </div>
    );
};

function getPositionClasses(position: string): string {
    switch (position) {
        case 'top':
            return 'bottom-full left-1/2 -translate-x-1/2 mb-3';
        case 'right':
            return 'left-full top-1/2 -translate-y-1/2 ml-3';
        case 'bottom':
            return 'top-full left-1/2 -translate-x-1/2 mt-3';
        case 'left':
            return 'right-full top-1/2 -translate-y-1/2 mr-3';
        default:
            return 'bottom-full mb-3';
    }
}

function getArrowClasses(position: string): string {
    switch (position) {
        case 'top':
            return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2';
        case 'right':
            return 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2';
        case 'bottom':
            return 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2';
        case 'left':
            return 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2';
        default:
            return 'bottom-0 translate-y-1/2';
    }
}

export default PersistentTooltip;
