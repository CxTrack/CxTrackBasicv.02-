import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useThemeStore } from '../stores/themeStore';
import { useOrganizationStore } from '../stores/organizationStore';
import { useAuthContext } from '../contexts/AuthContext';
import {
  LayoutGrid,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Phone,
  CheckSquare,
  Settings,
  Menu,
  X,
  Moon,
  Sun,
  Bell,
  Package,
  GripVertical,
  TrendingUp,
  Shield,
  MessageCircle,
  BarChart3,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useCoPilot } from '../contexts/CoPilotContext';
import { usePreferencesStore } from '../stores/preferencesStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BroadcastBanner } from '../components/BroadcastBanner';
import { CoPilotIntro } from '../components/tour/SubtleHints';



type NavItem = {
  path: string;
  icon: any;
  label: string;
  tourId?: string;
};

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { path: '/customers', icon: Users, label: 'Customers', tourId: 'customers' },
  { path: '/calendar', icon: Calendar, label: 'Calendar', tourId: 'calendar' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/quotes', icon: FileText, label: 'Quotes' },
  { path: '/invoices', icon: DollarSign, label: 'Invoices' },
  { path: '/calls', icon: Phone, label: 'Calls' },
  { path: '/pipeline', icon: TrendingUp, label: 'Pipeline', tourId: 'pipeline' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
];

const HOME_ITEM: NavItem = { path: '/dashboard', icon: LayoutGrid, label: 'Home' };
const SETTINGS_ITEM: NavItem = { path: '/settings', icon: Settings, label: 'Settings' };
const CHAT_ITEM: NavItem = { path: '/chat', icon: MessageCircle, label: 'Chat' };

interface SortableNavItemProps {
  item: NavItem;
  isActive: (path: string) => boolean;
  theme: string;
}

const SortableNavItem: React.FC<SortableNavItemProps> = ({ item, isActive, theme }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.path });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${isDragging ? 'z-50' : ''}`}
    >
      <Link
        to={item.path}
        className={
          theme === 'soft-modern'
            ? `nav-item flex items-center px-4 py-3 ${isActive(item.path) ? 'active' : ''}`
            : `flex items-center px-3 py-2 rounded-lg transition-colors ${isActive(item.path)
              ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`
        }
      >
        <div {...attributes} {...listeners} className="mr-2 cursor-grab active:cursor-grabbing">
          <GripVertical
            size={16}
            className={theme === 'soft-modern' ? "opacity-0 group-hover:opacity-30 transition-opacity text-tertiary" : "opacity-0 group-hover:opacity-50 transition-opacity"}
          />
        </div>
        <item.icon size={20} className="mr-3" />
        <span className="font-medium">{item.label}</span>
      </Link>
    </div>
  );
};

export const DashboardLayout: React.FC = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>(DEFAULT_NAV_ITEMS);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);


  const { theme, toggleTheme } = useThemeStore();
  const { preferences, saveSidebarOrder } = usePreferencesStore();
  const { fetchUserOrganizations, currentOrganization, demoMode } = useOrganizationStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { isOpen: isCoPilotOpen, panelSide } = useCoPilot();
  const { loadPreferences } = usePreferencesStore();

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user, loadPreferences]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        return;
      }

      if (demoMode) {
        // In demo mode, we'll allow access but show "Dev Mode"
        setIsSuperAdmin(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setIsSuperAdmin(data?.role === 'super_admin');
      } catch (error) {
        console.error('Failed to check admin status:', error);
        setIsSuperAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, demoMode]);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (preferences.sidebarOrder && preferences.sidebarOrder.length > 0) {
      const orderedItems = preferences.sidebarOrder
        .map((path) => DEFAULT_NAV_ITEMS.find(item => item.path === path))
        .filter((item): item is NavItem => !!item);

      // Add any missing default items
      const existingPaths = new Set(preferences.sidebarOrder);
      const missingItems = DEFAULT_NAV_ITEMS.filter(item => !existingPaths.has(item.path));

      setNavItems([...orderedItems, ...missingItems]);
    }
  }, [preferences.sidebarOrder]);

  useEffect(() => {
    if (user?.id) {
      fetchUserOrganizations(user.id);
    }
  }, [user, fetchUserOrganizations]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = navItems.findIndex(item => item.path === active.id);
    const newIndex = navItems.findIndex(item => item.path === over.id);

    const newItems = arrayMove(navItems, oldIndex, newIndex);
    setNavItems(newItems);

    // Save to Supabase via store
    await saveSidebarOrder(newItems.map(item => item.path));
  };

  const isModuleShared = (path: string) => {
    if (!currentOrganization?.metadata?.sharing) return true;

    const pathMap: Record<string, string> = {
      '/customers': 'customers',
      '/calendar': 'calendar',
      '/pipeline': 'pipeline',
      '/tasks': 'tasks',
      // Default to shared if not explicitly in the map or metadata
    };

    const key = pathMap[path];
    if (!key) return true;

    return currentOrganization.metadata.sharing[key] ?? true;
  };

  const visibleNavItems = navItems.filter(item => isModuleShared(item.path));

  // Mobile navigation logic: show Home, 3 custom items + "More"
  const mobileCustomPaths = preferences.mobileNavItems || ['/customers', '/calendar', '/products'];

  // Find the actual nav items for the preferred paths
  const mobileBottomNavItems = [
    HOME_ITEM,
    ...mobileCustomPaths
      .map(path => DEFAULT_NAV_ITEMS.find(item => item.path === path))
      .filter((item): item is NavItem => !!item)
  ].slice(0, 4);

  // All other visible items go to "More"
  const selectedPaths = new Set(mobileBottomNavItems.map(i => i.path));
  const moreNavItems = visibleNavItems.filter((item: NavItem) => !selectedPaths.has(item.path));

  // Ensure Settings is in More if not selected
  if (!selectedPaths.has('/settings') && !moreNavItems.some((i: NavItem) => i.path === '/settings')) {
    moreNavItems.push(SETTINGS_ITEM);
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
      <BroadcastBanner />
      {/* Desktop Sidebar - Hidden on Mobile */}
      <aside
        className={`hidden md:flex md:flex-col md:w-64 transition-all duration-300 ${theme === 'soft-modern'
            ? 'bg-white border-r border-gray-200/60'
            : 'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700'
          } ${isCoPilotOpen && panelSide === 'left' ? 'md:ml-[400px]' : ''}`}
      >
        {/* Logo */}
        <div className={theme === 'soft-modern' ? "p-6 border-b border-default" : "p-4 border-b border-gray-200 dark:border-gray-700"} data-tour="sidebar">
          <h1 className={theme === 'soft-modern' ? "text-xl font-semibold text-primary" : "text-xl font-bold text-gray-900 dark:text-white"}>CxTrack</h1>
        </div>

        {/* Navigation */}
        <nav className={theme === 'soft-modern' ? "flex-1 overflow-y-auto p-4 space-y-2" : "flex-1 overflow-y-auto p-4 space-y-1"}>
          <Link
            to={HOME_ITEM.path}
            className={
              theme === 'soft-modern'
                ? `nav-item flex items-center px-4 py-3 ${isActive(HOME_ITEM.path) ? 'active' : ''}`
                : `flex items-center px-3 py-2 rounded-lg transition-colors ${isActive(HOME_ITEM.path)
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
            }
          >
            <HOME_ITEM.icon size={20} className="mr-3" />
            <span className="font-medium">{HOME_ITEM.label}</span>
          </Link>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleNavItems.map(item => item.path)}
              strategy={verticalListSortingStrategy}
            >
              {visibleNavItems.map((item) => (
                <SortableNavItem
                  key={item.path}
                  item={item}
                  isActive={isActive}
                  theme={theme}
                />
              ))}
            </SortableContext>
          </DndContext>

          <Link
            to={SETTINGS_ITEM.path}
            className={
              theme === 'soft-modern'
                ? `nav-item flex items-center px-4 py-3 ${isActive(SETTINGS_ITEM.path) ? 'active' : ''}`
                : `flex items-center px-3 py-2 rounded-lg transition-colors ${isActive(SETTINGS_ITEM.path)
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
            }
          >
            <SETTINGS_ITEM.icon size={20} className="mr-3" />
            <span className="font-medium">{SETTINGS_ITEM.label}</span>
          </Link>

        </nav>

        {/* Pinned Chat Section */}
        <div className={theme === 'soft-modern' ? "px-4 py-2" : "px-4 py-2 border-t border-gray-200 dark:border-gray-700"}>
          <Link
            to={CHAT_ITEM.path}
            className={
              theme === 'soft-modern'
                ? `nav-item flex items-center justify-between px-4 py-3 ${isActive(CHAT_ITEM.path) ? 'active' : ''}`
                : `flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${isActive(CHAT_ITEM.path)
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
            }
          >
            <div className="flex items-center">
              <MessageCircle size={20} className="mr-3" />
              <span className="font-medium">Team Chat</span>
            </div>
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              3
            </span>
          </Link>

          {/* Reports Link */}
          <Link
            to="/reports"
            className={
              theme === 'soft-modern'
                ? `nav-item flex items-center px-4 py-3 mt-1 ${isActive('/reports') ? 'active' : ''}`
                : `flex items-center px-3 py-2 mt-1 rounded-lg transition-colors ${isActive('/reports')
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
            }
          >
            <BarChart3 size={20} className="mr-3" />
            <span className="font-medium">Reports</span>
          </Link>
        </div>

        {/* User Profile */}
        <div className={theme === 'soft-modern' ? "p-4 border-t border-default" : "p-4 border-t border-gray-200 dark:border-gray-700"}>
          <button
            onClick={() => isSuperAdmin && navigate('/admin')}
            className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${theme === 'soft-modern'
              ? 'hover:bg-slate-100 dark:hover:bg-slate-800'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <div className="flex items-center">
              <div
                className={theme === 'soft-modern' ? "w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-purple-600 to-blue-600 shadow-sm" : "w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm"}
              >
                A
              </div>
              <div className="ml-3 text-left">
                <p className={theme === 'soft-modern' ? "text-xs font-bold text-primary" : "text-xs font-bold text-gray-900 dark:text-white"}>Admin User</p>
                {isSuperAdmin ? (
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">Super Admin</p>
                ) : (
                  <p className={theme === 'soft-modern' ? "text-[10px] text-tertiary font-bold uppercase" : "text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase"}>Dev Mode</p>
                )}
              </div>
            </div>
            {isSuperAdmin && (
              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400 stroke-[2.5px]" />
            )}
          </button>

          <div className="mt-2 flex items-center justify-between px-3">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Theme</span>
            <button
              onClick={toggleTheme}
              className={theme === 'soft-modern' ? "p-1.5 rounded-lg transition-all btn-ghost" : "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header - Shown on Mobile Only */}
      <header className="md:hidden sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-base font-black text-indigo-600 tracking-tight">CxTrack</h1>
          <div className="flex items-center">
            <Link to="/calendar" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
              <Calendar size={18} />
            </Link>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative text-gray-500 dark:text-gray-400">
              <Bell size={18} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto pb-20 md:pb-0 transition-all duration-300 ${isCoPilotOpen ? (panelSide === 'left' ? 'md:ml-[400px]' : 'md:mr-[400px]') : ''
        }`}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation - Shown on Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {mobileBottomNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${isActive(item.path)
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400'
                }`}
            >
              <item.icon size={22} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="flex flex-col items-center justify-center flex-1 py-2 text-gray-500 dark:text-gray-400"
          >
            <Menu size={22} />
            <span className="text-xs mt-1 font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">More Options</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
              {moreNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg active:bg-gray-100 dark:active:bg-gray-600 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <item.icon size={20} className="mr-3 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                </Link>
              ))}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                    A
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Admin User</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dev Mode</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtle CoPilot Introduction */}
      <CoPilotIntro />
    </div>
  );
};
