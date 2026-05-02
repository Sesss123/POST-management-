import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingCart, 
  Utensils, 
  BookOpen, 
  PauseCircle, 
  Receipt, 
  Calendar,
  Clock,
  ArrowRight,
  Banknote,
  Grid3X3,
  Zap
} from 'lucide-react';
import { StatCard, AppButton } from '../components/ui';
import { cn } from '../utils/cn';
import QuickRetailModal from '../components/pos/QuickRetailModal';

const CashierDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQuickRetail, setShowQuickRetail] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);
  const fetchStats = async () => {
    try {
      const { data } = await reportApi.getCashierDashboard();
      setStats(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const actionCards = [
    { 
      label: 'Cash Sale', 
      desc: 'Create quick paid invoice', 
      icon: ShoppingCart, 
      path: '/cash-sale', 
      color: 'bg-blue-600',
      shadow: 'shadow-blue-200'
    },
    { 
      label: 'Table Billing', 
      desc: 'Manage dine-in tables', 
      icon: Utensils, 
      path: '/table-billing', 
      color: 'bg-emerald-600',
      shadow: 'shadow-emerald-200'
    },
    { 
      label: 'Naya Payment', 
      desc: 'Receive customer credit payment', 
      icon: BookOpen, 
      path: '/naya-book', 
      color: 'bg-purple-600',
      shadow: 'shadow-purple-200'
    },
    { 
      label: 'Held Bills', 
      desc: 'Resume parked bills', 
      icon: PauseCircle, 
      path: '/held-bills', 
      color: 'bg-amber-500',
      shadow: 'shadow-amber-200'
    },
    { 
      label: 'Reservations', 
      desc: 'Manage table bookings', 
      icon: Calendar, 
      path: '/reservations', 
      color: 'bg-rose-500',
      shadow: 'shadow-rose-200'
    },
    { 
      label: 'Quick Retail (No-Bill)', 
      desc: 'Fast checkout, no bill', 
      icon: Zap, 
      action: () => navigate('/quick-retail'),
      color: 'bg-indigo-600',
      shadow: 'shadow-indigo-200'
    }
  ];


  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key;
      
      // Support Number Keys (1-9)
      if (key >= '1' && key <= String(actionCards.length)) {
        const index = parseInt(key) - 1;
        const card = actionCards[index];
        if (card.action) card.action();
        else navigate(card.path);
      }
      
      // Support Function Keys (F1-F9)
      if (key.startsWith('F') && key.length <= 3) {
        const num = parseInt(key.slice(1));
        if (!isNaN(num) && num >= 1 && num <= actionCards.length) {
            e.preventDefault();
            const card = actionCards[num - 1];
            if (card.action) card.action();
            else navigate(card.path);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actionCards, navigate]);

  const fetchShiftStatus = () => {
      // Logic for shift status
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome, {user?.name || 'Cashier'}</h1>
          <p className="text-slate-500 font-medium">Have a great shift today.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="bg-white p-2 px-4 rounded-[20px] shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Clock size={18} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Time</p>
                    <p className="text-sm font-bold text-slate-700">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
            </div>
            {/* Shift Status placeholder - can be updated to fetch actual shift status */}
            <div className="bg-emerald-50 border border-emerald-100 p-2 px-4 rounded-[20px] flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Shift Open</p>
            </div>
        </div>
      </header>

      {/* Main Actions Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {actionCards.map((card, index) => (
          <button
            key={card.label}
            onClick={() => card.action ? card.action() : navigate(card.path)}
            className={cn(
              "p-6 rounded-[32px] text-left transition-all hover:-translate-y-1 group relative overflow-hidden h-48",
              card.color,
              card.shadow
            )}
          >
            <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center justify-between mb-auto">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                        <card.icon size={24} />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight size={16} />
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-black text-white tracking-tight">{card.label}</h3>
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-lg text-white font-black border border-white/20">{index + 1}</span>
                    </div>
                    <p className="text-white/70 text-xs font-medium">{card.desc}</p>
                </div>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          </button>
        ))}
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Today Cash Sales" 
            value={`Rs. ${parseFloat(stats?.summary?.todayCash || 0).toLocaleString()}`} 
            icon={Banknote} 
            variant="dark"
        />
        <StatCard 
            title="Today Credit Sales" 
            value={`Rs. ${parseFloat(stats?.summary?.todayCredit || 0).toLocaleString()}`} 
            icon={BookOpen} 
            variant="primary"
        />
        <StatCard 
            title="Invoices Today" 
            value={stats?.summary?.invoiceCount || 0} 
            icon={Receipt} 
        />
        <StatCard 
            title="Open Tables" 
            value={stats?.summary?.openTables || 0} 
            icon={Grid3X3} 
            variant="credit"
        />
      </section>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Recent Invoices</h3>
              <AppButton variant="ghost" size="sm" onClick={() => navigate('/invoices')}>View All</AppButton>
          </div>
          <div className="p-0 overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                  <thead>
                      <tr className="bg-slate-50/50">
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice No</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {stats?.recentInvoices?.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-8 py-5">
                                  <p className="text-sm font-bold text-slate-700">{new Date(inv.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              </td>
                              <td className="px-8 py-5">
                                  <p className="font-bold text-slate-900">{inv.invoice_no}</p>
                                  {inv.customer_name && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate max-w-[120px]">{inv.customer_name}</p>}
                              </td>
                              <td className="px-8 py-5">
                                  <span className={cn(
                                      "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight",
                                      inv.invoice_type === 'cash_sale' ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"
                                  )}>
                                      {inv.invoice_type.replace('_', ' ')}
                                  </span>
                              </td>
                              <td className="px-8 py-5 text-right font-black text-slate-900">
                                  Rs. {parseFloat(inv.grand_total).toLocaleString()}
                              </td>
                          </tr>
                      ))}
                      {(!stats?.recentInvoices || stats.recentInvoices.length === 0) && (
                          <tr><td colSpan={4} className="py-12 text-center text-slate-400 italic">No transactions yet</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      <QuickRetailModal 
        isOpen={showQuickRetail} 
        onClose={() => setShowQuickRetail(false)}
        onSuccess={() => fetchStats()}
      />
    </div>
  );
};

export default CashierDashboard;
