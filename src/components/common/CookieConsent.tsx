import { useState, useEffect } from 'react';
import { X, Cookie, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CookieConsent = () => {
    const [showBanner, setShowBanner] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        // Check if user has already consented
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            setShowBanner(true);
        }
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem('cookie_consent', JSON.stringify({
            necessary: true,
            analytics: true,
            marketing: true,
            timestamp: new Date().toISOString(),
        }));
        setShowBanner(false);
    };

    const handleAcceptNecessary = () => {
        localStorage.setItem('cookie_consent', JSON.stringify({
            necessary: true,
            analytics: false,
            marketing: false,
            timestamp: new Date().toISOString(),
        }));
        setShowBanner(false);
    };

    const handleReject = () => {
        localStorage.setItem('cookie_consent', JSON.stringify({
            necessary: true,
            analytics: false,
            marketing: false,
            timestamp: new Date().toISOString(),
        }));
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-end justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 max-w-4xl w-full mb-4 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <Cookie className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Cookie Preferences
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                We value your privacy
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleReject}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        We use cookies to enhance your experience, analyze site traffic, and personalize content.
                        By clicking "Accept All", you consent to our use of cookies.
                    </p>

                    {showDetails && (
                        <div className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl max-h-[40vh] overflow-y-auto">

                            {/* Necessary Cookies */}
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked
                                    readOnly
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-1">
                                        Necessary Cookies <span className="text-xs text-gray-500">(Required)</span>
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Essential for the website to function properly. These cookies enable core functionality
                                        such as security, network management, and accessibility.
                                    </p>
                                </div>
                            </div>

                            {/* Analytics Cookies */}
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-1">
                                        Analytics Cookies
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Help us understand how visitors interact with our website. We use this information
                                        to improve your experience and optimize our services.
                                    </p>
                                </div>
                            </div>

                            {/* Marketing Cookies */}
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-1">
                                        Marketing Cookies
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Used to track visitors across websites to display relevant advertisements and
                                        engage users with personalized content.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleAcceptAll}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
                        >
                            Accept All
                        </button>
                        <button
                            onClick={handleAcceptNecessary}
                            className="px-6 py-2.5 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 font-medium transition-colors"
                        >
                            Necessary Only
                        </button>
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors flex items-center gap-2"
                        >
                            <Info className="w-4 h-4" />
                            {showDetails ? 'Hide Details' : 'Customize'}
                        </button>
                        <Link
                            to="/privacy-policy"
                            className="px-6 py-2.5 text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center"
                            onClick={() => setShowBanner(false)}
                        >
                            Privacy Policy
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
