import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
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
} from 'lucide-react';
import { useCoPilot } from '../contexts/CoPilotContext';

type NavItem = {
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
};

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/quotes', icon: FileText, label: 'Quotes' },
  { path: '/invoices', icon: DollarSign, label: 'Invoices' },
  { path: '/calls', icon: Phone, label: 'Calls' },
  { path: '/pipeline', icon: TrendingUp, label: 'Pipeline' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
];

const HOME_ITEM: NavItem = { path: '/dashboard', icon: LayoutGrid, label: 'Home' };
const SETTINGS_ITEM: NavItem = { path: '/settings', icon: Settings, label: 'Settings' };

export const DashboardLayout: React.FC = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>(DEFAULT_NAV_ITEMS);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthContext();
  const { isOpen: isCoPilotOpen, panelSide } = useCoPilot();
  const { fetchUserOrganizations } = useOrganizationStore();
  const location = useLocation();

  useEffect(() => {
    const savedOrder = localStorage.getItem('navItemsOrder');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        const orderedItems = parsedOrder
          .map((path: string) => DEFAULT_NAV_ITEMS.find(item => item.path === path))
          .filter(Boolean);

        const allPaths = new Set(parsedOrder);
        const newItems = DEFAULT_NAV_ITEMS.filter(item => !allPaths.has(item.path));

        setNavItems([...orderedItems, ...newItems]);
      } catch (e) {
        console.error('Failed to load nav order:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchUserOrganizations(user.id);
    }
  }, [user, fetchUserOrganizations]);

  const saveNavOrder = (items: NavItem[]) => {
    const order = items.map(item => item.path);
    localStorage.setItem('navItemsOrder', JSON.stringify(order));
  };

  const isActive = (path: string) => location.pathname === path;

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...navItems];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setNavItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    saveNavOrder(navItems);
  };

  const allNavItems = [HOME_ITEM, ...navItems, SETTINGS_ITEM];
  const mainNavItems = [HOME_ITEM, ...navItems.slice(0, 2)];
  const moreNavItems = [...navItems.slice(2), SETTINGS_ITEM];

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar - Hidden on Mobile */}
      <aside
        className={`${theme === 'soft-modern' ? "hidden md:flex md:flex-col md:w-64 sidebar" : "hidden md:flex md:flex-col md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"} transition-all duration-300 ${isCoPilotOpen && panelSide === 'left' ? 'md:ml-[400px]' : ''
          }`}
      >
        {/* Logo */}
        <div className={theme === 'soft-modern' ? "p-6 border-b border-default" : "p-4 border-b border-gray-200 dark:border-gray-700"}>
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

          {navItems.map((item, index) => (
            <div
              key={item.path}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative ${draggedIndex === index ? 'opacity-50' : ''}`}
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
                <GripVertical
                  size={16}
                  className={theme === 'soft-modern' ? "mr-2 opacity-0 group-hover:opacity-30 transition-opacity cursor-grab active:cursor-grabbing text-tertiary" : "mr-2 opacity-0 group-hover:opacity-50 transition-opacity cursor-grab active:cursor-grabbing"}
                />
                <item.icon size={20} className="mr-3" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </div>
          ))}

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

        {/* User Profile */}
        <div className={theme === 'soft-modern' ? "p-4 border-t border-default" : "p-4 border-t border-gray-200 dark:border-gray-700"}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className={theme === 'soft-modern' ? "w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium bg-base" : "w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium"}
                style={theme === 'soft-modern' ? {
                  background: 'var(--sm-accent-primary)',
                } : undefined}
              >
                A
              </div>
              <div className="ml-3">
                <p className={theme === 'soft-modern' ? "text-sm font-medium text-primary" : "text-sm font-medium text-gray-900 dark:text-white"}>Admin User</p>
                <p className={theme === 'soft-modern' ? "text-xs text-tertiary" : "text-xs text-gray-500 dark:text-gray-400"}>Dev Mode</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={theme === 'soft-modern' ? "p-2 rounded-lg transition-all btn-ghost" : "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"}
            >
              {theme === 'light' ? <Moon size={18} /> : theme === 'dark' ? <Sun size={18} /> : theme === 'soft-modern' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header - Shown on Mobile Only */}
      <header className="md:hidden sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-bold text-indigo-600">CxTrack</h1>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
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
          {mainNavItems.map((item) => (
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
    </div>
  );
};
