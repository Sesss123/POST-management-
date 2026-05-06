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
  LineChart,
  Lock,
  Wallet,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { cn } from '../../utils/cn';

const SidebarLink = ({ item, onClick, isActive, isBlocked }) => (
  isBlocked ? (
    <div
      title="Renew subscription to unlock"
      className="flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold opacity-30 cursor-not-allowed select-none text-slate-600"
    >
      <item.icon size={20} />
      {item.label}
      <Lock size={13} className="ml-auto" />
    </div>
  ) : (
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
  )
);

const Sidebar = ({ mobile, onClose }) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { isFeatureBlocked } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  const navigationGroups = [
    {
      title: t('common.main'),
      items: [
        { label: t('common.dashboard'), path: '/', icon: LayoutDashboard, roles: ['admin', 'cashier', 'kitchen'] },
      ]
    },
    {
      title: t('common.sales_billing'),
      items: [
        { label: t('common.cash_sale'), path: '/cash-sale', icon: ShoppingCart, roles: ['cashier'] },
        { label: t('common.table_billing'), path: '/table-billing', icon: Grid3X3, roles: ['admin', 'cashier', 'waiter'] },
        { label: t('common.delivery_hub'), path: '/delivery-orders', icon: Truck, roles: ['admin', 'cashier'] },
        { label: t('common.kitchen'), path: '/kitchen', icon: Utensils, roles: ['admin', 'kitchen'] },
        { label: t('common.held_bills'), path: '/held-bills', icon: PauseCircle, roles: ['admin', 'cashier'], enabled: settings.held_bills_enabled },
        { label: t('common.kot_orders'), path: '/kot-orders', icon: History, roles: ['admin', 'cashier', 'waiter'], enabled: settings.kot_enabled },
      ]
    },
    {
      title: t('common.operations'),
      items: [
        { label: t('common.kitchen_kds'), path: '/kitchen', icon: ChefHat, roles: ['admin', 'kitchen'] },
        { label: t('common.reservations'), path: '/reservations', icon: Calendar, roles: ['admin', 'cashier'], enabled: settings.reservations_enabled },
        { label: t('common.user_shifts'), path: '/shifts', icon: Clock, roles: ['admin', 'cashier'], enabled: settings.shift_system_enabled },
        { label: t('common.expenses'), path: '/expenses', icon: Wallet, roles: ['admin', 'cashier'] },
      ]
    },
    {
      title: t('common.credit_management'),
      items: [
        { label: t('common.naya_book'), path: '/naya-book', icon: BookOpen, roles: ['admin', 'cashier'], enabled: settings.naya_book_enabled },
        { label: t('common.customers'), path: '/customers', icon: Users, roles: ['admin', 'cashier'] },
      ]
    },
    {
      title: t('common.inventory_setup'),
      items: [
        { label: t('common.menu_items'), path: '/items', icon: Package, roles: ['admin'] },
        { label: t('common.tables'), path: '/tables', icon: Grid3X3, roles: ['admin'] },
        { label: t('common.suppliers'), path: '/suppliers', icon: Truck, roles: ['admin'] },
        { label: t('common.stock_purchases'), path: '/purchases', icon: Package, roles: ['admin'] },
      ]
    },
    {
      title: t('common.admin_reports'),
      items: [
        { label: t('common.business_intelligence'), path: '/business-intelligence', icon: LineChart, roles: ['admin'], featureKey: 'analytics' },
        { label: t('common.marketing_center'), path: '/marketing', icon: Megaphone, roles: ['admin'] },
        { label: t('common.reports'), path: '/reports', icon: BarChart3, roles: ['admin'], featureKey: 'reports' },
        { label: t('common.users'), path: '/users', icon: UserCog, roles: ['admin'], featureKey: 'users_write' },
        { label: t('common.audit_logs'), path: '/audit-logs', icon: ShieldCheck, roles: ['admin'], featureKey: 'audit-logs' },
        { label: t('common.settings'), path: '/settings', icon: Settings, roles: ['admin'], featureKey: 'settings_write' },
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
                        <h1 className="text-xl font-black text-white tracking-tighter uppercase">{user?.shopName || 'RestoLedger'}</h1>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{user?.shopName ? 'RestoLedger POS' : 'POS & Credit'}</p>
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
                      isBlocked={item.featureKey ? isFeatureBlocked(item.featureKey) : false}
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
