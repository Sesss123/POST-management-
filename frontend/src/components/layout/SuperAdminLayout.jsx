import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  ShieldCheck, 
  Settings, 
  LogOut,
  Menu,
  X,
  HeartPulse,
  Database,
  Activity,
  CreditCard,
  Megaphone,
  MessageSquare,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const SuperAdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: 'Overview', path: '/super-admin', icon: LayoutDashboard },
    { label: 'Analytics', path: '/super-admin/analytics', icon: Activity },
    { label: 'Manage Shops', path: '/super-admin/shops', icon: Store },
    { label: 'Subscriptions', path: '/super-admin/subscriptions', icon: CreditCard },
    { label: 'Payments', path: '/super-admin/subscription-payments', icon: CreditCard },
    { label: 'Pricing Plans', path: '/super-admin/plans', icon: Layers },
    { label: 'Broadcasts', path: '/super-admin/announcements', icon: Megaphone },
    { label: 'Support Tickets', path: '/super-admin/tickets', icon: MessageSquare },
    { label: 'Platform Users', path: '/super-admin/users', icon: Users },
    { label: 'Feature Access', path: '/super-admin/permissions', icon: Layers },
    { label: 'System Health', path: '/super-admin/system-health', icon: HeartPulse },
    { label: 'Security Center', path: '/super-admin/security', icon: ShieldCheck },
    { label: 'Audit Logs', path: '/super-admin/audit-logs', icon: Database },
    { label: 'Backups', path: '/super-admin/backups', icon: Database },
    { label: 'Settings', path: '/super-admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 border-r border-white/5">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/50">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase">PLATFORM</h1>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto custom-scrollbar pb-10">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/super-admin'}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-5 py-3 rounded-2xl text-xs font-bold transition-all group",
                isActive 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/50" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5 bg-slate-900">
          <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black border border-indigo-500/10">
                {(user?.name?.[0] || 'U').toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">ROOT ADMIN</span>
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-white/5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={24} className="text-indigo-500" />
            <span className="font-black text-white tracking-tighter">PLATFORM</span>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-400">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-slate-900 shadow-2xl">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={24} className="text-indigo-500" />
                <span className="font-black text-white tracking-tighter uppercase">PLATFORM</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400">
                <X size={24} />
              </button>
            </div>
            <nav className="px-4 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/super-admin'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all",
                    isActive 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
};

export default SuperAdminLayout;
