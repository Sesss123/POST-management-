import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  BookOpen, 
  FileText, 
  Menu, 
  Table, 
  BarChart3, 
  UserCog, 
  LogOut,
  ChevronLeft,
  Clock,
  PauseCircle,
  ShieldCheck,
  Kitchen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const SidebarItem = ({ icon: Icon, label, path, active }) => (
  <Link 
    to={path}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <Icon size={20} className={cn(active ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['admin', 'manager', 'cashier'] },
    { icon: ShoppingCart, label: 'Cash Sale', path: '/cash-sale', roles: ['admin', 'manager', 'cashier'] },
    { icon: Table, label: 'Table Billing', path: '/table-billing', roles: ['admin', 'manager', 'cashier', 'waiter'] },
    { icon: Clock, label: 'KOTs', path: '/kots', roles: ['admin', 'manager', 'cashier', 'waiter', 'kitchen'] },
    { icon: ShieldCheck, label: 'Kitchen Display', path: '/kitchen', roles: ['admin', 'manager', 'kitchen'] },
    { icon: Clock, label: 'Shift Mgmt', path: '/shifts', roles: ['admin', 'manager', 'cashier'] },
    { icon: PauseCircle, label: 'Held Bills', path: '/held-bills', roles: ['admin', 'manager', 'cashier'] },
    { icon: Users, label: 'Customers', path: '/customers', roles: ['admin', 'manager', 'cashier'] },
    { icon: BookOpen, label: 'Naya Book', path: '/naya-book', roles: ['admin', 'manager', 'cashier'] },
    { icon: FileText, label: 'Invoices', path: '/invoices', roles: ['admin', 'manager', 'cashier'] },
    { icon: Menu, label: 'Menu/Items', path: '/items', roles: ['admin', 'manager'] },
    { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['admin', 'manager'] },
    { icon: ShieldCheck, label: 'Settings', path: '/settings', roles: ['admin', 'manager'] },
    { icon: UserCog, label: 'Users', path: '/users', roles: ['admin'] },
    { icon: ShieldCheck, label: 'Audit Logs', path: '/audit-logs', roles: ['admin'] },
  ];

  const menuItems = allItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className="w-72 bg-slate-900 h-screen flex flex-col shadow-2xl border-r border-slate-800 fixed left-0 top-0 z-40">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10 group">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter leading-none">Resto<span className="text-indigo-400">Ledger</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">POS v2.0</p>
          </div>
        </div>

        <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar pr-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden",
                location.pathname === item.path
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <item.icon size={18} className={cn(
                "transition-transform duration-300",
                location.pathname === item.path ? "scale-110" : "group-hover:scale-110"
              )} />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
              {location.pathname === item.path && (
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/30 rounded-l-full" />
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center gap-3 mb-6 px-1">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400 font-black border border-slate-700">
                {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">{user?.name}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{user?.role}</p>
            </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-slate-400 rounded-2xl hover:bg-rose-600 hover:text-white transition-all duration-300 font-black text-[10px] uppercase tracking-[0.1em] group"
        >
          <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
