import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Calendar,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  User,
  Bot,
  X,
  ChevronDown,
  MoreVertical,
  Users,
} from 'lucide-react';
import { useCallStore } from '@/stores/callStore';
import { useThemeStore } from '@/stores/themeStore';
import { Call } from '@/types/database.types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import LogCallModal from '@/components/calls/LogCallModal';

type TabType = 'all' | 'my-calls' | 'team' | 'ai-agents' | 'live';

export default function Calls() {
  const { theme } = useThemeStore();
  const {
    calls,
    stats,
    loading,
    filters,
    fetchCalls,
    fetchCallStats,
    setFilters,
    subscribeToLiveCalls,
    createCall,
  } = useCallStore();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showLogCallModal, setShowLogCallModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCalls();
    fetchCallStats();
    const unsubscribe = subscribeToLiveCalls();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery !== filters.searchQuery) {
      const timeoutId = setTimeout(() => {
        setFilters({ searchQuery });
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    switch (tab) {
      case 'my-calls':
        setFilters({ callType: 'human' });
        break;
      case 'ai-agents':
        setFilters({ callType: 'ai_agent' });
        break;
      case 'live':
        setFilters({ status: ['ongoing', 'in_progress', 'ringing'] });
        break;
      default:
        setFilters({ callType: 'all', status: [] });
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const isDark = theme === 'dark';
  const isSoftModern = theme === 'soft-modern';

  const getCustomerName = (call: Call) => {
    if (call.customers) {
      const customer = call.customers as any;
      if (customer.first_name || customer.last_name) {
        return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
      }
      return customer.name || customer.company || 'Unknown Customer';
    }
    return 'Unknown Customer';
  };

  const handleLogCall = async (callData: any) => {
    try {
      await createCall(callData);
      toast.success('Call logged successfully');
      fetchCallStats();
    } catch (error) {
      toast.error('Failed to log call');
      throw error;
    }
  };

  return (
    <div className={`min-h-screen ${isSoftModern ? 'bg-[#F8F6F2]' : isDark ? 'bg-gray-900' : 'bg-gray-50'} p-4 sm:p-6 lg:p-8`}>
      <div className="max-w-[1920px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              Calls
            </h1>
            <p className={`text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Log and track customer communications
            </p>
          </div>

          <button
            onClick={() => setShowLogCallModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Log Call
          </button>
        </div>

        {/* Search & Filters */}
        <div className={`
          ${isSoftModern ? 'bg-white/80 backdrop-blur-sm shadow-neumorphic' : isDark ? 'bg-gray-800' : 'bg-white'}
          rounded-xl p-4 sm:p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-6
        `}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search calls by customer, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`
                  w-full pl-10 pr-4 py-2.5 rounded-lg border-2
                  ${isDark
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                  }
                  focus:border-blue-500 focus:outline-none transition-colors
                `}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                px-4 py-2.5 rounded-lg border-2 font-medium transition-colors flex items-center gap-2
                ${showFilters
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <button
              className={`
                px-4 py-2.5 rounded-lg border-2 font-medium transition-colors flex items-center gap-2
                ${isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {showFilters && (
            <div className={`mt-4 pt-4 border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`}>
              <div>
                <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2 block`}>
                  Call Type
                </label>
                <select
                  value={filters.callType || 'all'}
                  onChange={(e) => setFilters({ callType: e.target.value as any })}
                  className={`w-full px-3 py-2 rounded-lg border-2 text-sm ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="all">All Calls</option>
                  <option value="human">Human Only</option>
                  <option value="ai_agent">AI Agents Only</option>
                </select>
              </div>

              <div>
                <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2 block`}>
                  Direction
                </label>
                <select
                  value={filters.direction || 'all'}
                  onChange={(e) => setFilters({ direction: e.target.value as any })}
                  className={`w-full px-3 py-2 rounded-lg border-2 text-sm ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="all">All</option>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </div>

              <div>
                <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2 block`}>
                  Status
                </label>
                <select className={`w-full px-3 py-2 rounded-lg border-2 text-sm ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-gray-100'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}>
                  <option>All Status</option>
                  <option>Completed</option>
                  <option>Missed</option>
                  <option>Ongoing</option>
                </select>
              </div>

              <div>
                <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2 block`}>
                  Outcome
                </label>
                <select className={`w-full px-3 py-2 rounded-lg border-2 text-sm ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-gray-100'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}>
                  <option>All Outcomes</option>
                  <option>Positive</option>
                  <option>Neutral</option>
                  <option>Negative</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <StatCard
            icon={<Phone className="w-6 h-6 text-white" />}
            iconGradient="from-blue-500 to-blue-600"
            title="Total Calls"
            value={stats?.total_calls.toString() || '0'}
            subtitle={`${stats?.human_calls || 0} human, ${stats?.ai_agent_calls || 0} AI`}
            isDark={isDark}
            isSoftModern={isSoftModern}
          />

          <StatCard
            icon={<Calendar className="w-6 h-6 text-white" />}
            iconGradient="from-teal-500 to-teal-600"
            title="This Week"
            value={stats?.this_week.toString() || '0'}
            badge={{ text: 'Active', color: 'teal' }}
            isDark={isDark}
            isSoftModern={isSoftModern}
          />

          <StatCard
            icon={<Clock className="w-6 h-6 text-white" />}
            iconGradient="from-purple-500 to-purple-600"
            title="Avg Duration"
            value={formatDuration(stats?.avg_duration_seconds || 0)}
            subtitle="Average call length"
            isDark={isDark}
            isSoftModern={isSoftModern}
          />

          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            iconGradient="from-orange-500 to-orange-600"
            title="Connection Rate"
            value={`${Math.round((stats?.connection_rate || 0) * 100)}%`}
            subtitle={`${stats?.positive_outcomes || 0} successful`}
            isDark={isDark}
            isSoftModern={isSoftModern}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <TabButton
            active={activeTab === 'all'}
            onClick={() => handleTabChange('all')}
            icon={<Phone className="w-4 h-4" />}
            label="All Calls"
            count={stats?.total_calls}
            isDark={isDark}
          />
          <TabButton
            active={activeTab === 'my-calls'}
            onClick={() => handleTabChange('my-calls')}
            icon={<User className="w-4 h-4" />}
            label="My Calls"
            count={stats?.human_calls}
            isDark={isDark}
          />
          <TabButton
            active={activeTab === 'team'}
            onClick={() => handleTabChange('team')}
            icon={<Users className="w-4 h-4" />}
            label="Team"
            isDark={isDark}
          />
          <TabButton
            active={activeTab === 'ai-agents'}
            onClick={() => handleTabChange('ai-agents')}
            icon={<Bot className="w-4 h-4" />}
            label="AI Agents"
            count={stats?.ai_agent_calls}
            isDark={isDark}
          />
          <TabButton
            active={activeTab === 'live'}
            onClick={() => handleTabChange('live')}
            icon={<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
            label="Live"
            badge={{ text: '0', color: 'green' }}
            isDark={isDark}
          />
        </div>

        {/* Calls Table */}
        <div className={`
          ${isSoftModern ? 'bg-white/80 backdrop-blur-sm shadow-neumorphic' : isDark ? 'bg-gray-800' : 'bg-white'}
          rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-hidden
        `}>
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading calls...
              </p>
            </div>
          ) : calls.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className={`text-left p-4 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide`}>
                      User/Agent
                    </th>
                    <th className={`text-left p-4 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide`}>
                      Customer
                    </th>
                    <th className={`text-left p-4 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide`}>
                      Direction
                    </th>
                    <th className={`text-left p-4 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide`}>
                      Duration
                    </th>
                    <th className={`text-left p-4 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide`}>
                      Outcome
                    </th>
                    <th className={`text-left p-4 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide`}>
                      Time
                    </th>
                    <th className={`text-left p-4 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr
                      key={call.id}
                      onClick={() => setSelectedCall(call)}
                      className={`
                        border-b cursor-pointer transition-colors
                        ${isDark
                          ? 'border-gray-700 hover:bg-gray-700/50'
                          : 'border-gray-100 hover:bg-gray-50'
                        }
                      `}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {call.call_type === 'human' ? (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <Bot className="w-5 h-5 text-purple-600" />
                            </div>
                          )}
                          <div>
                            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {call.agent_name || 'Team Member'}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              {call.call_type === 'ai_agent' ? `${call.agent_type} AI` : 'Human'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {getCustomerName(call)}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {call.customer_phone || call.phone_number}
                        </p>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {call.direction === 'inbound' ? (
                            <PhoneIncoming className="w-4 h-4 text-green-600" />
                          ) : (
                            <PhoneOutgoing className="w-4 h-4 text-blue-600" />
                          )}
                          <span className={`text-sm capitalize ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {call.direction}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {call.duration_seconds ? formatDuration(call.duration_seconds) : '-'}
                        </p>
                      </td>

                      <td className="p-4">
                        {call.outcome && (
                          <span className={`
                            px-3 py-1 rounded-full text-xs font-semibold
                            ${call.outcome === 'positive' ? 'bg-green-50 text-green-700' :
                              call.outcome === 'negative' ? 'bg-red-50 text-red-700' :
                              'bg-gray-100 text-gray-700'}
                          `}>
                            {call.outcome.replace('_', ' ')}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {call.started_at ? format(new Date(call.started_at), 'MMM d, h:mm a') : '-'}
                        </p>
                      </td>

                      <td className="p-4">
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                          <MoreVertical className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              onLogCall={() => setShowLogCallModal(true)}
              isDark={isDark}
            />
          )}
        </div>

      </div>

      <LogCallModal
        isOpen={showLogCallModal}
        onClose={() => setShowLogCallModal(false)}
        onSubmit={handleLogCall}
      />

      {selectedCall && (
        <CallDetailsModal
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
          isDark={isDark}
        />
      )}
    </div>
  );
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  iconGradient: string;
  title: string;
  value: string;
  subtitle?: string;
  badge?: { text: string; color: string };
  isDark: boolean;
  isSoftModern: boolean;
}> = ({ icon, iconGradient, title, value, subtitle, badge, isDark, isSoftModern }) => {
  return (
    <div className={`
      ${isSoftModern ? 'bg-white/80 backdrop-blur-sm shadow-neumorphic' : isDark ? 'bg-gray-800' : 'bg-white'}
      rounded-xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}
      hover:shadow-lg transition-all group
    `}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${iconGradient} shadow-md group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {badge && (
          <span className={`px-2 py-1 rounded-lg text-xs font-semibold bg-${badge.color}-50 text-${badge.color}-700`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
      <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{title}</div>
      {subtitle && (
        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>{subtitle}</div>
      )}
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  badge?: { text: string; color: string };
  isDark: boolean;
}> = ({ active, onClick, icon, label, count, badge, isDark }) => {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap
        ${active
          ? 'bg-blue-600 text-white shadow-md'
          : isDark
          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
        }
      `}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={`text-xs ${active ? 'text-blue-100' : 'text-gray-400'}`}>
          ({count})
        </span>
      )}
      {badge && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-${badge.color}-500 text-white`}>
          {badge.text}
        </span>
      )}
    </button>
  );
};

const EmptyState: React.FC<{
  onLogCall: () => void;
  isDark: boolean;
}> = ({ onLogCall, isDark }) => {
  return (
    <div className="text-center py-16">
      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
        isDark ? 'bg-gray-700' : 'bg-gray-100'
      }`}>
        <Phone className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </div>
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
        No calls logged yet
      </h3>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
        Start tracking your customer communications
      </p>
      <button
        onClick={onLogCall}
        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
      >
        <Plus className="w-4 h-4" />
        Log Your First Call
      </button>
    </div>
  );
};

const CallDetailsModal: React.FC<{
  call: Call;
  onClose: () => void;
  isDark: boolean;
}> = ({ call, onClose, isDark }) => {
  const getCustomerName = (call: Call) => {
    if (call.customers) {
      const customer = call.customers as any;
      if (customer.first_name || customer.last_name) {
        return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
      }
      return customer.name || customer.company || 'Unknown Customer';
    }
    return 'Unknown Customer';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-2xl shadow-2xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} max-h-[90vh] overflow-y-auto`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky top-0 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
            {call.call_type === 'human' ? (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
            )}
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Call Details
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {getCustomerName(call)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-500'} uppercase mb-1`}>
                Direction
              </p>
              <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'} capitalize`}>
                {call.direction}
              </p>
            </div>

            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-500'} uppercase mb-1`}>
                Duration
              </p>
              <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : '-'}
              </p>
            </div>

            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-500'} uppercase mb-1`}>
                Status
              </p>
              <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'} capitalize`}>
                {call.status}
              </p>
            </div>

            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-500'} uppercase mb-1`}>
                Outcome
              </p>
              <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'} capitalize`}>
                {call.outcome || '-'}
              </p>
            </div>
          </div>

          {call.summary && (
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-500'} uppercase mb-2`}>
                Summary
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {call.summary}
              </p>
            </div>
          )}

          {call.transcript && (
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-500'} uppercase mb-2`}>
                Transcript
              </p>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} max-h-64 overflow-y-auto`}>
                {call.transcript}
              </div>
            </div>
          )}

          {call.notes && (
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-500'} uppercase mb-2`}>
                Notes
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {call.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};