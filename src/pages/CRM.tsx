import { useEffect, useState } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useCRMStore } from '@/stores/crmStore';
import LeadsTable from '@/components/crm/LeadsTable';
import OpportunitiesTable from '@/components/crm/OpportunitiesTable';
import Tasks from '@/pages/Tasks';
import {
    Users, CheckCircle, DollarSign,
    Target, Plus, Search
} from 'lucide-react';
import { PageContainer, Card, IconBadge } from '@/components/theme/ThemeComponents';

export default function CRM() {
    const { theme } = useThemeStore();
    const { fetchLeads, fetchOpportunities, leads, opportunities } = useCRMStore();
    const [activeTab, setActiveTab] = useState<'leads' | 'opportunities' | 'tasks'>('leads');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchLeads();
        fetchOpportunities();
    }, []);

    // Calculate stats
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(l => l.status === 'qualified').length;
    const activeOpps = opportunities.filter(o => !['won', 'lost'].includes(o.stage)).length;
    const pipelineValue = opportunities
        .filter(o => !['won', 'lost'].includes(o.stage))
        .reduce((sum, o) => sum + (o.value * o.probability), 0);

    const getActionButton = () => {
        switch (activeTab) {
            case 'leads':
                return { label: 'New Lead', color: 'bg-blue-600 hover:bg-blue-700' };
            case 'opportunities':
                return { label: 'New Opportunity', color: 'bg-purple-600 hover:bg-purple-700' };
            case 'tasks':
                return { label: 'New Task', color: 'bg-teal-600 hover:bg-teal-700' };
        }
    };

    const actionConfig = getActionButton();

    return (
        <PageContainer className="gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        CRM
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Manage leads, opportunities, and customer relationships
                    </p>
                </div>

                <button
                    className={`flex items-center px-4 py-2 ${actionConfig.color} text-white rounded-lg transition-colors font-medium shadow-sm active:scale-95`}
                >
                    <Plus size={18} className="mr-2" />
                    {actionConfig.label}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card hover className="flex items-center gap-4 p-4 h-24">
                    <IconBadge
                        icon={<Users size={20} className="text-blue-600" />}
                        gradient="bg-blue-50"
                        size="md"
                    />
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Leads</p>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{totalLeads}</h3>
                    </div>
                </Card>

                <Card hover className="flex items-center gap-4 p-4 h-24">
                    <IconBadge
                        icon={<CheckCircle size={20} className="text-green-600" />}
                        gradient="bg-green-50"
                        size="md"
                    />
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Qualified</p>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{qualifiedLeads}</h3>
                    </div>
                </Card>

                <Card hover className="flex items-center gap-4 p-4 h-24">
                    <IconBadge
                        icon={<Target size={20} className="text-purple-600" />}
                        gradient="bg-purple-50"
                        size="md"
                    />
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Opportunities</p>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{activeOpps}</h3>
                    </div>
                </Card>

                <Card hover className="flex items-center gap-4 p-4 h-24">
                    <IconBadge
                        icon={<DollarSign size={20} className="text-orange-600" />}
                        gradient="bg-orange-50"
                        size="md"
                    />
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pipeline</p>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">${Math.round(pipelineValue).toLocaleString()}</h3>
                    </div>
                </Card>
            </div>

            {/* Unified Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700">
                <div className="flex bg-slate-100 dark:bg-gray-700 p-1 rounded-lg">
                    {(['leads', 'opportunities', 'tasks'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${activeTab === tab
                                ? 'bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 md:max-w-xl md:ml-8">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-gray-700 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <Card className="overflow-hidden p-0 min-h-[500px]">
                {activeTab === 'leads' && <LeadsTable />}
                {activeTab === 'opportunities' && <OpportunitiesTable />}
                {activeTab === 'tasks' && <Tasks embedded={true} />}
            </Card>
        </PageContainer>
    );
}
