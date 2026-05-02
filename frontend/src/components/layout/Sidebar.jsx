import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  BookOpen, 
  Receipt, 
  Menu as MenuIcon, 
  Grid3X3, 
  BarChart3, 
  UserCog, 
  LogOut,
  Clock,
  PauseCircle,
  ShieldCheck,
  ChefHat,
  History,
  Settings,
  Calendar,
  Package,
  Truck,
  X,
  Utensils,
  LineChart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { cn } from '../../utils/cn';

const SidebarLink = ({ item, onClick, isActive }) => (
  <NavLink
    to={item.path}
    onClick={onClick}
    className={cn(
      "flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden",
      isActive 
        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/50" 
        : "text-slate-400 hover:text-white hover:bg-white/5"
    )}
  >
    <item.icon size={20} className={cn("transition-transform group-hover:scale-110")} />
    {item.label}
    {isActive && (
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 rounded-l-full" />
    )}
  </NavLink>
);

const Sidebar = ({ mobile, onClose }) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const navigationGroups = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'cashier', 'kitchen'] },
      ]
    },
    {
      title: 'Sales & Billing',
      items: [
        { label: 'Cash Sale', path: '/cash-sale', icon: ShoppingCart, roles: ['cashier'] },
        { label: 'Table Billing', path: '/table-billing', icon: Utensils, roles: ['cashier', 'waiter'] },
        { label: 'Invoices', path: '/invoices', icon: Receipt, roles: ['admin', 'cashier'] },
        { label: 'Held Bills', path: '/held-bills', icon: PauseCircle, roles: ['admin', 'cashier'], enabled: settings.held_bills_enabled },
        { label: 'KOT Orders', path: '/kot-orders', icon: History, roles: ['admin', 'cashier', 'waiter'], enabled: settings.kot_enabled },
      ]
    },
    {
      title: 'Operations',
      items: [
        { label: 'Kitchen KDS', path: '/kitchen', icon: ChefHat, roles: ['admin', 'kitchen'] },
        { label: 'Reservations', path: '/reservations', icon: Calendar, roles: ['cashier'], enabled: settings.reservations_enabled },
        { label: 'User Shifts', path: '/shifts', icon: Clock, roles: ['admin', 'cashier'], enabled: settings.shift_system_enabled },
      ]
    },
    {
      title: 'Credit Management',
      items: [
        { label: 'Naya Book', path: '/naya-book', icon: BookOpen, roles: ['admin', 'cashier'], enabled: settings.naya_book_enabled },
        { label: 'Customers', path: '/customers', icon: Users, roles: ['admin', 'cashier'] },
      ]
    },
    {
      title: 'Inventory & Setup',
      items: [
        { label: 'Menu Items', path: '/items', icon: Package, roles: ['admin'] },
        { label: 'Tables', path: '/tables', icon: Grid3X3, roles: ['admin'] },
        { label: 'Suppliers', path: '/suppliers', icon: Truck, roles: ['admin'] },
        { label: 'Stock/Purchases', path: '/purchases', icon: Package, roles: ['admin'] },
      ]
    },
    {
      title: 'Admin & Reports',
      items: [
        { label: 'Business Intelligence', path: '/business-intelligence', icon: LineChart, roles: ['admin'] },
        { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin'] },
        { label: 'Users', path: '/users', icon: UserCog, roles: ['admin'] },
        { label: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck, roles: ['admin'] },
        { label: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
      ]
    }
  ];

  const filteredGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
        const roleAllowed = item.roles.includes(user?.role);
        const featureEnabled = item.enabled !== undefined ? item.enabled : true;
        return roleAllowed && featureEnabled;
    })
  })).filter(group => group.items.length > 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={cn(
        "flex flex-col h-full bg-slate-900",
        mobile ? "w-72" : "w-full"
    )}>
        {/* Header */}
        <div className="p-8 shrink-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/50 shrink-0">
                        <Utensils size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tighter uppercase">RestoLedger</h1>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">POS & Credit</p>
                    </div>
                </div>
                {mobile && (
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                )}
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar-hide pb-8">
          {filteredGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h3 className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarLink 
                      key={item.path} 
                      item={item} 
                      onClick={onClose} 
                      isActive={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
          <div className="bg-white/5 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black border border-indigo-500/10 shrink-0">
                      {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                      <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{user?.role}</span>
                  </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest"
              >
                <LogOut size={14} />
                Sign Out
              </button>
          </div>
        </div>
    </div>
  );
};

export default Sidebar;
