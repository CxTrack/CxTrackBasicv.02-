import { useState, useEffect } from 'react';
import {
    Mic, Volume2, MessageSquare, Building2, Users, Settings2,
    ChevronRight, ChevronLeft, Check, Save, RefreshCw, Zap,
    Clock, AlertCircle, Play, Pause, CheckCircle
} from 'lucide-react';
import { useVoiceAgentStore, INDUSTRY_OPTIONS, TONE_DESCRIPTIONS, AgentTone, HandlingPreference, FallbackBehavior } from '@/stores/voiceAgentStore';
import toast from 'react-hot-toast';

const STEPS = [
    { id: 0, title: 'Basic Info', description: 'Name your agent and business' },
    { id: 1, title: 'Tone & Style', description: 'Set personality and communication style' },
    { id: 2, title: 'Call Handling', description: 'Configure how calls are handled' },
    { id: 3, title: 'Review & Activate', description: 'Review settings and go live' },
];

export const VoiceAgentSetup = () => {
    const {
        config,
        usage,
        loading,
        fetchConfig,
        saveConfig,
        updateSetupStep,
        activateAgent,
        deactivateAgent,
        fetchUsage,
    } = useVoiceAgentStore();

    const [currentStep, setCurrentStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        agent_name: '',
        business_name: '',
        industry: '',
        customIndustry: '',
        business_description: '',
        agent_tone: 'professional' as AgentTone,
        greeting_script: '',
        common_call_reasons: [] as string[],
        handling_preference: 'handle_automatically' as HandlingPreference,
        fallback_behavior: 'take_message' as FallbackBehavior,
    });
    const [newReason, setNewReason] = useState('');

    useEffect(() => {
        fetchConfig();
        fetchUsage();
    }, [fetchConfig, fetchUsage]);

    useEffect(() => {
        if (config) {
            const isKnownIndustry = INDUSTRY_OPTIONS.includes(config.industry);
            setFormData({
                agent_name: config.agent_name || '',
                business_name: config.business_name || '',
                industry: isKnownIndustry ? config.industry : 'Other',
                customIndustry: isKnownIndustry ? '' : config.industry || '',
                business_description: config.business_description || '',
                agent_tone: config.agent_tone || 'professional',
                greeting_script: config.greeting_script || "Hello! Thank you for calling {business_name}. How can I help you today?",
                common_call_reasons: config.common_call_reasons || [],
                handling_preference: config.handling_preference || 'handle_automatically',
                fallback_behavior: config.fallback_behavior || 'take_message',
            });
            setCurrentStep(config.setup_step || 0);
        }
    }, [config]);

    const handleSaveStep = async () => {
        setSaving(true);
        try {
            await saveConfig({
                ...formData,
                industry: formData.industry === 'Other' ? formData.customIndustry : formData.industry,
                setup_step: currentStep,
            });
            toast.success('Progress saved');
        } catch {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        await handleSaveStep();
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
            await updateSetupStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleActivate = async () => {
        setSaving(true);
        try {
            await saveConfig({ ...formData, setup_completed: true, is_active: true });
            toast.success('Voice Agent activated! 🎉');
        } catch {
            toast.error('Failed to activate');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async () => {
        setSaving(true);
        try {
            if (config?.is_active) {
                await deactivateAgent();
                toast.success('Voice Agent paused');
            } else {
                await activateAgent();
                toast.success('Voice Agent activated');
            }
        } catch {
            toast.error('Failed to update status');
        } finally {
            setSaving(false);
        }
    };

    const addCallReason = () => {
        if (newReason.trim() && !formData.common_call_reasons.includes(newReason.trim())) {
            setFormData({
                ...formData,
                common_call_reasons: [...formData.common_call_reasons, newReason.trim()],
            });
            setNewReason('');
        }
    };

    const removeCallReason = (reason: string) => {
        setFormData({
            ...formData,
            common_call_reasons: formData.common_call_reasons.filter(r => r !== reason),
        });
    };

    if (loading && !config) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    const isSetupComplete = config?.setup_completed;

    return (
        <div className="max-w-4xl space-y-6">
            {/* Header with Usage */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Mic className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {isSetupComplete ? (config?.agent_name || 'AI Voice Agent') : 'Set Up Your Voice Agent'}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                {isSetupComplete
                                    ? `${config?.is_active ? '🟢 Active' : '🔴 Paused'} • Handling calls 24/7`
                                    : 'Configure your AI assistant in a few easy steps'}
                            </p>
                        </div>
                    </div>

                    {isSetupComplete && (
                        <button
                            onClick={handleToggleActive}
                            disabled={saving}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors ${config?.is_active
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                }`}
                        >
                            {config?.is_active ? (
                                <><Pause className="w-4 h-4 inline mr-2" />Pause Agent</>
                            ) : (
                                <><Play className="w-4 h-4 inline mr-2" />Resume Agent</>
                            )}
                        </button>
                    )}
                </div>

                {/* Usage Stats */}
                {usage && (
                    <div className="mt-6 pt-6 border-t border-purple-200 dark:border-purple-800">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{usage.minutes_used.toFixed(1)}</p>
                                <p className="text-sm text-gray-500">Minutes Used</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{usage.minutes_included}</p>
                                <p className="text-sm text-gray-500">Minutes Included</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {Math.max(0, usage.minutes_included - usage.minutes_used).toFixed(1)}
                                </p>
                                <p className="text-sm text-gray-500">Remaining</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                                    style={{ width: `${Math.min((usage.minutes_used / usage.minutes_included) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Setup Wizard */}
            {!isSetupComplete && (
                <>
                    {/* Progress Steps */}
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors ${currentStep > index
                                    ? 'bg-green-500 text-white'
                                    : currentStep === index
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                    }`}>
                                    {currentStep > index ? <Check className="w-5 h-5" /> : index + 1}
                                </div>
                                <div className="ml-3 hidden sm:block">
                                    <p className={`text-sm font-medium ${currentStep >= index ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                        {step.title}
                                    </p>
                                    <p className="text-xs text-gray-500">{step.description}</p>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div className={`hidden sm:block w-12 h-0.5 mx-4 ${currentStep > index ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                        {currentStep === 0 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Basic Information</h3>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Agent Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.agent_name}
                                            onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                            placeholder="e.g., Alex, Sarah, Max"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">This is how your AI will introduce itself</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Business Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.business_name}
                                            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                            placeholder="Your Company Name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Industry
                                    </label>
                                    <select
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="">Select your industry</option>
                                        {INDUSTRY_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        <option value="Other">Other</option>
                                    </select>
                                    {formData.industry === 'Other' && (
                                        <input
                                            type="text"
                                            placeholder="Enter your industry"
                                            value={formData.customIndustry}
                                            onChange={(e) => setFormData({ ...formData, customIndustry: e.target.value })}
                                            className="mt-2 w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Business Description
                                    </label>
                                    <textarea
                                        value={formData.business_description}
                                        onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white resize-none"
                                        placeholder="Describe your business, services, and what makes you unique. This helps the AI represent your brand accurately."
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tone & Communication Style</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                        Agent Personality
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {(Object.keys(TONE_DESCRIPTIONS) as AgentTone[]).map(tone => (
                                            <button
                                                key={tone}
                                                onClick={() => setFormData({ ...formData, agent_tone: tone })}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${formData.agent_tone === tone
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                    }`}
                                            >
                                                <p className="font-semibold text-gray-900 dark:text-white capitalize">{tone}</p>
                                                <p className="text-sm text-gray-500 mt-1">{TONE_DESCRIPTIONS[tone]}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Greeting Script
                                    </label>
                                    <textarea
                                        value={formData.greeting_script}
                                        onChange={(e) => setFormData({ ...formData, greeting_script: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white resize-none"
                                        placeholder="Hello! Thank you for calling {business_name}. How can I help you today?"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Use {'{business_name}'} to insert your business name dynamically</p>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Call Handling Preferences</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                        Common Call Reasons
                                    </label>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={newReason}
                                            onChange={(e) => setNewReason(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addCallReason()}
                                            className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                            placeholder="e.g., Pricing questions, Support, Schedule appointment"
                                        />
                                        <button
                                            onClick={addCallReason}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.common_call_reasons.map(reason => (
                                            <span key={reason} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                                                {reason}
                                                <button onClick={() => removeCallReason(reason)} className="hover:text-red-500">×</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                        Handling Preference
                                    </label>
                                    <div className="space-y-3">
                                        {[
                                            { value: 'handle_automatically', label: 'Handle Automatically', desc: 'AI handles most calls independently, creates tasks/appointments' },
                                            { value: 'notify_team', label: 'Notify Team', desc: 'AI takes info and immediately notifies team members' },
                                            { value: 'transfer_immediately', label: 'Transfer to Team', desc: 'AI greets and transfers calls to available team members' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setFormData({ ...formData, handling_preference: opt.value as HandlingPreference })}
                                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${formData.handling_preference === opt.value
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                    }`}
                                            >
                                                <p className="font-semibold text-gray-900 dark:text-white">{opt.label}</p>
                                                <p className="text-sm text-gray-500">{opt.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                        When AI Can't Help
                                    </label>
                                    <select
                                        value={formData.fallback_behavior}
                                        onChange={(e) => setFormData({ ...formData, fallback_behavior: e.target.value as FallbackBehavior })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="take_message">Take a message</option>
                                        <option value="transfer_to_voicemail">Transfer to voicemail</option>
                                        <option value="schedule_callback">Offer to schedule a callback</option>
                                        <option value="transfer_to_human">Transfer to human operator</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Review & Activate</h3>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Agent Info</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="text-gray-500">Name:</span> <span className="font-medium">{formData.agent_name || 'Not set'}</span></p>
                                            <p><span className="text-gray-500">Business:</span> <span className="font-medium">{formData.business_name || 'Not set'}</span></p>
                                            <p><span className="text-gray-500">Industry:</span> <span className="font-medium">{formData.industry || 'Not set'}</span></p>
                                            <p><span className="text-gray-500">Tone:</span> <span className="font-medium capitalize">{formData.agent_tone}</span></p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Call Handling</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="text-gray-500">Preference:</span> <span className="font-medium capitalize">{formData.handling_preference.replace(/_/g, ' ')}</span></p>
                                            <p><span className="text-gray-500">Fallback:</span> <span className="font-medium capitalize">{formData.fallback_behavior.replace(/_/g, ' ')}</span></p>
                                            <p><span className="text-gray-500">Call Reasons:</span> <span className="font-medium">{formData.common_call_reasons.length} defined</span></p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-green-800 dark:text-green-200">Ready to Go Live!</h4>
                                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                                Your AI Voice Agent is configured and ready. Click "Activate Agent" to start answering calls.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </button>

                            {currentStep < STEPS.length - 1 ? (
                                <button
                                    onClick={handleNext}
                                    disabled={saving}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? 'Saving...' : 'Continue'}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleActivate}
                                    disabled={saving}
                                    className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Zap className="w-4 h-4" />
                                    {saving ? 'Activating...' : 'Activate Agent'}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Post-Setup: Quick Settings */}
            {isSetupComplete && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Settings</h3>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Agent Name
                            </label>
                            <input
                                type="text"
                                value={formData.agent_name}
                                onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Agent Tone
                            </label>
                            <select
                                value={formData.agent_tone}
                                onChange={(e) => setFormData({ ...formData, agent_tone: e.target.value as AgentTone })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                            >
                                <option value="professional">Professional</option>
                                <option value="friendly">Friendly</option>
                                <option value="casual">Casual</option>
                                <option value="formal">Formal</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Greeting Script
                        </label>
                        <textarea
                            value={formData.greeting_script}
                            onChange={(e) => setFormData({ ...formData, greeting_script: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white resize-none"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveStep}
                            disabled={saving}
                            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoiceAgentSetup;
