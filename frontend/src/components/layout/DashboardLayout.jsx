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
  WifiOff,
  Sun,
  Moon,
  ConciergeBell
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
import { initSocket, getSocket } from '../../api/socket';

const DashboardLayout = () => {
  const { user } = useAuth();
  const { isLocked } = useSubscription();
  const location = useLocation();
  const isOnline = useNetwork();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [customerAlerts, setCustomerAlerts] = useState([]);
  const [isAlertsDropdownOpen, setIsAlertsDropdownOpen] = useState(false);
  const alertsDropdownRef = React.useRef(null);

  const playAlertChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(293.66, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    } catch (err) {
      console.warn("Failed to play audio alert:", err);
    }
  };

  React.useEffect(() => {
    if (!user || !user.shop_id) return;
    
    const socket = initSocket(user.shop_id);
    if (!socket) return;

    const handleNewAlert = (alert) => {
      playAlertChime();
      setCustomerAlerts((prev) => {
        if (prev.some((a) => a.id === alert.id)) return prev;
        return [alert, ...prev];
      });
    };

    const handleAlertResolved = (data) => {
      setCustomerAlerts((prev) => prev.filter((a) => a.id !== data.alertId));
    };

    socket.on('new_customer_alert', handleNewAlert);
    socket.on('customer_alert_resolved', handleAlertResolved);

    return () => {
      socket.off('new_customer_alert', handleNewAlert);
      socket.off('customer_alert_resolved', handleAlertResolved);
    };
  }, [user]);

  const handleResolveAlert = (alertId) => {
    const socket = getSocket();
    if (socket && user && user.shop_id) {
      socket.emit('resolve_customer_alert', {
        alertId: alertId,
        shopId: user.shop_id
      });
    }
    setCustomerAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (alertsDropdownRef.current && !alertsDropdownRef.current.contains(event.target)) {
        setIsAlertsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

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
            
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors shadow-sm dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 flex items-center justify-center"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>
            
            <LanguageSwitcher />

            {/* Customer Real-time Alerts Badge & Dropdown */}
            {user && (
              <div className="relative" ref={alertsDropdownRef}>
                <button
                  onClick={() => setIsAlertsDropdownOpen(!isAlertsDropdownOpen)}
                  className={cn(
                    "p-2 lg:p-2.5 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all relative group flex items-center justify-center",
                    isAlertsDropdownOpen && "bg-slate-50 text-amber-600",
                    customerAlerts.length > 0 && "text-amber-500 hover:text-amber-600"
                  )}
                  title="Customer Assistance Requests"
                >
                  <ConciergeBell size={20} className={cn(customerAlerts.length > 0 && "animate-bounce")} style={{ animationDuration: '2s' }} />
                  {customerAlerts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white animate-pulse">
                      {customerAlerts.length}
                    </span>
                  )}
                </button>

                {isAlertsDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Customer Alerts</h3>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Real-time table assistance</p>
                      </div>
                      {customerAlerts.length > 0 && (
                        <span className="px-2 py-0.5 bg-amber-500 text-amber-950 text-[9px] font-black uppercase tracking-widest rounded-full">
                          {customerAlerts.length} Active
                        </span>
                      )}
                    </div>

                    <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                      {customerAlerts.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                          {customerAlerts.map((alert) => (
                            <div key={alert.id} className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[9px] font-black uppercase tracking-wider">
                                    Table {alert.tableNo}
                                  </span>
                                  <span className="text-[9px] text-slate-450 font-medium">
                                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-xs font-black text-slate-800">
                                  {alert.action === 'Call Waiter' ? '🔔 Waiter Requested' : '💵 Bill Requested'}
                                </p>
                              </div>
                              <button
                                onClick={() => handleResolveAlert(alert.id)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-indigo-600/10 active:scale-95 shrink-0"
                              >
                                Resolve
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 px-6 text-center">
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <ConciergeBell size={18} />
                          </div>
                          <h4 className="text-xs font-black text-slate-900 uppercase">No active requests</h4>
                          <p className="text-[11px] text-slate-450 mt-1 font-medium italic">Tables are fully satisfied.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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
