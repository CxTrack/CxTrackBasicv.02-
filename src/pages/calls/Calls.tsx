import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MoreVertical,
  Users,
} from 'lucide-react';
import { useCallStore } from '@/stores/callStore';
import { useThemeStore } from '@/stores/themeStore';
import { Call } from '@/types/database.types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import LogCallModal from '@/components/calls/LogCallModal';
import { PageContainer, Card, IconBadge } from '@/components/theme/ThemeComponents';

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

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showLogCallModal, setShowLogCallModal] = useState(false);
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

  if (loading && calls.length === 0) {
    return (
      <PageContainer className="items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading calls...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Calls
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Log and track customer communications
          </p>
        </div>

        <button
          onClick={() => setShowLogCallModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm active:scale-95"
        >
          <Plus size={18} className="mr-2" />
          Log Call
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="flex items-center gap-4 p-4 h-24">
          <IconBadge
            icon={<Phone size={20} className="text-blue-600" />}
            gradient="bg-blue-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Calls</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.total_calls || 0}</h3>
            <p className="text-xs text-slate-500 mt-1">{stats?.human_calls || 0} human, {stats?.ai_agent_calls || 0} AI</p>
          </div>
        </Card>

        <Card hover className="flex items-center gap-4 p-4 h-24">
          <IconBadge
            icon={<Calendar size={20} className="text-teal-600" />}
            gradient="bg-teal-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">This Week</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.this_week || 0}</h3>
            <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold bg-teal-50 text-teal-700 uppercase">Active</span>
          </div>
        </Card>

        <Card hover className="flex items-center gap-4 p-4 h-24">
          <IconBadge
            icon={<Clock size={20} className="text-purple-600" />}
            gradient="bg-purple-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Avg Duration</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatDuration(stats?.avg_duration_seconds || 0)}</h3>
          </div>
        </Card>

        <Card hover className="flex items-center gap-4 p-4 h-24">
          <IconBadge
            icon={<TrendingUp size={20} className="text-orange-600" />}
            gradient="bg-orange-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Connection Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{Math.round((stats?.connection_rate || 0) * 100)}%</h3>
            <p className="text-xs text-slate-500 mt-1">{stats?.positive_outcomes || 0} successful</p>
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700">
        {/* Tabs as Segmented Control */}
        <div className="flex bg-slate-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: 'All Calls', icon: Phone },
            { id: 'my-calls', label: 'My Calls', icon: User },
            { id: 'team', label: 'Team', icon: Users },
            { id: 'ai-agents', label: 'AI Agents', icon: Bot },
            { id: 'live', label: 'Live', icon: null } // Handle icon specially
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              {tab.id === 'live' ? (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              ) : (
                tab.icon && <tab.icon className="w-3 h-3" />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 md:max-w-xl md:ml-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-gray-700 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-all ${showFilters
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              : 'bg-slate-100 dark:bg-gray-700 text-slate-500 hover:text-slate-700'
              }`}
          >
            <Filter size={18} />
          </button>
          <button className="p-2 bg-slate-100 dark:bg-gray-700 rounded-lg text-slate-500 hover:text-slate-700 transition-all">
            <Download size={18} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-2">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Call Type</label>
            <select
              value={filters.callType || 'all'}
              onChange={(e) => setFilters({ callType: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Calls</option>
              <option value="human">Human Only</option>
              <option value="ai_agent">AI Agents Only</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Direction</label>
            <select
              value={filters.direction || 'all'}
              onChange={(e) => setFilters({ direction: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
          </div>
          {/* Add other filters as needed */}
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden p-0 min-h-[500px]">
        {calls.length > 0 ? (
          <table className="w-full">
            <thead className={theme === 'soft-modern' ? "bg-base border-b border-default" : "bg-slate-50 dark:bg-gray-700 border-b-2 border-slate-100 dark:border-gray-600"}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">User/Agent</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Direction</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Duration</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Outcome</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
              {calls.map((call) => (
                <tr
                  key={call.id}
                  onClick={() => navigate(`/calls/${call.id}`)}
                  className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
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
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {call.agent_name || 'Team Member'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {call.call_type === 'ai_agent' ? `${call.agent_type} AI` : 'Human'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{getCustomerName(call)}</p>
                    <p className="text-xs text-slate-500">{call.customer_phone || call.phone_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {call.direction === 'inbound' ? (
                        <PhoneIncoming className="w-4 h-4 text-green-600" />
                      ) : (
                        <PhoneOutgoing className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="text-sm capitalize text-slate-700 dark:text-slate-300">{call.direction}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                    {call.duration_seconds ? formatDuration(call.duration_seconds) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {call.outcome && (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full
                        ${call.outcome === 'positive' ? 'bg-green-50 text-green-700' :
                          call.outcome === 'negative' ? 'bg-red-50 text-red-700' :
                            'bg-gray-100 text-gray-700'}
                      `}>
                        {call.outcome.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {call.started_at ? format(new Date(call.started_at), 'MMM d, h:mm a') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Phone className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No calls found</h3>
            <p className="text-slate-500 mb-6">Start tracking your customer communications</p>
            <button
              onClick={() => setShowLogCallModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 transition"
            >
              Log Your First Call
            </button>
          </div>
        )}
      </Card>

      <LogCallModal
        isOpen={showLogCallModal}
        onClose={() => setShowLogCallModal(false)}
        onSubmit={handleLogCall}
      />
    </PageContainer>
  );
}