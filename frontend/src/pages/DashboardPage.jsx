import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportApi } from '../api/api';
import { 
  ShoppingCart, 
  Utensils, 
  UserPlus, 
  Banknote, 
  CreditCard, 
  Users, 
  Receipt, 
  Grid3X3,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { StatCard, AppButton } from '../components/ui';
import { cn } from '../utils/cn';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await reportApi.getDashboard();
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
      desc: 'Quick paid invoice for walk-ins', 
      icon: ShoppingCart, 
      path: '/cash-sale', 
      color: 'bg-indigo-600',
      shadow: 'shadow-indigo-200'
    },
    { 
      label: 'Table Billing', 
      desc: 'Dine-in table orders and status', 
      icon: Utensils, 
      path: '/table-billing', 
      color: 'bg-emerald-600',
      shadow: 'shadow-emerald-200'
    },
    { 
      label: 'New Customer', 
      desc: 'Create credit/naya profile', 
      icon: UserPlus, 
      path: '/customers', 
      color: 'bg-purple-600',
      shadow: 'shadow-purple-200'
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, Control Center</h1>
          <p className="text-slate-500 font-medium">Manage your restaurant operations in real-time.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-[20px] shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                <Clock size={20} />
            </div>
            <div className="pr-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Time</p>
                <p className="text-sm font-bold text-slate-700">{new Date().toLocaleTimeString()}</p>
            </div>
        </div>
      </header>

      {/* Main Actions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {actionCards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className={cn(
              "p-8 rounded-[40px] text-left transition-all hover:-translate-y-2 group relative overflow-hidden h-64",
              card.color,
              card.shadow
            )}
          >
            <div className="relative z-10 h-full flex flex-col">
                <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center text-white mb-6">
                    <card.icon size={32} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{card.label}</h3>
                <p className="text-white/70 text-sm font-medium mb-auto">{card.desc}</p>
                <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest">
                    Open Module <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </div>
            </div>
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />
          </button>
        ))}
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Today Sales" 
            value={`Rs. ${parseFloat(stats?.todaySales || 0).toLocaleString()}`} 
            icon={Banknote} 
            variant="dark"
        />
        <StatCard 
            title="Cash Revenue" 
            value={`Rs. ${parseFloat(stats?.cashSales || 0).toLocaleString()}`} 
            icon={ShoppingCart} 
        />
        <StatCard 
            title="Credit Revenue" 
            value={`Rs. ${parseFloat(stats?.creditSales || 0).toLocaleString()}`} 
            icon={CreditCard} 
            variant="primary"
        />
        <StatCard 
            title="Total Naya Balance" 
            value={`Rs. ${parseFloat(stats?.totalNayaBalance || 0).toLocaleString()}`} 
            icon={Users} 
            variant="credit"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Recent Activity</h3>
                  <AppButton variant="ghost" size="sm" onClick={() => navigate('/invoices')}>View All</AppButton>
              </div>
              <div className="p-0">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="bg-slate-50/50">
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {stats?.recentInvoices?.map(inv => (
                              <tr key={inv.id} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="px-8 py-5">
                                      <p className="font-bold text-slate-900">{inv.invoice_no}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{new Date(inv.created_at).toLocaleTimeString()}</p>
                                  </td>
                                  <td className="px-8 py-5">
                                      <p className="text-sm font-bold text-slate-700">{inv.customer_name || 'Walk-in Guest'}</p>
                                  </td>
                                  <td className="px-8 py-5 text-right font-black text-slate-900">
                                      Rs. {parseFloat(inv.grand_total).toLocaleString()}
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                      <span className={cn(
                                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight",
                                          inv.payment_status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                      )}>
                                          {inv.payment_status}
                                      </span>
                                  </td>
                              </tr>
                          ))}
                          {(!stats?.recentInvoices || stats.recentInvoices.length === 0) && (
                              <tr><td colSpan={4} className="py-12 text-center text-slate-400 italic">No recent transactions today</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                          <Grid3X3 size={20} />
                      </div>
                      <h3 className="font-black text-slate-900 uppercase tracking-tight">System Summary</h3>
                  </div>
                  <div className="space-y-6">
                      <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Open Tables</span>
                          <span className="text-lg font-black text-slate-900">{stats?.openTables || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invoices Today</span>
                          <span className="text-lg font-black text-slate-900">{stats?.invoiceCount || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Customers</span>
                          <span className="text-lg font-black text-slate-900">{stats?.customerCount || 0}</span>
                      </div>
                  </div>
              </div>

              <div className="bg-indigo-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-900/20">
                  <div className="relative z-10">
                      <h4 className="text-lg font-black uppercase tracking-tight mb-2">Need Support?</h4>
                      <p className="text-indigo-100 text-sm mb-6 leading-relaxed">Check the user guide or contact system administrator for help with POS operations.</p>
                      <AppButton variant="secondary" size="sm" className="bg-white text-indigo-600 hover:bg-indigo-50 border-none shadow-none">View Help Guide</AppButton>
                  </div>
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </div>
          </div>
      </div>
    </div>
  );
};

export default DashboardPage;
