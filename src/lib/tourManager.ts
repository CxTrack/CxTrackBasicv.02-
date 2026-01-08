/**
 * Tour Manager
 * Manages onboarding tours, persistent tooltips, and help system
 * Uses localStorage in demo mode, Supabase in production
 */

import Cookies from 'js-cookie';
import { DEMO_MODE } from '@/config/demo.config';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface TourStep {
    id: string;
    title: string;
    description: string;
    element: string; // CSS selector
    position: 'top' | 'right' | 'bottom' | 'left' | 'center';
    nextButton: string;
    skipButton?: boolean;
    action?: () => void;
}

export interface Tour {
    id: string;
    name: string;
    steps: TourStep[];
    autoStart: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// TOUR DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════

export const tours: Record<string, Tour> = {
    first_login: {
        id: 'first_login',
        name: 'Welcome to CxTrack',
        autoStart: true,
        steps: [
            {
                id: 'welcome',
                title: '👋 Welcome to CxTrack!',
                description: "Let's take a quick tour to help you get started. This will only take 2 minutes.",
                element: 'body',
                position: 'center',
                nextButton: 'Start Tour',
                skipButton: true,
            },
            {
                id: 'sidebar',
                title: '📱 Navigation Sidebar',
                description: 'Access all your CRM features from here. Customers, Calendar, Pipeline, Quotes, Invoices, and more.',
                element: '[data-tour="sidebar"]',
                position: 'right',
                nextButton: 'Next',
            },
            {
                id: 'customers',
                title: '👥 Customer Management',
                description: 'Add and manage all your customers here. Track contact details, communication history, and deals.',
                element: '[data-tour="customers"]',
                position: 'right',
                nextButton: 'Next',
            },
            {
                id: 'pipeline',
                title: '🎯 Sales Pipeline',
                description: 'Visualize your entire sales process. Drag deals between stages and track revenue in real-time.',
                element: '[data-tour="pipeline"]',
                position: 'right',
                nextButton: 'Next',
            },
            {
                id: 'calendar',
                title: '📅 Calendar & Scheduling',
                description: 'Schedule appointments, set reminders, and manage your time effectively.',
                element: '[data-tour="calendar"]',
                position: 'right',
                nextButton: 'Next',
            },
            {
                id: 'copilot',
                title: '✨ AI CoPilot',
                description: 'Your AI assistant is always here to help. Click the purple button to ask questions, get insights, or automate tasks.',
                element: '[data-tour="copilot"]',
                position: 'left',
                nextButton: 'Got it!',
            },
        ],
    },

    dashboard: {
        id: 'dashboard',
        name: 'Dashboard Tour',
        autoStart: false,
        steps: [
            {
                id: 'quick_stats',
                title: '📈 Quick Stats',
                description: 'Your most important metrics at a glance. Click any card to see detailed reports.',
                element: '[data-tour="quick-stats"]',
                position: 'bottom',
                nextButton: 'Next',
            },
            {
                id: 'recent_activity',
                title: '🔔 Recent Activity',
                description: 'Stay updated with recent customer interactions, deals, and team activity.',
                element: '[data-tour="recent-activity"]',
                position: 'top',
                nextButton: 'Next',
            },
            {
                id: 'quick_actions',
                title: '⚡ Quick Actions',
                description: 'Common tasks are just one click away. Add customers, create quotes, or schedule calls.',
                element: '[data-tour="quick-actions"]',
                position: 'top',
                nextButton: 'Finish',
            },
        ],
    },

    calls: {
        id: 'calls',
        name: 'Calls Feature Tour',
        autoStart: false,
        steps: [
            {
                id: 'call_log',
                title: '📞 Call Logging',
                description: 'Track all your customer calls. Log outcomes, take notes, and schedule follow-ups.',
                element: '[data-tour="call-log"]',
                position: 'bottom',
                nextButton: 'Next',
            },
            {
                id: 'ai_calls',
                title: '🤖 AI-Powered Calls',
                description: 'Let AI agents make calls for you. Get instant transcripts and sentiment analysis.',
                element: '[data-tour="ai-calls"]',
                position: 'bottom',
                nextButton: 'Got it!',
            },
        ],
    },
};

// ═══════════════════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════

const DEMO_TOUR_KEY = 'cxtrack_demo_tour_progress';
const DEMO_TOOLTIP_KEY = 'cxtrack_demo_tooltip_dismissals';

// ═══════════════════════════════════════════════════════════════════════
// TOUR MANAGER CLASS
// ═══════════════════════════════════════════════════════════════════════

export class TourManager {

    /**
     * Check if a tour has been completed
     */
    static async hasCompletedTour(tourId: string): Promise<boolean> {
        // Check cookie first (faster)
        const cookie = Cookies.get(`tour_${tourId}`);
        if (cookie === 'completed') return true;

        if (DEMO_MODE) {
            const stored = localStorage.getItem(DEMO_TOUR_KEY);
            if (stored) {
                const progress = JSON.parse(stored);
                return progress[tourId]?.completed || false;
            }
            return false;
        }

        // Production: Check Supabase (placeholder)
        return false;
    }

    /**
     * Mark a tour as completed
     */
    static async markTourCompleted(tourId: string): Promise<void> {
        // Set cookie (expires in 1 year)
        Cookies.set(`tour_${tourId}`, 'completed', { expires: 365 });

        if (DEMO_MODE) {
            const stored = localStorage.getItem(DEMO_TOUR_KEY);
            const progress = stored ? JSON.parse(stored) : {};
            progress[tourId] = {
                completed: true,
                completed_at: new Date().toISOString(),
            };
            localStorage.setItem(DEMO_TOUR_KEY, JSON.stringify(progress));
        }

        // Production: Save to Supabase (placeholder)
    }

    /**
     * Clear tour progress to allow restart
     */
    static async clearTourProgress(tourId: string): Promise<void> {
        Cookies.remove(`tour_${tourId}`);

        if (DEMO_MODE) {
            const stored = localStorage.getItem(DEMO_TOUR_KEY);
            if (stored) {
                const progress = JSON.parse(stored);
                delete progress[tourId];
                localStorage.setItem(DEMO_TOUR_KEY, JSON.stringify(progress));
            }
        }
    }

    /**
     * Check if a tooltip should be shown
     */
    static async shouldShowTooltip(tooltipId: string): Promise<boolean> {
        // Check cookie first
        const cookie = Cookies.get(`tooltip_${tooltipId}`);
        if (cookie === 'dismissed') return false;

        if (DEMO_MODE) {
            const stored = localStorage.getItem(DEMO_TOOLTIP_KEY);
            if (stored) {
                const dismissals = JSON.parse(stored);
                return !dismissals[tooltipId];
            }
            return true; // Show by default
        }

        return true;
    }

    /**
     * Dismiss a tooltip permanently
     */
    static async dismissTooltip(tooltipId: string): Promise<void> {
        // Set cookie
        Cookies.set(`tooltip_${tooltipId}`, 'dismissed', { expires: 365 });

        if (DEMO_MODE) {
            const stored = localStorage.getItem(DEMO_TOOLTIP_KEY);
            const dismissals = stored ? JSON.parse(stored) : {};
            dismissals[tooltipId] = {
                dismissed_at: new Date().toISOString(),
            };
            localStorage.setItem(DEMO_TOOLTIP_KEY, JSON.stringify(dismissals));
        }
    }

    /**
     * Reset all tooltips (for testing)
     */
    static async resetAllTooltips(): Promise<void> {
        if (DEMO_MODE) {
            localStorage.removeItem(DEMO_TOOLTIP_KEY);
        }
        // Clear cookies with tooltip_ prefix
        const cookies = Cookies.get();
        Object.keys(cookies).forEach(key => {
            if (key.startsWith('tooltip_')) {
                Cookies.remove(key);
            }
        });
    }

    /**
     * Reset all tours (for testing)
     */
    static async resetAllTours(): Promise<void> {
        if (DEMO_MODE) {
            localStorage.removeItem(DEMO_TOUR_KEY);
        }
        // Clear cookies with tour_ prefix
        const cookies = Cookies.get();
        Object.keys(cookies).forEach(key => {
            if (key.startsWith('tour_')) {
                Cookies.remove(key);
            }
        });
    }

    /**
     * Get tour by ID
     */
    static getTour(tourId: string): Tour | undefined {
        return tours[tourId];
    }

    /**
     * List all available tours
     */
    static getAllTours(): Tour[] {
        return Object.values(tours);
    }
}

export default TourManager;
