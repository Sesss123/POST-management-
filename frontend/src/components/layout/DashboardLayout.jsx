import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { 
  Menu,
  Bell,
  Clock,
  ChevronDown,
  X,
  WifiOff
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import SubscriptionBanner from '../subscription/SubscriptionBanner';
import LockedScreen from '../subscription/LockedScreen';
import LanguageSwitcher from '../common/LanguageSwitcher';
import NotificationDropdown from '../common/NotificationDropdown';
import UserMenu from './UserMenu';
import { cn } from '../../utils/cn';
import { useNetwork } from '../../hooks/useNetwork';

const DashboardLayout = () => {
  const { user } = useAuth();
  const { isLocked } = useSubscription();
  const location = useLocation();
  const isOnline = useNetwork();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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
            <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-slate-900 rounded-2xl text-white shadow-lg shadow-slate-900/20 border border-white/10 group transition-all hover:scale-105">
                <Clock size={16} className="text-indigo-400 animate-pulse" />
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em] leading-none mb-1">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-sm font-black tracking-tight leading-none">
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                </div>
            </div>
            
            <LanguageSwitcher />
            
            <NotificationDropdown />
            
            <UserMenu />
          </div>
        </header>

        {/* Subscription Banner — shown below topbar */}
        <SubscriptionBanner />

        {/* Offline Banner */}
        {!isOnline && (
            <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-3 shadow-md shrink-0 animate-in slide-in-from-top-2">
                <WifiOff size={18} className="animate-pulse" />
                <span className="text-sm font-semibold tracking-tight">Offline Mode: Internet unavailable. New bills will be saved as drafts.</span>
                <Link to="/offline-drafts" className="text-xs font-black underline hover:text-red-100 ml-2">
                    View Drafts
                </Link>
            </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className={cn(
                "mx-auto transition-all duration-300",
                location.pathname === '/cash-sale' || location.pathname === '/table-billing' ? "p-0 max-w-full" : "p-2 lg:p-4 max-w-[1600px]"
            )}>
                <Outlet />
            </div>
        </div>
      </main>

      {/* Locked Screen Overlay */}
      {isLocked && <LockedScreen />}

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
