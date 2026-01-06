import React from 'react';
import { Shield, Lock, Eye, Cookie, Database, Globe, Info, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 scroll-smooth">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Last updated: January 5, 2026
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">

                    <div className="p-8 space-y-12">

                        {/* Introduction */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Info className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Introduction
                                </h2>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                At CxTrack, we take your privacy seriously. This Privacy Policy explains how we collect,
                                use, disclose, and safeguard your information when you use our CRM platform. We are committed
                                to protecting your personal data and your right to privacy.
                            </p>
                        </section>

                        {/* Information We Collect */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Database className="w-5 h-5 text-purple-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Information We Collect
                                </h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                                        Personal Information
                                    </h3>
                                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm ml-4 list-disc">
                                        <li>Name, email address, and contact information</li>
                                        <li>Company name and business information</li>
                                        <li>Billing and payment information</li>
                                        <li>Profile information and preferences</li>
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                                        Usage Data
                                    </h3>
                                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm ml-4 list-disc">
                                        <li>Log data (IP address, browser type, access times)</li>
                                        <li>Device information and identifiers</li>
                                        <li>Usage patterns and feature interactions</li>
                                        <li>Performance and analytics data</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* How We Use Your Information */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <Eye className="w-5 h-5 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    How We Use Your Information
                                </h2>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                                <ul className="grid md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300 text-sm">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                        To provide and maintain services
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                        To process transactions and billing
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                        To send updates and support messages
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                        To analyze usage and improve our platform
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                        To protect against fraud
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                        To comply with legal obligations
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Cookies and Tracking */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <Cookie className="w-5 h-5 text-orange-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Cookies
                                </h2>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                                We use cookies and similar tracking technologies to track activity on our service
                                and store certain information. You can manage your cookie preferences through our
                                cookie consent banner.
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-900/50">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <strong className="text-blue-700 dark:text-blue-400">Types of cookies we use:</strong> Necessary cookies (essential functionality),
                                    Analytics cookies (usage tracking), Marketing cookies (advertising and personalization)
                                </p>
                            </div>
                        </section>

                        {/* Data Security */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <Lock className="w-5 h-5 text-red-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Data Security
                                </h2>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                                We implement industry-standard security measures to protect your data, including:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    "End-to-end encryption",
                                    "Regular security audits",
                                    "Strict access controls",
                                    "Secure infrastructure",
                                    "Automated backups",
                                    "DDoS protection"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                                        <Shield className="w-4 h-4 text-red-500" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Your Rights */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Globe className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Your Privacy Rights
                                </h2>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-6 font-medium">
                                Depending on your location, you may have the following rights:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    "Access to your data",
                                    "Correction of inaccurate data",
                                    "Deletion of your data",
                                    "Restriction of processing",
                                    "Data portability",
                                    "Withdrawal of consent"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Contact */}
                        <section>
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-2xl p-8 border border-indigo-100 dark:border-indigo-900/50 text-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                    Questions or Concerns?
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto leading-relaxed">
                                    If you have any questions about this Privacy Policy or our data practices,
                                    please don't hesitate to reach out to our team.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-medium">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-indigo-100 dark:border-indigo-900/50 shadow-sm text-gray-700 dark:text-gray-300">
                                        <strong className="text-indigo-600 dark:text-indigo-400">Email:</strong> privacy@cxtrack.com
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-indigo-100 dark:border-indigo-900/50 shadow-sm text-gray-700 dark:text-gray-300">
                                        <strong className="text-indigo-600 dark:text-indigo-400">Support:</strong> support@cxtrack.com
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>

                {/* Back Button */}
                <div className="text-center mt-12">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold group transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                        Back to Dashboard
                    </Link>
                </div>

            </div>
        </div>
    );
};

// Helper components
const CheckCircle = ({ size = 24, className }: { size?: number, className: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);
