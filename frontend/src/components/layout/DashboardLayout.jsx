import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Utensils, 
  Users, 
  BookOpen, 
  Receipt, 
  Package, 
  Grid3X3, 
  BarChart3, 
  ShieldCheck, 
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Clock
} from 'lucide-react';
import { cn } from '../../utils/cn';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Cash Sale', path: '/cash-sale', icon: ShoppingCart },
    { label: 'Table Billing', path: '/table-billing', icon: Utensils },
    { label: 'Naya Book', path: '/naya-book', icon: BookOpen },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Invoices', path: '/invoices', icon: Receipt },
    { label: 'Menu Items', path: '/items', icon: Package },
    { label: 'Tables', path: '/tables', icon: Grid3X3 },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  if (user?.role === 'admin') {
    navItems.push({ label: 'Users', path: '/users', icon: ShieldCheck });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const current = navItems.find(item => item.path === location.pathname);
    return current ? current.label : 'Details';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-slate-900 flex-col shrink-0 relative z-40">
        <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/50">
                    <Utensils size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-white tracking-tighter uppercase">RestoLedger</h1>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">POS & Credit System</p>
                </div>
            </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all group",
                isActive 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/50" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={20} className={cn("transition-transform group-hover:scale-110")} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-white/5 rounded-3xl p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
                      {user?.name?.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                      <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{user?.role}</span>
                  </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-bold text-xs uppercase tracking-widest"
              >
                <LogOut size={16} />
                Sign Out
              </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0 relative z-30">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-xl"
            >
                <Menu size={24} />
            </button>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-slate-400">
                <Clock size={16} />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
            </div>
            <div className="relative">
                <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-2xl transition-colors relative">
                    <Bell size={22} />
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                </button>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-black">
                {user?.name?.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-[1600px] mx-auto">
                <Outlet />
            </div>
        </div>
      </main>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 flex flex-col p-6 animate-in slide-in-from-left duration-300">
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black">RL</div>
                          <span className="text-white font-black uppercase tracking-tight">RestoLedger</span>
                      </div>
                      <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400"><X size={24} /></button>
                  </div>
                  <nav className="flex-1 space-y-1">
                      {navItems.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={({ isActive }) => cn(
                            "flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all",
                            isActive ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                          )}
                        >
                          <item.icon size={20} />
                          {item.label}
                        </NavLink>
                      ))}
                  </nav>
              </div>
          </div>
      )}
    </div>
  );
};

export default DashboardLayout;
