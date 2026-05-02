import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Menu,
  Bell,
  Clock,
  ChevronDown,
  X
} from 'lucide-react';
import Sidebar from './Sidebar';
import { cn } from '../../utils/cn';

const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Map route to title (fallback to current Sidebar logic if needed)
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    const segment = path.split('/')[1];
    return segment ? segment.replace(/-/g, ' ').toUpperCase() : 'RestoLedger';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={cn(
        "hidden lg:block bg-slate-900 shrink-0 transition-all duration-300 relative z-40 overflow-hidden",
        isSidebarCollapsed ? "w-0" : "w-72"
      )}>
        <Sidebar />
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 lg:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 shrink-0 relative z-30">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
            >
                <Menu size={24} />
            </button>
            <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden lg:flex p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors items-center gap-2"
                title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
            >
                <Menu size={20} />
                {isSidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Open Menu</span>}
            </button>
            <h2 className="text-lg lg:text-2xl font-black text-slate-900 tracking-tight truncate">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-slate-400">
                <Clock size={16} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
            </div>
            
            <button className="p-2 lg:p-2.5 text-slate-400 hover:bg-slate-50 rounded-2xl transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-2 lg:gap-3 pl-2 border-l border-slate-100">
                <div className="hidden md:block text-right">
                    <p className="text-xs font-black text-slate-900 leading-none">{user?.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user?.role}</p>
                </div>
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs lg:text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className={cn(
                "mx-auto transition-all duration-300",
                location.pathname === '/cash-sale' || location.pathname === '/table-billing' ? "p-0 max-w-full" : "p-4 lg:p-8 max-w-[1600px]"
            )}>
                <Outlet />
            </div>
        </div>
      </main>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
              <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
                onClick={() => setIsMobileMenuOpen(false)} 
              />
              <div className="absolute left-0 top-0 bottom-0 shadow-2xl animate-in slide-in-from-left duration-300">
                  <Sidebar mobile onClose={() => setIsMobileMenuOpen(false)} />
              </div>
          </div>
      )}
    </div>
  );
};

export default DashboardLayout;
