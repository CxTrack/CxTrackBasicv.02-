import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Phone, ArrowLeft, Download, Share2, Play, Pause,
    User, TrendingUp, TrendingDown,
    MessageSquare, CheckCircle, Volume2, FileText, HelpCircle
} from 'lucide-react';
import { RetellCallData } from '@/types/retell.types';
import { useThemeStore } from '@/stores/themeStore';
import toast from 'react-hot-toast';

// Tooltip Component for explanatory hints
const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
    <div className="relative group inline-flex items-center">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-normal w-48 text-center z-50 shadow-lg">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
    </div>
);

// Mock Data for Visualization
const MOCK_CALL_DATA: RetellCallData = {
    call_id: 'call_123456',
    agent_id: 'agent_987',
    call_type: 'inbound',
    call_status: 'completed',
    start_timestamp: Date.now() - 3600000,
    end_timestamp: Date.now() - 3600000 + 150000,
    duration_ms: 150000,
    recording_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Sample mp3
    transcript: "Agent: Hello, this is CxTrack support. How can I help you? User: Hi, I'm having trouble with my recent invoice.",
    transcript_object: [
        { role: 'agent', content: 'Hello, this is CxTrack support. How can I help you today?', timestamp: 0 },
        { role: 'user', content: "Hi, I'm calling about my recent invoice. I think there was a double charge for the premium plan.", timestamp: 5 },
        { role: 'agent', content: 'I understand. Let me check your account details. Could you please provide your account email?', timestamp: 12 },
        { role: 'user', content: "Sure, it's customer@example.com.", timestamp: 18 },
        { role: 'agent', content: "Thank you. I see the duplicate transaction here. It looks like a system sync error. I've initiated a refund for the second charge which should appear in 3-5 business days.", timestamp: 25 },
        { role: 'user', content: 'That sounds great, thank you for the quick resolution!', timestamp: 45 },
        { role: 'agent', content: "You're very welcome! Is there anything else I can assist you with today?", timestamp: 52 },
        { role: 'user', content: 'No, that was all. Have a great day!', timestamp: 58 },
        { role: 'agent', content: 'Thank you, you too! Goodbye.', timestamp: 62 },
    ],
    sentiment: 'positive',
    sentiment_score: 0.85,
    key_topics: ['Invoice Query', 'Refund Process', 'Premium Plan'],
    action_items: [
        'Verify refund processed in stripe dashboard',
        'Email confirmation sent to customer'
    ],
    summary: 'The customer reported a double charge for their premium plan. The agent identified a sync error, initiated a refund, and informed the customer about the 3-5 day processing time. The customer was satisfied with the quick resolution.',
    phone_number: '+1 (555) 123-4567',
    customer_id: 'cust_001',
    customer_name: 'John Doe',
    customer_email: 'customer@example.com',
    interruptions_count: 1,
    user_sentiment_flow: [
        { timestamp: 0, sentiment: 0 },
        { timestamp: 10, sentiment: -0.2 },
        { timestamp: 20, sentiment: 0.1 },
        { timestamp: 30, sentiment: 0.5 },
        { timestamp: 40, sentiment: 0.8 },
        { timestamp: 50, sentiment: 0.9 },
        { timestamp: 60, sentiment: 0.9 },
    ],
    agent_performance: {
        clarity_score: 0.98,
        response_time_avg: 450,
        successful_responses: 5,
    }
};

export const CallDetail = () => {
    const { callId } = useParams();
    const navigate = useNavigate();
    const { theme } = useThemeStore();
    const [call, setCall] = useState<RetellCallData | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [loading, setLoading] = useState(true);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        loadCallDetails();
    }, [callId]);

    const loadCallDetails = async () => {
        try {
            // In a real app, you'd fetch from your API
            // const response = await fetch(`/api/calls/${callId}`);
            // const data = await response.json();

            // Using mock data for now as requested
            setTimeout(() => {
                setCall(MOCK_CALL_DATA);
                setLoading(false);
            }, 800);
        } catch (error) {
            console.error('Error loading call:', error);
            setLoading(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
    };

    const handleExport = () => {
        if (!call) return;

        const content = `
Call Details - ${new Date(call.start_timestamp).toLocaleString()}
ID: ${call.call_id}
Duration: ${formatDuration(call.duration_ms)}
Sentiment: ${call.sentiment} (${(call.sentiment_score * 100).toFixed(0)}%)

Summary:
${call.summary}

Key Topics:
${call.key_topics.join(', ')}

Action Items:
${call.action_items.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Transcript:
${call.transcript_object.map(m => `[${formatTime(m.timestamp)}] ${m.role.toUpperCase()}: ${m.content}`).join('\n')}
        `.trim();

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `call_${call.call_id}_export.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Call details exported!');
    };

    const isDark = theme === 'dark';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!call) return <div className="p-8 text-center">Call not found</div>;

    const handlePlaybackRateChange = (rate: number) => {
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
            setPlaybackRate(rate);
        }
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} p-4 sm:p-6`}>
            <div className="max-w-[1920px] mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/calls')}
                            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                        >
                            <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">Call Details</h1>
                                {call.customer_name && (
                                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                        {call.customer_name}
                                    </span>
                                )}
                            </div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {new Date(call.start_timestamp).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExport}
                            className={`px-4 py-2 border-2 rounded-xl flex items-center gap-2 transition-colors ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={handleShare}
                            className={`px-4 py-2 border-2 rounded-xl flex items-center gap-2 transition-colors ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Audio Player */}
                        <div className={`rounded-2xl border-2 p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Volume2 className="w-5 h-5 text-blue-600" />
                                    Call Recording
                                </h2>
                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {formatDuration(call.duration_ms)}
                                </span>
                            </div>

                            <div className={`rounded-xl p-6 border ${isDark ? 'bg-blue-900/10 border-blue-800/30' : 'bg-blue-50 border-blue-100'}`}>
                                <audio
                                    src={call.recording_url}
                                    ref={audioRef}
                                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                                    onEnded={() => setIsPlaying(false)}
                                />

                                <div className="mb-4">
                                    <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                                            style={{ width: `${(currentTime / (call.duration_ms / 1000)) * 100}%` }}
                                        />
                                    </div>
                                    <div className={`flex justify-between text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(call.duration_ms / 1000)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-6">
                                    <button
                                        onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10 }}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-white/50'}`}
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" /></svg>
                                    </button>
                                    <button
                                        onClick={togglePlay}
                                        className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                                    >
                                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                                    </button>
                                    <button
                                        onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10 }}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-white/50'}`}
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" /></svg>
                                    </button>

                                    {/* Playback Rate Selector */}
                                    <div className="flex bg-gray-200/50 dark:bg-gray-800/50 rounded-lg p-1 ml-4 gap-1">
                                        {[0.5, 1, 1.5, 2].map((rate) => (
                                            <button
                                                key={rate}
                                                onClick={() => handlePlaybackRateChange(rate)}
                                                className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${playbackRate === rate
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : (isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-white hover:text-blue-600')
                                                    }`}
                                            >
                                                {rate}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Summary */}
                        <div className={`rounded-2xl border-2 p-6 transition-all ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                                <MessageSquare className="w-5 h-5 text-purple-600" />
                                AI Summary
                            </h2>
                            <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {call.summary}
                            </p>
                        </div>

                        {/* Transcript */}
                        <div className={`rounded-2xl border-2 p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Full Transcript
                            </h2>
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {call.transcript_object.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex gap-4 ${message.role === 'agent' ? 'flex-row' : 'flex-row-reverse'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${message.role === 'agent'
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'bg-indigo-100 text-indigo-600'
                                            }`}>
                                            {message.role === 'agent' ? <Phone className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                        </div>
                                        <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                                            <div className="flex items-center gap-2 mb-1 justify-inherit">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {message.role === 'agent' ? 'AI Agent' : 'Customer'}
                                                </span>
                                                <span className="text-[10px] text-gray-400">{formatTime(message.timestamp)}</span>
                                            </div>
                                            <div className={`inline-block px-4 py-3 rounded-2xl text-sm ${message.role === 'agent'
                                                ? (isDark ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-100')
                                                : (isDark ? 'bg-indigo-900/20 border-indigo-800/50' : 'bg-indigo-50 border-indigo-100')
                                                } border`}>
                                                <p className={isDark ? 'text-gray-200' : 'text-gray-800'}>{message.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Items */}
                        {call.action_items.length > 0 && (
                            <div className={`rounded-2xl border-2 p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    Action Items
                                </h2>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {call.action_items.map((item, index) => (
                                        <div key={index} className={`flex items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-md ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                            <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                                {index + 1}
                                            </div>
                                            <p className="text-sm font-medium">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Metadata & Analytics */}
                    <div className="space-y-6">

                        {/* Sentiment Analysis */}
                        <div className={`rounded-2xl border-2 p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-lg font-bold">Sentiment Analysis</h3>
                                <Tooltip text="AI-analyzed emotional tone of the conversation. Shows how the customer felt throughout the call.">
                                    <HelpCircle className={`w-4 h-4 cursor-help ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                </Tooltip>
                            </div>

                            <div className={`p-4 rounded-xl border-2 mb-6 ${call.sentiment === 'positive'
                                ? (isDark ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-100')
                                : call.sentiment === 'negative'
                                    ? (isDark ? 'bg-red-900/20 border-red-800/50' : 'bg-red-50 border-red-100')
                                    : (isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100')
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Overall</span>
                                    {call.sentiment === 'positive' ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-2xl font-black ${call.sentiment === 'positive' ? 'text-green-600' : call.sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
                                        }`}>
                                        {call.sentiment.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-500 font-bold">{(call.sentiment_score * 100).toFixed(0)}%</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Flow Chart</p>
                                    <Tooltip text="Visualizes how customer sentiment changed over the call duration. Above the line = positive, below = negative.">
                                        <HelpCircle className={`w-3 h-3 cursor-help ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                    </Tooltip>
                                </div>
                                <div className={`h-24 rounded-xl p-3 relative overflow-hidden ${isDark ? 'bg-black/20' : 'bg-gray-50'}`}>
                                    <svg className="w-full h-full" viewBox="0 0 300 80">
                                        <polyline
                                            points={call.user_sentiment_flow.map((point, i) => {
                                                const x = (i / (call.user_sentiment_flow.length - 1)) * 280 + 10;
                                                const y = 40 - (point.sentiment * 30);
                                                return `${x},${y}`;
                                            }).join(' ')}
                                            fill="none"
                                            stroke={call.sentiment === 'positive' ? '#10b981' : '#ef4444'}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                        <line x1="10" y1="40" x2="290" y2="40" stroke={isDark ? '#333' : '#e5e7eb'} strokeWidth="1" strokeDasharray="5,5" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Call Metadata - Apple-Inspired Minimal Design */}
                        <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-900/50 border border-gray-800/50' : 'bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm'}`}>
                            <h3 className={`text-sm font-medium tracking-tight mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Call Information</h3>
                            <div className="space-y-5">
                                {/* Duration - Hero stat */}
                                <div className="text-center pb-5 border-b border-gray-100 dark:border-gray-800/50">
                                    <p className={`text-4xl font-light tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {formatDuration(call.duration_ms)}
                                    </p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Duration</p>
                                </div>

                                {/* Clean metadata rows */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Type</span>
                                        <span className={`text-sm font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{call.call_type}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Status</span>
                                        <span className={`text-sm font-medium capitalize ${call.call_status === 'completed' ? 'text-green-600' :
                                            isDark ? 'text-white' : 'text-gray-900'
                                            }`}>{call.call_status}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Phone</span>
                                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{call.phone_number}</span>
                                    </div>
                                    {call.customer_email && (
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Email</span>
                                            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{call.customer_email}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Interruptions</span>
                                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{call.interruptions_count}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Agent Performance - Minimal */}
                        <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-900/50 border border-gray-800/50' : 'bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm'}`}>
                            <div className="flex items-center gap-2 mb-5">
                                <h3 className={`text-sm font-medium tracking-tight ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Agent Performance</h3>
                                <Tooltip text="Metrics measuring AI agent effectiveness including speech clarity and response speed.">
                                    <HelpCircle className={`w-3 h-3 cursor-help ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                </Tooltip>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Clarity</span>
                                            <Tooltip text="How clearly the agent communicated. Higher = easier for customer to understand.">
                                                <HelpCircle className={`w-3 h-3 cursor-help ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                            </Tooltip>
                                        </div>
                                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{(call.agent_performance.clarity_score * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                        <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${call.agent_performance.clarity_score * 100}%` }} />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Avg Response</span>
                                        <Tooltip text="Average time the AI took to respond. Lower = faster, more natural conversation.">
                                            <HelpCircle className={`w-3 h-3 cursor-help ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                        </Tooltip>
                                    </div>
                                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{call.agent_performance.response_time_avg}ms</span>
                                </div>
                            </div>
                        </div>

                        {/* Key Topics - Minimal */}
                        <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-900/50 border border-gray-800/50' : 'bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm'}`}>
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className={`text-sm font-medium tracking-tight ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Topics</h3>
                                <Tooltip text="Main subjects discussed during the call, automatically extracted by AI.">
                                    <HelpCircle className={`w-3 h-3 cursor-help ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                </Tooltip>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {call.key_topics.map((topic, index) => (
                                    <span
                                        key={index}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};



// Helper functions
const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
