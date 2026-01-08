/**
 * Tour Guide Component
 * Renders the interactive onboarding tour overlay
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, ChevronLeft, Sparkles } from 'lucide-react';
import { TourManager, tours, TourStep } from '@/lib/tourManager';

interface TourGuideProps {
    tourId: string;
    onComplete?: () => void;
}

export const TourGuide: React.FC<TourGuideProps> = ({ tourId, onComplete }) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

    const tour = tours[tourId];

    useEffect(() => {
        checkAndStartTour();
    }, [tourId]);

    const checkAndStartTour = async () => {
        const hasCompleted = await TourManager.hasCompletedTour(tourId);
        if (!hasCompleted && tour?.autoStart) {
            // Small delay to let page render
            setTimeout(() => setIsActive(true), 500);
        }
    };

    const updateHighlight = useCallback(() => {
        if (!isActive || !tour) return;

        const step = tour.steps[currentStep];
        if (step.position === 'center') {
            setHighlightRect(null);
            return;
        }

        const element = document.querySelector(step.element) as HTMLElement;
        if (element) {
            const rect = element.getBoundingClientRect();
            setHighlightRect(rect);
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            setHighlightRect(null);
        }
    }, [currentStep, isActive, tour]);

    useEffect(() => {
        updateHighlight();
        window.addEventListener('resize', updateHighlight);
        return () => window.removeEventListener('resize', updateHighlight);
    }, [updateHighlight]);

    const handleNext = () => {
        if (currentStep < tour.steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        await TourManager.markTourCompleted(tourId);
        setIsActive(false);
        onComplete?.();
    };

    const handleSkip = async () => {
        await TourManager.markTourCompleted(tourId);
        setIsActive(false);
        onComplete?.();
    };

    if (!isActive || !tour) return null;

    const step = tour.steps[currentStep];

    return createPortal(
        <div className="fixed inset-0 z-[9998]">
            {/* Dark overlay with spotlight cutout */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Spotlight highlight */}
            {highlightRect && (
                <div
                    className="absolute pointer-events-none transition-all duration-300 ease-out"
                    style={{
                        top: highlightRect.top - 8,
                        left: highlightRect.left - 8,
                        width: highlightRect.width + 16,
                        height: highlightRect.height + 16,
                        border: '3px solid #3b82f6',
                        borderRadius: '12px',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 30px rgba(59, 130, 246, 0.5)',
                        zIndex: 9999,
                    }}
                />
            )}

            {/* Tour Card */}
            <div
                className="absolute z-[10000] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 p-6 max-w-md w-[90vw] animate-fade-in"
                style={getTooltipPosition(highlightRect, step.position)}
            >
                {/* Decorative accent */}
                <div className="absolute -top-1 left-6 right-6 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full" />

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                {tour.name}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {step.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            {step.description}
                        </p>
                    </div>
                    {step.skipButton && (
                        <button
                            onClick={handleSkip}
                            className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            aria-label="Skip tour"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                </div>

                {/* Progress */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>Step {currentStep + 1} of {tour.steps.length}</span>
                        <button
                            onClick={handleSkip}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Skip tour
                        </button>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${((currentStep + 1) / tour.steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step indicators */}
                <div className="flex justify-center gap-1.5 mb-4">
                    {tour.steps.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentStep
                                    ? 'w-6 bg-blue-600'
                                    : index < currentStep
                                        ? 'bg-blue-400'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {currentStep > 0 && (
                        <button
                            onClick={handlePrevious}
                            className="px-4 py-2.5 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 font-medium transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                    >
                        {step.nextButton}
                        {currentStep < tour.steps.length - 1 && <ArrowRight className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

/**
 * Calculate tooltip position based on highlighted element
 */
function getTooltipPosition(
    rect: DOMRect | null,
    position: TourStep['position']
): React.CSSProperties {
    // Center position (welcome screen)
    if (!rect || position === 'center') {
        return {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
        };
    }

    const margin = 24;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    switch (position) {
        case 'top':
            return {
                bottom: viewportHeight - rect.top + margin,
                left: Math.max(20, Math.min(rect.left + rect.width / 2, viewportWidth - 220)),
                transform: 'translateX(-50%)',
            };
        case 'right':
            return {
                top: Math.max(20, Math.min(rect.top + rect.height / 2, viewportHeight - 200)),
                left: rect.right + margin,
                transform: 'translateY(-50%)',
            };
        case 'bottom':
            return {
                top: rect.bottom + margin,
                left: Math.max(20, Math.min(rect.left + rect.width / 2, viewportWidth - 220)),
                transform: 'translateX(-50%)',
            };
        case 'left':
            return {
                top: Math.max(20, Math.min(rect.top + rect.height / 2, viewportHeight - 200)),
                right: viewportWidth - rect.left + margin,
                transform: 'translateY(-50%)',
            };
        default:
            return {
                top: rect.bottom + margin,
                left: rect.left,
            };
    }
}

/**
 * Hook to manually trigger a tour
 */
export const useTour = () => {
    const [activeTour, setActiveTour] = useState<string | null>(null);

    const startTour = async (tourId: string) => {
        await TourManager.clearTourProgress(tourId);
        setActiveTour(tourId);
    };

    const endTour = () => {
        setActiveTour(null);
    };

    return {
        activeTour,
        startTour,
        endTour,
        TourComponent: activeTour ? (
            <TourGuide tourId={activeTour} onComplete={endTour} />
        ) : null,
    };
};

export default TourGuide;
